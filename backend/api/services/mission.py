from typing import Any, List, Optional
from fastapi import HTTPException
from firebase_admin import firestore
from api.services.firebase import get_firestore
from api.models.mission import MissionStatus, AssignmentStatus
from api.schemas.mission import MissionCreate, MissionUpdate
from datetime import datetime, timezone
from api.models.volunteer import Availability, Status

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

async def create_mission(data: dict[str, Any]) -> dict[str, Any]:
    db = get_firestore()
    
    incident_id = data.get("incidentId")
    selected_volunteer_ids = data.get("selectedVolunteerIds", [])
    
    # 1. Validate Incident exists
    incident_ref = db.collection("incidents").document(incident_id)
    incident_doc = incident_ref.get()
    
    if not incident_doc.exists:
        raise ValueError(f"Incident {incident_id} not found.")
        
    incident_data = incident_doc.to_dict()
    priority = incident_data.get("priority", "Unknown")
    
    # 2. Validate Volunteers
    assigned_volunteers = []
    now = _now_iso()
    
    for vol_id in selected_volunteer_ids:
        vol_ref = db.collection("volunteers").document(vol_id)
        vol_doc = vol_ref.get()
        
        if not vol_doc.exists:
            raise ValueError(f"Volunteer {vol_id} not found.")
            
        vol_data = vol_doc.to_dict()
        
        if vol_data.get("status") != Status.ACTIVE.value:
            raise ValueError(f"Volunteer {vol_id} is not Active.")
            
        if vol_data.get("availability") != Availability.AVAILABLE.value:
            raise ValueError(f"Volunteer {vol_id} is not Available.")
            
        # Add to assignments
        assigned_volunteers.append({
            "volunteerId": vol_id,
            "name": vol_data.get("fullName", "Unknown"),
            "role": "General", # Can be improved later
            "assignedAt": now,
            "status": AssignmentStatus.ASSIGNED.value
        })
        
    # 3. Create Mission
    mission_data = {
        "incidentId": incident_id,
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "priority": priority,
        "status": MissionStatus.PENDING.value,
        "assignedVolunteers": assigned_volunteers,
        "createdBy": "Command Center", # Mocked
        "createdAt": now,
        "updatedAt": now,
        "startedAt": None,
        "completedAt": None,
        "notes": ""
    }
    
    mission_ref = db.collection("missions").document()
    mission_data["id"] = mission_ref.id
    mission_ref.set(mission_data)
    
    # 4. Sync Incident
    incident_ref.update({
        "missionId": mission_ref.id,
        "status": "Assigned"
    })
    
    return mission_data


async def list_missions(status: Optional[MissionStatus] = None, priority: Optional[str] = None) -> List[dict[str, Any]]:
    db = get_firestore()
    query = db.collection("missions")
    
    if status:
        query = query.where("status", "==", status.value)
    if priority:
        query = query.where("priority", "==", priority)
        
    docs = query.order_by("createdAt", direction=firestore.Query.DESCENDING).stream()
    
    return [doc.to_dict() for doc in docs]


async def get_mission(mission_id: str) -> Optional[dict[str, Any]]:
    db = get_firestore()
    doc = db.collection("missions").document(mission_id).get()
    
    if not doc.exists:
        return None
        
    return doc.to_dict()


async def update_mission(mission_id: str, data: dict[str, Any]) -> Optional[dict[str, Any]]:
    db = get_firestore()
    mission_ref = db.collection("missions").document(mission_id)
    
    if not mission_ref.get().exists:
        return None
        
    data["updatedAt"] = _now_iso()
    
    # If status is changing to Completed, update completedAt
    if data.get("status") == MissionStatus.COMPLETED.value:
        data["completedAt"] = _now_iso()
        
    mission_ref.update(data)
    
    return mission_ref.get().to_dict()


async def delete_mission(mission_id: str) -> bool:
    db = get_firestore()
    mission_ref = db.collection("missions").document(mission_id)
    
    if not mission_ref.get().exists:
        return False
        
    # Soft delete
    mission_ref.update({
        "status": MissionStatus.CANCELLED.value,
        "updatedAt": _now_iso()
    })
    
    return True
