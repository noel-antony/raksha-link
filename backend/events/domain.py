from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

class DomainEvent(BaseModel):
    """Base class for all immutable domain events in SentinelOS."""
    event_id: str = Field(..., description="Unique identifier for the event")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    source: str = Field(..., description="Agent or component that emitted the event")
    
    class Config:
        frozen = True  # Enforce immutability

class IncidentDetected(DomainEvent):
    """Emitted when an incident is proactively detected via sensor mesh or citizen reports."""
    incident_type: str
    latitude: float
    longitude: float
    severity: str
    confidence: float
    signals: list[str]

class MissionGenerated(DomainEvent):
    """Emitted when the Mission Planner agent creates a new mission."""
    mission_id: str
    incident_id: str
    required_skills: list[str]
    required_assets: list[str]
    priority: str

class HumanApproved(DomainEvent):
    """Emitted when a human-in-the-loop approves a critical action (Break-Glass)."""
    action_id: str
    approver_id: str
    reasoning: str

class MissionCompleted(DomainEvent):
    """Emitted when a mission is marked as complete."""
    mission_id: str
    outcome: str
    duration_seconds: int

class ReflectionRecorded(DomainEvent):
    """Emitted when the Reflection agent logs an analysis of an event or mission."""
    target_id: str  # ID of the mission or incident analyzed
    learning_points: list[str]
    adjustments_recommended: list[str]

class WorldModelUpdated(DomainEvent):
    """Emitted when the continuous knowledge graph/world model changes."""
    entity_id: str
    entity_type: str
    updates: Dict[str, Any]
