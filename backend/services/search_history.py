from datetime import datetime
from typing import Dict, List, Any, Optional
from .db import db


class SearchHistoryService:
    """
    Service for managing user-specific search history using the local JSON database.
    Each search entry contains the search term, timestamp, and user association.
    """
    
    def __init__(self):
        # Collection name for storing search history
        self.collection_name = "search_history"
        
        # Ensure the search history collection exists
        db.createCollection(self.collection_name)
    
    def save_user_search(self, user_id: str, search_term: str) -> Dict[str, Any]:
        """
        Save a user's search term to their search history.
        
        Args:
            user_id: The ID of the user performing the search
            search_term: The search term being saved
            
        Returns:
            dict: The saved search history entry with generated ID and timestamp
        """
        if not user_id or not search_term:
            raise ValueError("user_id and search_term are required")
        
        # Clean up the search term
        search_term = search_term.strip()
        if not search_term:
            raise ValueError("search_term cannot be empty")
        
        # Create search history entry
        search_entry = {
            "user_id": user_id,
            "search_term": search_term,
            "timestamp": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Save to database
        saved_entry = db.add(self.collection_name, search_entry)
        
        return saved_entry
    
    def save_or_update_user_search(self, user_id: str, search_term: str) -> Dict[str, Any]:
        """
        Save a user's search term to their search history, or update the timestamp if it already exists.
        This prevents duplicate search terms while maintaining recency order.
        
        Args:
            user_id: The ID of the user performing the search
            search_term: The search term being saved
            
        Returns:
            dict: The saved or updated search history entry with ID and timestamp
        """
        if not user_id or not search_term:
            raise ValueError("user_id and search_term are required")
        
        # Clean up the search term
        search_term = search_term.strip()
        if not search_term:
            raise ValueError("search_term cannot be empty")
        
        # Check if this search term already exists for this user
        user_history = self.get_user_search_history(user_id, offset=0, limit=0)
        existing_entry = None
        
        for entry in user_history:
            if entry.get("search_term", "").strip().lower() == search_term.lower():
                existing_entry = entry
                break
        
        current_time = datetime.utcnow().isoformat()
        
        if existing_entry:
            # Update the existing entry's timestamp
            updated_entry = db.update(self.collection_name, existing_entry["id"], {
                "timestamp": current_time,
                "updated_at": current_time
            })
            return updated_entry
        else:
            # Create new search history entry
            search_entry = {
                "user_id": user_id,
                "search_term": search_term,
                "timestamp": current_time,
                "created_at": current_time
            }
            
            # Save to database
            saved_entry = db.add(self.collection_name, search_entry)
            return saved_entry
    
    def get_user_search_history(self, user_id: str, offset: Optional[int] = 0, limit: Optional[int] = 30) -> List[Dict[str, Any]]:
        """
        Retrieve a user's search history with pagination, ordered by most recent first.
        
        Args:
            user_id: The ID of the user whose search history to retrieve
            offset: Number of entries to skip (for pagination, default: 0)
            limit: Maximum number of results to return (default: 30, use 0 for no limit)
            
        Returns:
            list: List of search history entries for the user, sorted by timestamp (newest first)
        """
        if not user_id:
            raise ValueError("user_id is required")
        
        # Validate pagination parameters
        if offset is not None and offset < 0:
            raise ValueError("offset must be 0 or greater")
        
        if limit is not None and limit < 0:
            raise ValueError("limit must be 0 or greater (0 means no limit)")
        
        # Set defaults (handle None vs 0 explicitly)
        if offset is None:
            offset = 0
        if limit is None:
            limit = 30
        
        # Get all search history
        all_history = db.get(self.collection_name)
        
        # Filter by user_id
        user_history = [
            entry for entry in all_history 
            if entry.get("user_id") == user_id
        ]
        
        # Sort by timestamp (newest first)
        user_history.sort(
            key=lambda x: x.get("timestamp", ""), 
            reverse=True
        )
        
        # Apply pagination (offset and limit)
        if limit > 0:
            # Normal pagination with both offset and limit
            start_index = offset
            end_index = offset + limit
            user_history = user_history[start_index:end_index]
        elif limit == 0:
            # If limit is 0, return all entries from offset onwards
            if offset > 0:
                user_history = user_history[offset:]
            # If both offset and limit are 0, return all entries (no slicing needed)
        else:
            # This shouldn't happen due to validation, but handle negative limit
            user_history = []
        
        return user_history
    
    def delete_user_search(self, user_id: str, search_id: str) -> bool:
        """
        Delete a specific search entry for a user.
        
        Args:
            user_id: The ID of the user who owns the search entry
            search_id: The ID of the search entry to delete
            
        Returns:
            bool: True if the search entry was deleted, False if not found or not owned by user
        """
        if not user_id or not search_id:
            raise ValueError("user_id and search_id are required")
        
        # First, verify the search entry exists and belongs to the user
        search_entry = db.getOne(self.collection_name, search_id)
        
        if not search_entry:
            return False  # Search entry not found
        
        if search_entry.get("user_id") != user_id:
            return False  # Search entry doesn't belong to this user
        
        # Delete the search entry
        return db.delete(self.collection_name, search_id)
    
    def delete_all_user_search_history(self, user_id: str) -> int:
        """
        Delete all search history entries for a specific user.
        
        Args:
            user_id: The ID of the user whose search history to delete
            
        Returns:
            int: Number of search entries deleted
        """
        if not user_id:
            raise ValueError("user_id is required")
        
        # Get all search history for the user (no pagination for deletion)
        user_history = self.get_user_search_history(user_id, offset=0, limit=0)
        
        # Delete each entry
        deleted_count = 0
        for entry in user_history:
            if db.delete(self.collection_name, entry["id"]):
                deleted_count += 1
        
        return deleted_count
    
    def get_user_unique_search_terms(self, user_id: str, limit: Optional[int] = None) -> List[str]:
        """
        Get unique search terms for a user (useful for search suggestions).
        
        Args:
            user_id: The ID of the user
            limit: Optional limit on number of unique terms to return
            
        Returns:
            list: List of unique search terms, ordered by most recent usage
        """
        if not user_id:
            raise ValueError("user_id is required")
        
        # Get user's search history (all entries for unique terms)
        user_history = self.get_user_search_history(user_id, offset=0, limit=0)
        
        # Extract unique search terms while preserving order
        seen = set()
        unique_terms = []
        
        for entry in user_history:
            search_term = entry.get("search_term", "").strip()
            if search_term and search_term.lower() not in seen:
                seen.add(search_term.lower())
                unique_terms.append(search_term)
        
        # Apply limit if specified
        if limit is not None and limit > 0:
            unique_terms = unique_terms[:limit]
        
        return unique_terms
    
    def search_user_history(self, user_id: str, query: str) -> List[Dict[str, Any]]:
        """
        Search through a user's search history for entries containing a specific query.
        
        Args:
            user_id: The ID of the user
            query: The search query to find in search terms
            
        Returns:
            list: List of search history entries that contain the query
        """
        if not user_id or not query:
            raise ValueError("user_id and query are required")
        
        # Get user's search history (all entries for searching)
        user_history = self.get_user_search_history(user_id, offset=0, limit=0)
        
        # Filter entries that contain the query (case-insensitive)
        query_lower = query.lower()
        matching_entries = [
            entry for entry in user_history
            if query_lower in entry.get("search_term", "").lower()
        ]
        
        return matching_entries
    
    def get_popular_search_terms(self, limit: Optional[int] = 10) -> List[Dict[str, Any]]:
        """
        Get the most popular search terms across all users.
        
        Args:
            limit: Maximum number of popular terms to return (default: 10)
            
        Returns:
            list: List of dictionaries with 'search_term' and 'count' keys, ordered by frequency
        """
        # Get all search history
        all_history = db.get(self.collection_name)
        
        # Count search term frequency
        term_counts = {}
        for entry in all_history:
            search_term = entry.get("search_term", "").strip().lower()
            if search_term:
                term_counts[search_term] = term_counts.get(search_term, 0) + 1
        
        # Sort by count (descending) and convert to list of dicts
        popular_terms = [
            {"search_term": term, "count": count}
            for term, count in sorted(term_counts.items(), key=lambda x: x[1], reverse=True)
        ]
        
        # Apply limit
        if limit is not None and limit > 0:
            popular_terms = popular_terms[:limit]
        
        return popular_terms


# Create singleton instance
search_history_service = SearchHistoryService()
