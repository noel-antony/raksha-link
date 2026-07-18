from typing import Dict, Any, List
from api.services.firebase import get_firestore
from api.schemas.dashboard import (
    DashboardResponse, DashboardStatistics, IncidentSummary, 
    MissionSummary, VolunteerSummary, ActivityItem, 
    HealthResponse, CollectionCounts
)
from datetime import datetime, timezone
import os

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

async def get_dashboard_data() -> DashboardResponse:
    db = get_firestore()
    
    # Fetch data efficiently (in production, we'd use aggregation queries, 
    # but for this scale, reading and filtering in memory is sufficient)
    incidents_docs = db.collection("incidents").get()
    missions_docs = db.collection("missions").get()
    volunteers_docs = db.collection("volunteers").get()
    
    incidents = [{"id": doc.id, **doc.to_dict()} for doc in incidents_docs]
    missions = [{"id": doc.id, **doc.to_dict()} for doc in missions_docs]
    volunteers = [{"id": doc.id, **doc.to_dict()} for doc in volunteers_docs]
    
    # 1. Dashboard Statistics
    active_incidents = sum(1 for i in incidents if i.get("status") not in ["resolved", "closed"])
    resolved_incidents = sum(1 for i in incidents if i.get("status") in ["resolved", "closed"])
    active_missions = sum(1 for m in missions if m.get("status") in ["Pending", "Approved", "In Progress"])
    available_vols = sum(1 for v in volunteers if v.get("status") == "Active" and v.get("availability") == "Available")
    busy_vols = sum(1 for v in volunteers if v.get("status") == "Active" and v.get("availability") == "Busy")
    
    stats = DashboardStatistics(
        activeIncidents=active_incidents,
        activeMissions=active_missions,
        availableVolunteers=available_vols,
        busyVolunteers=busy_vols,
        resolvedIncidents=resolved_incidents
    )
    
    # 2. Volunteer Summary
    inactive_vols = sum(1 for v in volunteers if v.get("status") == "Inactive")
    skills_dist = {}
    for v in volunteers:
        for skill in v.get("skills", []):
            skills_dist[skill] = skills_dist.get(skill, 0) + 1
            
    vol_summary = VolunteerSummary(
        total=len(volunteers),
        available=available_vols,
        busy=busy_vols,
        inactive=inactive_vols,
        skillsDistribution=skills_dist
    )
    
    # 3. Incident Summaries
    sorted_incidents = sorted(incidents, key=lambda x: x.get("createdAt", ""), reverse=True)
    recent_incidents = []
    high_priority_incidents = []
    
    for inc in sorted_incidents:
        summary = IncidentSummary(
            id=inc["id"],
            title=inc.get("title", ""),
            category=inc.get("category", "unknown"),
            priority=inc.get("priority", "unknown"),
            status=inc.get("status", "unknown"),
            createdAt=inc.get("createdAt", ""),
            missionId=inc.get("missionId"),
            duplicateOf=inc.get("duplicateOf")
        )
        recent_incidents.append(summary)
        if inc.get("priority") in ["Critical", "High"] and inc.get("status") not in ["resolved", "closed"]:
            high_priority_incidents.append(summary)
            
    # 4. Mission Summaries
    sorted_missions = sorted(missions, key=lambda x: x.get("createdAt", ""), reverse=True)
    recent_missions = []
    
    for miss in sorted_missions:
        summary = MissionSummary(
            id=miss["id"],
            title=miss.get("title", ""),
            priority=miss.get("priority", "Unknown"),
            status=miss.get("status", "Unknown"),
            incidentId=miss.get("incidentId", ""),
            assignedVolunteerCount=len(miss.get("assignedVolunteers", [])),
            createdAt=miss.get("createdAt", "")
        )
        recent_missions.append(summary)
        
    return DashboardResponse(
        statistics=stats,
        recentIncidents=recent_incidents[:10],
        recentMissions=recent_missions[:10],
        highPriorityIncidents=high_priority_incidents[:10],
        volunteerSummary=vol_summary
    )


async def get_recent_activity() -> List[ActivityItem]:
    db = get_firestore()
    from firebase_admin import firestore
    
    incidents = db.collection("incidents").order_by("createdAt", direction=firestore.Query.DESCENDING).limit(10).stream()
    missions = db.collection("missions").order_by("createdAt", direction=firestore.Query.DESCENDING).limit(10).stream()
    volunteers = db.collection("volunteers").stream() # Doesn't have createdAt, mock sorting by fallback
    
    activities = []
    for doc in incidents:
        d = doc.to_dict()
        activities.append(ActivityItem(
            type="incident", id=doc.id, title=d.get("title", "New Incident"),
            timestamp=d.get("createdAt", ""), status=d.get("status", "")
        ))
        
    for doc in missions:
        d = doc.to_dict()
        activities.append(ActivityItem(
            type="mission", id=doc.id, title=d.get("title", "New Mission"),
            timestamp=d.get("createdAt", ""), status=d.get("status", "")
        ))
        
    # Volunteers lack createdAt initially, so we just append them if needed or skip.
    # The requirement says "Volunteer registrations", but our current model might not have createdAt.
    # Let's add them if they have createdAt
    for doc in volunteers:
        d = doc.to_dict()
        if "createdAt" in d:
            activities.append(ActivityItem(
                type="volunteer", id=doc.id, title=d.get("fullName", "New Volunteer"),
                timestamp=d.get("createdAt", ""), status=d.get("status", "")
            ))
            
    # Sort descending
    activities.sort(key=lambda x: x.timestamp, reverse=True)
    return activities[:20]


async def get_health_status() -> HealthResponse:
    firestore_ok = False
    counts = CollectionCounts(incidents=0, missions=0, volunteers=0)
    
    try:
        db = get_firestore()
        counts.incidents = db.collection("incidents").count().get()[0][0].value
        counts.missions = db.collection("missions").count().get()[0][0].value
        counts.volunteers = db.collection("volunteers").count().get()[0][0].value
        firestore_ok = True
    except Exception:
        pass

    gemini_ok = False
    try:
        from api.config import settings
        if settings.GOOGLE_API_KEY:
            gemini_ok = True
    except Exception:
        pass
        
    status = "healthy" if firestore_ok and gemini_ok else "degraded"
    
    return HealthResponse(
        status=status,
        firestore=firestore_ok,
        gemini=gemini_ok,
        collections=counts,
        timestamp=_now_iso()
    )
