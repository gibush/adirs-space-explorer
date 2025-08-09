from fastapi import APIRouter, Query, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional, Dict, Any
from models import Source
from services.nasa_service import search_images
from services.authentication import auth_service
from services.search_history import search_history_service

router = APIRouter(prefix="/api", tags=["sources"])
security = HTTPBearer()

# Dependency for authentication
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency to authenticate user and return user data.
    
    Args:
        credentials: Bearer token from Authorization header
        
    Returns:
        Dict containing user data
        
    Raises:
        HTTPException: 401 if authentication fails
    """
    try:
        authenticated, message, user_data = auth_service.isAuth({
            "Authorization": f"Bearer {credentials.credentials}"
        })
        
        if authenticated and user_data:
            return user_data
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=message or "Authentication failed",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/sources", response_model=List[Source])
async def get_sources(
    offset: int = 0,
    limit: Optional[int] = None,
    q: Optional[str] = Query(None, description="Search query for NASA images"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get space images and sources from NASA with pagination support.
    Requires authentication. Tracks search history for authenticated user.
    
    Args:
        offset: Number of items to skip (for pagination, default: 0)
        limit: Maximum number of items to return (default: 30)
        q: Search query for NASA images (optional)
        current_user: Authenticated user data (from dependency)
        
    Returns:
        List of Source objects containing space images and metadata
        
    Note:
        This endpoint maps offset/limit pagination to NASA API's page-based system.
        The NASA API uses 1-based page numbering.
        
    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 500 if server error occurs
    """
    try:
        # Map offset/limit to NASA API paging (page is 1-based)
        effective_limit = limit if limit is not None and limit > 0 else 30
        page = (max(offset, 0) // effective_limit) + 1
        
        # Get search results from NASA API
        results = search_images(query=q, page=page, page_size=effective_limit)
        
        # Track search history if there's a search query
        if q and q.strip():
            try:
                user_id = current_user["id"]
                search_history_service.save_or_update_user_search(
                    user_id=user_id,
                    search_term=q.strip()
                )
            except Exception as search_error:
                # Log the error but don't fail the main request
                # In a production app, you'd want proper logging here
                print(f"Failed to save search history: {search_error}")
        
        return results
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions (like NASA API errors)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving sources"
        )
