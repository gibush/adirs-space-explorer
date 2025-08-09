"""
Routes package for the Space Explorer API.

This package contains all the API route definitions organized by functionality:
- auth.py: Authentication routes (signup, login)
- search.py: Search history routes (get, delete)
- sources.py: NASA sources and images routes (get sources)
"""

from .auth import router as auth_router
from .search import router as search_router
from .sources import router as sources_router

__all__ = ["auth_router", "search_router", "sources_router"]
