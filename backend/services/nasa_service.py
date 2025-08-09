from typing import Any, Dict, List, Optional
from uuid import uuid4

import httpx
from fastapi import HTTPException

from .algo import confidence_score


NASA_API_ROOT = "https://images-api.nasa.gov"


def _map_item_to_source(item: Dict[str, Any], query: Optional[str] = None) -> Dict[str, Any]:
    data = (item.get("data") or [{}])[0]
    links = item.get("links") or []

    image_url: Optional[str] = None
    # Prefer explicit preview link
    for link in links:
        if link.get("rel") == "preview" and link.get("render") == "image":
            image_url = link.get("href")
            break
    # Fallback to first image render link
    if image_url is None:
        for link in links:
            if link.get("render") == "image":
                image_url = link.get("href")
                break

    canonical_url: Optional[str] = None
    # Extract canonical URL from links
    for link in links:
        if link.get("rel") == "canonical":
            canonical_url = link.get("href")
            break

    nasa_id = data.get("nasa_id") or str(uuid4())
    
    # Extract photographer information from various possible fields
    photographer = (
        data.get("photographer") or 
        data.get("author") or 
        data.get("credit") or 
        data.get("creator") or 
        ""
    )
    
    # Basic item data
    item_data = {
        "id": nasa_id,
        "name": data.get("title", ""),
        "type": data.get("media_type", ""),
        "launch_date": data.get("date_created", ""),
        "description": data.get("description", ""),
        "image_url": image_url,
        "canonical_url": canonical_url,
        "keywords": data.get("keywords", []),
        "photographer": photographer,
    }
    
    # Add search-related fields if query exists
    if query and query.strip():
        item_data["search"] = True
        
        # Create compound description from name, description, and keywords
        name = data.get("title", "")
        description = data.get("description", "")
        keywords = data.get("keywords", [])
        
        # Join keywords into a string
        keywords_str = " ".join(keywords) if isinstance(keywords, list) else str(keywords)
        
        # Create compound text for confidence calculation
        compound_description = f"{name} {description} {keywords_str}".strip()
        
        # Calculate confidence score
        item_data["confidence_score"] = confidence_score(query.strip(), compound_description)
    else:
        item_data["search"] = False
    
    return item_data


def search_images(query: Optional[str], page: int, page_size: int) -> List[Dict[str, Any]]:
    """Call NASA images API /search and map results to our minimal Source dicts.

    Only minimal fields are returned to keep implementation lean.
    """
    params: Dict[str, Any] = {
        # Ensure at least one param is present per API requirements
        "media_type": "image",
        "page": page,
        "page_size": page_size,
    }
    if query:
        params["q"] = query

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(f"{NASA_API_ROOT}/search", params=params)
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail=f"NASA API error: {response.status_code}")
            payload = response.json()
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to reach NASA API: {exc}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Invalid JSON from NASA API") from exc

    collection = payload.get("collection") or {}
    items = collection.get("items") or []
    return [_map_item_to_source(item, query) for item in items]


