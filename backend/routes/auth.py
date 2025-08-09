from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, Optional
from services.authentication import auth_service

router = APIRouter(prefix="/api", tags=["authentication"])

# Request models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ValidateTokenRequest(BaseModel):
    token: str

# Response models
class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    created_at: str

class SignupResponse(BaseModel):
    success: bool
    message: str
    user: UserResponse
    token: Optional[str] = None

class LoginResponse(BaseModel):
    success: bool
    message: str
    token: str
    user: UserResponse

class ValidateTokenResponse(BaseModel):
    valid: bool
    message: str
    user: Optional[UserResponse] = None

class MeResponse(BaseModel):
    success: bool
    message: str
    user: UserResponse

@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(request: SignupRequest):
    """
    Register a new user account and return a JWT token.
    
    Args:
        request: SignupRequest containing email, password, first_name, and last_name
        
    Returns:
        SignupResponse with success status, message, user data, and JWT token
        
    Raises:
        HTTPException: 400 if signup fails (validation error, user exists, etc.)
        HTTPException: 500 if server error occurs
    """
    try:
        success, message, token, user_data = auth_service.signup(
            email=request.email,
            password=request.password,
            first_name=request.first_name,
            last_name=request.last_name
        )
        
        if success and user_data and token:
            return SignupResponse(
                success=True,
                message=message,
                user=UserResponse(
                    id=user_data["id"],
                    email=user_data["email"],
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    created_at=user_data["created_at"]
                ),
                token=token
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
            
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during signup"
        )

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate a user and return a JWT token.
    
    Args:
        request: LoginRequest containing email and password
        
    Returns:
        LoginResponse with success status, message, token, and user data
        
    Raises:
        HTTPException: 401 if credentials are invalid
        HTTPException: 400 if request is malformed
        HTTPException: 500 if server error occurs
    """
    try:
        success, message, token, user_data = auth_service.login(
            email=request.email,
            password=request.password
        )
        
        if success and token and user_data:
            return LoginResponse(
                success=True,
                message=message,
                token=token,
                user=UserResponse(
                    id=user_data["id"],
                    email=user_data["email"],
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    created_at=user_data["created_at"]
                )
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=message or "Invalid credentials"
            )
            
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )

@router.post("/auth/validate", response_model=ValidateTokenResponse)
async def validate_token(request: ValidateTokenRequest):
    """
    Validate a JWT token and return user data if valid.
    
    Args:
        request: ValidateTokenRequest containing the token to validate
        
    Returns:
        ValidateTokenResponse with validation status, message, and user data
        
    Raises:
        HTTPException: 401 if token is invalid or expired
        HTTPException: 400 if request is malformed
        HTTPException: 500 if server error occurs
    """
    try:
        valid, message, user_data = auth_service.verify_token(request.token)
        
        if valid and user_data:
            return ValidateTokenResponse(
                valid=True,
                message=message,
                user=UserResponse(
                    id=user_data["id"],
                    email=user_data["email"],
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    created_at=user_data["created_at"]
                )
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=message or "Invalid or expired token"
            )
            
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during token validation"
        )

@router.get("/auth/me", response_model=MeResponse)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Get current user details using the Authorization header.
    
    Args:
        authorization: JWT token in Authorization header (Bearer <token>)
        
    Returns:
        MeResponse with success status, message, and user data
        
    Raises:
        HTTPException: 401 if token is missing, invalid, or expired
        HTTPException: 500 if server error occurs
    """
    try:
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header is required"
            )
        
        valid, message, user_data = auth_service.verify_token(authorization)
        
        if valid and user_data:
            return MeResponse(
                success=True,
                message="User details retrieved successfully",
                user=UserResponse(
                    id=user_data["id"],
                    email=user_data["email"],
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    created_at=user_data["created_at"]
                )
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=message or "Invalid or expired token"
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving user details"
        )
