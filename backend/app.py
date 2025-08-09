import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from routes import auth_router, search_router, sources_router

# Load environment variables
load_dotenv()

# Get environment variables
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Configure logging
logging.basicConfig(
    level=logging.INFO if DEV_MODE else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# FastAPI app configuration
app_config = {
    "title": "Space Explorer API",
    "description": "API for exploring space images and managing user search history",
    "version": "1.0.0",
}

# Hide docs in production
if not DEV_MODE:
    app_config.update({
        "docs_url": None,
        "redoc_url": None,
        "openapi_url": None,
    })

app = FastAPI(**app_config)

# Security middleware - add trusted host middleware first
if not DEV_MODE:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=ALLOWED_HOSTS
    )

# Add GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS configuration based on environment
if DEV_MODE:
    # Development CORS - more permissive
    cors_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
    ]
    cors_methods = ["*"]
    cors_headers = ["*"]
else:
    # Production CORS - restrictive
    cors_origins = [FRONTEND_URL] if FRONTEND_URL else []
    cors_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    cors_headers = [
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=cors_methods,
    allow_headers=cors_headers,
    expose_headers=["Content-Range", "X-Content-Range"] if not DEV_MODE else ["*"],
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    
    if not DEV_MODE:
        # Add security headers for production
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
    
    return response

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Space Explorer API is running",
        "version": "1.0.0",
        "environment": "development" if DEV_MODE else "production"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": "development" if DEV_MODE else "production"}

# Include routers
app.include_router(auth_router)
app.include_router(search_router)
app.include_router(sources_router)

# Log startup information
@app.on_event("startup")
async def startup_event():
    logger.info(f"Space Explorer API starting in {'development' if DEV_MODE else 'production'} mode")
    if DEV_MODE:
        logger.info("Development mode: API docs available at /docs and /redoc")
    else:
        logger.info("Production mode: API docs disabled for security")
