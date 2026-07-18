import uuid
from typing import Any, Dict
from backend.agents.base import BaseAgent
from backend.events.domain import DomainEvent, IncidentDetected, MissionGenerated
from backend.world_model.graph import world_model

class MissionPlannerAgent(BaseAgent):
    """
    Subscribes to IncidentDetected events.
    Reasons about the incident to autonomously decompose it into actionable missions.
    """
    def __init__(self):
        super().__init__(name="MissionPlannerAgent")

    def _setup_subscriptions(self):
        self.subscribe(IncidentDetected, self.handle_incident)

    async def handle_incident(self, event: IncidentDetected):
        """Autonomously decomposes an incident into a mission."""
        print(f"[{self.name}] Analyzing Incident: {event.incident_type} at {event.latitude}, {event.longitude}")
        
        # Simulated LLM reasoning: determine required skills and assets
        required_skills = ["Medical", "Swift Water Rescue"] if "Flood" in event.incident_type else ["General Responder"]
        required_assets = ["Boat", "First Aid Kit"] if "Flood" in event.incident_type else ["First Aid Kit"]
        
        # Require human approval (Break-Glass) if confidence is low
        if event.confidence < 0.7:
            print(f"[{self.name}] Confidence low ({event.confidence}). Requesting Human-in-the-loop approval.")
            # In a real implementation, we would emit a HumanApprovalRequested event here.
            return
            
        mission_id = str(uuid.uuid4())
        
        mission_event = MissionGenerated(
            event_id=str(uuid.uuid4()),
            source=self.name,
            mission_id=mission_id,
            incident_id=event.event_id,
            required_skills=required_skills,
            required_assets=required_assets,
            priority="HIGH" if event.severity in ["HIGH", "CRITICAL"] else "MEDIUM"
        )
        
        await self.publish(mission_event)
        
        # Update World Model
        await world_model.add_node(
            label="Mission",
            properties={
                "incident_id": event.event_id,
                "skills": required_skills,
                "assets": required_assets,
                "status": "PENDING_DISPATCH"
            },
            node_id=mission_id
        )
        
        # Link Mission to Incident
        await world_model.add_edge(
            source_id=mission_id,
            target_id=event.event_id,
            relation="ADDRESSES"
        )
