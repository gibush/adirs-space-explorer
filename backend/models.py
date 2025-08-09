from typing import List, Optional

from pydantic import BaseModel


class Source(BaseModel):
    id: str
    name: str
    type: str
    launch_date: str
    description: str
    image_url: Optional[str]
    canonical_url: Optional[str]
    keywords: List[str]
    photographer: str
    search: bool = False
    confidence_score: Optional[float] = None
