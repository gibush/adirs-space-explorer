import json
import os
import uuid
from typing import Dict, List, Any, Optional
from pathlib import Path


class DatabaseService:
    """
    A singleton service for managing JSON file-based collections.
    Each collection is stored as a JSON file containing an array of objects.
    """
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not DatabaseService._initialized:
            self.db_path = Path(__file__).parent.parent / "db"
            self.db_path.mkdir(exist_ok=True)
            DatabaseService._initialized = True
    
    def _get_collection_path(self, collection_name: str) -> Path:
        """Get the file path for a collection."""
        return self.db_path / f"{collection_name}.json"
    
    def _load_collection(self, collection_name: str) -> List[Dict[str, Any]]:
        """Load a collection from file. Returns empty list if file doesn't exist."""
        collection_path = self._get_collection_path(collection_name)
        if not collection_path.exists():
            return []
        
        try:
            with open(collection_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if not isinstance(data, list):
                    raise ValueError(f"Collection {collection_name} is not a valid array")
                return data
        except (json.JSONDecodeError, ValueError) as e:
            raise ValueError(f"Error loading collection {collection_name}: {str(e)}")
    
    def _save_collection(self, collection_name: str, data: List[Dict[str, Any]]) -> None:
        """Save a collection to file."""
        collection_path = self._get_collection_path(collection_name)
        
        try:
            with open(collection_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            raise ValueError(f"Error saving collection {collection_name}: {str(e)}")
    
    def _generate_unique_id(self, collection_name: str) -> str:
        """Generate a unique ID that doesn't exist in the collection."""
        existing_data = self._load_collection(collection_name)
        existing_ids = {doc.get('id') for doc in existing_data if 'id' in doc}
        
        while True:
            new_id = str(uuid.uuid4())
            if new_id not in existing_ids:
                return new_id
    
    def createCollection(self, name: str) -> bool:
        """
        Create a new collection (JSON file) if it doesn't already exist.
        
        Args:
            name: Name of the collection
            
        Returns:
            bool: True if collection was created, False if it already existed
        """
        collection_path = self._get_collection_path(name)
        
        if collection_path.exists():
            return False
        
        self._save_collection(name, [])
        return True
    
    def add(self, collection: str, doc: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add a document to a collection. Automatically generates a unique ID.
        
        Args:
            collection: Name of the collection
            doc: Document to add (without ID)
            
        Returns:
            dict: The added document with generated ID
        """
        # Ensure collection exists
        self.createCollection(collection)
        
        # Generate unique ID
        doc_with_id = doc.copy()
        doc_with_id['id'] = self._generate_unique_id(collection)
        
        # Load existing data
        data = self._load_collection(collection)
        
        # Add new document
        data.append(doc_with_id)
        
        # Save back to file
        self._save_collection(collection, data)
        
        return doc_with_id
    
    def delete(self, collection: str, doc_id: str) -> bool:
        """
        Delete a document from a collection by ID.
        
        Args:
            collection: Name of the collection
            doc_id: ID of the document to delete
            
        Returns:
            bool: True if document was deleted, False if not found
        """
        data = self._load_collection(collection)
        
        # Find and remove the document
        original_length = len(data)
        data = [doc for doc in data if doc.get('id') != doc_id]
        
        if len(data) < original_length:
            self._save_collection(collection, data)
            return True
        
        return False
    
    def update(self, collection: str, doc_id: str, new_payload: Dict[str, Any], upsert: bool = True) -> Optional[Dict[str, Any]]:
        """
        Update an existing document with partial payload (merge update).
        
        Args:
            collection: Name of the collection
            doc_id: ID of the document to update
            new_payload: Partial data to update (will merge with existing fields)
            upsert: If True and document doesn't exist, create it with the payload
            
        Returns:
            dict: Updated document, or None if document not found and upsert=False
        """
        data = self._load_collection(collection)
        
        # Find the document to update
        doc_index = None
        for i, doc in enumerate(data):
            if doc.get('id') == doc_id:
                doc_index = i
                break
        
        if doc_index is not None:
            # Update existing document (merge fields)
            updated_doc = data[doc_index].copy()
            updated_doc.update(new_payload)
            # Preserve the original ID
            updated_doc['id'] = doc_id
            data[doc_index] = updated_doc
            
            self._save_collection(collection, data)
            return updated_doc
        
        elif upsert:
            # Create new document if not found and upsert is True
            new_doc = new_payload.copy()
            new_doc['id'] = doc_id
            data.append(new_doc)
            
            self._save_collection(collection, data)
            return new_doc
        
        return None
    
    def get(self, collection: str) -> List[Dict[str, Any]]:
        """
        Get all documents from a collection.
        
        Args:
            collection: Name of the collection
            
        Returns:
            list: All documents in the collection
        """
        return self._load_collection(collection)
    
    def getOne(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single document by ID.
        
        Args:
            collection: Name of the collection
            doc_id: ID of the document to retrieve
            
        Returns:
            dict: The document if found, None otherwise
        """
        data = self._load_collection(collection)
        
        for doc in data:
            if doc.get('id') == doc_id:
                return doc
        
        return None


# Create singleton instance
db = DatabaseService()
