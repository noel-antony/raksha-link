"""
RakshaLink API - Volunteer Model

Pydantic model representing a volunteer document in Firestore.
"""

from typing import List, Optional
from pydantic import BaseModel


class Volunteer(BaseModel):
    """Core volunteer data model."""

    id: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    assets: List[str] = []
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_active: bool = False
