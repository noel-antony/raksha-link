"""
RakshaLink API - Mission Model

Pydantic model representing a mission document in Firestore.
"""

from typing import List, Optional
from pydantic import BaseModel


class StatusEntry(BaseModel):
    """A single status change in the mission timeline."""

    status: str
    at: str


class Mission(BaseModel):
    """Core mission data model."""

    id: Optional[str] = None
    crisis_id: Optional[str] = None
    volunteer_id: Optional[str] = None
    volunteer_name: Optional[str] = None
    assigned_task: Optional[str] = None
    status: Optional[str] = None
    status_history: List[StatusEntry] = []
    created_at: Optional[str] = None
