from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from services.authentication import auth_service
from services.search_history import search_history_service

router = APIRouter(prefix="/api/search", tags=["search"])
security = HTTPBearer()

# Response models
class SearchHistoryEntry(BaseModel):
    id: str
    search_term: str
    timestamp: str
    created_at: str

class SearchHistoryResponse(BaseModel):
    success: bool
    data: List[SearchHistoryEntry]
    total: int

class DeleteResponse(BaseModel):
    success: bool
    message: str

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

@router.get("/history", response_model=SearchHistoryResponse)
async def get_search_history(
    offset: int = Query(0, ge=0, description="Number of entries to skip"),
    limit: int = Query(30, ge=0, le=100, description="Maximum number of entries to return (0 for no limit)"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get the authenticated user's search history with pagination.
    
    Args:
        offset: Number of entries to skip (for pagination)
        limit: Maximum number of entries to return (0 for no limit, max 100)
        current_user: Authenticated user data (from dependency)
        
    Returns:
        SearchHistoryResponse with paginated search history
        
    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 400 if pagination parameters are invalid
        HTTPException: 500 if server error occurs
    """
    try:
        user_id = current_user["id"]
        
        # Get paginated search history
        search_history = search_history_service.get_user_search_history(
            user_id=user_id,
            offset=offset,
            limit=limit
        )
        
        # Get total count for pagination info (using limit=0 to get all)
        total_history = search_history_service.get_user_search_history(
            user_id=user_id,
            offset=0,
            limit=0
        )
        total_count = len(total_history)
        
        # Convert to response model
        history_entries = [
            SearchHistoryEntry(
                id=entry["id"],
                search_term=entry["search_term"],
                timestamp=entry["timestamp"],
                created_at=entry["created_at"]
            )
            for entry in search_history
        ]
        
        return SearchHistoryResponse(
            success=True,
            data=history_entries,
            total=total_count
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving search history"
        )

@router.delete("/{search_id}", response_model=DeleteResponse)
async def delete_search_entry(
    search_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete a specific search history entry.
    
    Args:
        search_id: ID of the search entry to delete
        current_user: Authenticated user data (from dependency)
        
    Returns:
        DeleteResponse indicating success or failure
        
    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 404 if search entry not found or not owned by user
        HTTPException: 500 if server error occurs
    """
    try:
        user_id = current_user["id"]
        
        # Attempt to delete the search entry
        deleted = search_history_service.delete_user_search(
            user_id=user_id,
            search_id=search_id
        )
        
        if deleted:
            return DeleteResponse(
                success=True,
                message="Search entry deleted successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Search entry not found or you don't have permission to delete it"
            )
            
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting search entry"
        )

@router.delete("/history", response_model=DeleteResponse)
async def delete_all_search_history(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete all search history for the authenticated user.
    
    Args:
        current_user: Authenticated user data (from dependency)
        
    Returns:
        DeleteResponse with count of deleted entries
        
    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 500 if server error occurs
    """
    try:
        user_id = current_user["id"]
        
        # Delete all search history for the user
        deleted_count = search_history_service.delete_all_user_search_history(user_id)
        
        return DeleteResponse(
            success=True,
            message=f"Successfully deleted {deleted_count} search history entries"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting search history"
        )
