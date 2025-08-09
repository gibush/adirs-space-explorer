import jwt
import bcrypt
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
from functools import wraps
from .db import db


class AuthenticationService:
    """
    JWT-based authentication service using the local JSON database.
    """
    
    def __init__(self):
        # Use environment variable for JWT secret, fallback to a default for development
        self.jwt_secret = os.getenv('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production')
        self.jwt_algorithm = 'HS256'
        self.jwt_expiration_hours = 24  # Token expires after 24 hours
        
        # Ensure users collection exists
        db.createCollection("users")
    
    def _hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def _verify_password(self, password: str, hashed: str) -> bool:
        """Verify a password against its hash."""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def _generate_token(self, user_id: str, email: str) -> str:
        """Generate a JWT token for the user."""
        payload = {
            'user_id': user_id,
            'email': email,
            'exp': datetime.utcnow() + timedelta(hours=self.jwt_expiration_hours),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
    
    def _decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None  # Token expired
        except jwt.InvalidTokenError:
            return None  # Invalid token
    
    def signup(self, email: str, password: str, first_name: str = "", last_name: str = "", **additional_fields) -> Tuple[bool, str, Optional[str], Optional[Dict[str, Any]]]:
        """
        Register a new user and generate a JWT token.
        
        Args:
            email: User's email address
            password: User's password (will be hashed)
            first_name: User's first name
            last_name: User's last name
            **additional_fields: Additional user data
            
        Returns:
            tuple: (success: bool, message: str, token: str or None, user_data: dict or None)
        """
        # Validate input
        if not email or not password:
            return False, "Email and password are required", None, None
        
        if not first_name or not last_name:
            return False, "First name and last name are required", None, None
        
        if len(password) < 6:
            return False, "Password must be at least 6 characters long", None, None
        
        # Check if user already exists
        existing_users = db.get("users")
        for user in existing_users:
            if user.get('email', '').lower() == email.lower():
                return False, "User with this email already exists", None, None
        
        # Hash password
        hashed_password = self._hash_password(password)
        
        # Create user data
        user_data = {
            'email': email.lower(),
            'password': hashed_password,
            'first_name': first_name.strip(),
            'last_name': last_name.strip(),
            'created_at': datetime.utcnow().isoformat(),
            **additional_fields
        }
        
        # Save user to database
        try:
            created_user = db.add("users", user_data)
            
            # Generate JWT token for the new user
            token = self._generate_token(created_user['id'], created_user['email'])
            
            # Remove password from response
            safe_user_data = created_user.copy()
            safe_user_data.pop('password', None)
            
            return True, "User created successfully", token, safe_user_data
            
        except Exception as e:
            return False, f"Error creating user: {str(e)}", None, None
    
    def login(self, email: str, password: str) -> Tuple[bool, str, Optional[str], Optional[Dict[str, Any]]]:
        """
        Authenticate a user and return a JWT token.
        
        Args:
            email: User's email address
            password: User's password
            
        Returns:
            tuple: (success: bool, message: str, token: str or None, user_data: dict or None)
        """
        # Validate input
        if not email or not password:
            return False, "Email and password are required", None, None
        
        # Find user in database
        users = db.get("users")
        user = None
        for u in users:
            if u.get('email', '').lower() == email.lower():
                user = u
                break
        
        if not user:
            return False, "Invalid email or password", None, None
        
        # Verify password
        if not self._verify_password(password, user['password']):
            return False, "Invalid email or password", None, None
        
        # Generate JWT token
        try:
            token = self._generate_token(user['id'], user['email'])
            
            # Update last login
            db.update("users", user['id'], {
                'last_login': datetime.utcnow().isoformat()
            })
            
            # Remove password from response
            safe_user_data = user.copy()
            safe_user_data.pop('password', None)
            
            return True, "Login successful", token, safe_user_data
            
        except Exception as e:
            return False, f"Error generating token: {str(e)}", None, None
    
    def verify_token(self, token: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Verify a JWT token and return user data.
        
        Args:
            token: JWT token to verify
            
        Returns:
            tuple: (valid: bool, message: str, user_data: dict or None)
        """
        if not token:
            return False, "Token is required", None
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Decode token
        payload = self._decode_token(token)
        if not payload:
            return False, "Invalid or expired token", None
        
        # Get user from database to ensure they still exist
        user = db.getOne("users", payload['user_id'])
        if not user:
            return False, "User not found", None
        
        # Remove password from response
        safe_user_data = user.copy()
        safe_user_data.pop('password', None)
        
        return True, "Token is valid", safe_user_data
    
    def isAuth(self, request_headers: Dict[str, str]) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Middleware function to check if a request is authenticated.
        
        Args:
            request_headers: HTTP request headers dictionary
            
        Returns:
            tuple: (authenticated: bool, message: str, user_data: dict or None)
        """
        # Get token from Authorization header
        auth_header = request_headers.get('Authorization') or request_headers.get('authorization')
        
        if not auth_header:
            return False, "Authorization header is missing", None
        
        # Verify the token
        return self.verify_token(auth_header)
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user data by ID (without password).
        
        Args:
            user_id: User's ID
            
        Returns:
            dict: User data without password, or None if not found
        """
        user = db.getOne("users", user_id)
        if user:
            safe_user_data = user.copy()
            safe_user_data.pop('password', None)
            return safe_user_data
        return None
    
    def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Update user data (excluding password and email).
        
        Args:
            user_id: User's ID
            update_data: Data to update (password and email changes not allowed here)
            
        Returns:
            tuple: (success: bool, message: str, user_data: dict or None)
        """
        # Remove sensitive fields that shouldn't be updated this way
        safe_update_data = update_data.copy()
        safe_update_data.pop('password', None)
        safe_update_data.pop('email', None)
        safe_update_data.pop('id', None)
        
        if not safe_update_data:
            return False, "No valid fields to update", None
        
        # Add updated timestamp
        safe_update_data['updated_at'] = datetime.utcnow().isoformat()
        
        # Update user
        updated_user = db.update("users", user_id, safe_update_data, upsert=False)
        
        if updated_user:
            # Remove password from response
            safe_user_data = updated_user.copy()
            safe_user_data.pop('password', None)
            return True, "User updated successfully", safe_user_data
        else:
            return False, "User not found", None


# Create singleton instance
auth_service = AuthenticationService()


# Decorator for route protection (for use with Flask/FastAPI)
def require_auth(f):
    """
    Decorator to protect routes with authentication.
    
    Usage:
        @require_auth
        def protected_route():
            # Access current user via g.current_user (Flask) or request.state.current_user (FastAPI)
            pass
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # This is a placeholder - actual implementation will depend on the web framework
        # For Flask: use request.headers and g.current_user
        # For FastAPI: use request.headers and request.state.current_user
        pass
    return decorated_function
