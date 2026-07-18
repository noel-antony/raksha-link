from typing import List, Optional, Dict
from fastapi import HTTPException
from api.services.firebase import get_firestore
from api.models.volunteer import Availability, Status
from api.schemas.incident import IncidentMatchResponse, MatchVolunteerSchema
from api.utils.geo import haversine_distance

# Skill Mapping based on incident category
CATEGORY_SKILLS_MAP: Dict[str, List[str]] = {
    "Flood": ["Boat Operator", "Swimming", "Medical", "Logistics"],
    "Fire": ["Firefighting", "Medical", "Crowd Control"],
    "Road Accident": ["Medical", "Crowd Control", "Logistics"],
    "Medical Emergency": ["Medical", "First Aid"],
    "Building Collapse": ["Search & Rescue", "Heavy Vehicle", "Medical"],
    "Gas Leak": ["Firefighting", "Crowd Control"],
    "Power Failure": ["Logistics", "Heavy Vehicle"],
    "Tree Fall": ["Heavy Vehicle", "Search & Rescue", "Medical"],
    "Other": ["General volunteers"]
}

PRIORITY_BONUS_MAP: Dict[str, float] = {
    "Critical": 15.0,
    "High": 10.0,
    "Medium": 5.0,
    "Low": 0.0
}

def calculate_score(
    distance_km: float, 
    matching_skills: List[str], 
    priority: str
) -> float:
    """
    Calculate the deterministic score for a volunteer.
    """
    # Distance Score: 0-10 (0km -> 10, 20km -> 0)
    distance_score = max(0.0, 10.0 * (1.0 - (distance_km / 20.0)))
    
    # Skill Score: 10 per matched skill, max 40
    skill_score = min(40.0, len(matching_skills) * 10.0)
    
    # Priority Bonus
    priority_bonus = PRIORITY_BONUS_MAP.get(priority, 0.0)
    
    return distance_score + skill_score + priority_bonus


def get_incident_matches(incident_id: str) -> Optional[IncidentMatchResponse]:
    """
    Given an incident, automatically recommend the most suitable volunteers.
    """
    db = get_firestore()
    
    # 1. Load Incident
    incident_ref = db.collection("incidents").document(incident_id)
    incident_doc = incident_ref.get()
    
    if not incident_doc.exists:
        return None
        
    incident_data = incident_doc.to_dict()
    
    ai_analysis = incident_data.get("aiAnalysis", {}) or {}
    category = ai_analysis.get("category", "Other")
    priority = ai_analysis.get("priority", "Low")
    recommended_resources = ai_analysis.get("recommendedResources", [])
    
    inc_lat = incident_data.get("location", {}).get("lat", 0.0) if "location" in incident_data else incident_data.get("lat", 0.0)
    inc_lng = incident_data.get("location", {}).get("lng", 0.0) if "location" in incident_data else incident_data.get("lng", 0.0)
    
    target_skills = CATEGORY_SKILLS_MAP.get(category, CATEGORY_SKILLS_MAP["Other"])
    
    # 2. Load Volunteers
    volunteers_query = (
        db.collection("volunteers")
        .where("status", "==", Status.ACTIVE.value)
        .where("availability", "==", Availability.AVAILABLE.value)
    )
    
    matched_volunteers: List[MatchVolunteerSchema] = []
    
    for vol_doc in volunteers_query.stream():
        vol_data = vol_doc.to_dict()
        
        loc = vol_data.get("location", {})
        vol_lat = loc.get("lat", 0.0)
        vol_lng = loc.get("lng", 0.0)
        
        # 3. Calculate Distance
        distance = haversine_distance(inc_lat, inc_lng, vol_lat, vol_lng)
        
        # 4. Filter by distance (20km max)
        if distance > 20.0:
            continue
            
        vol_skills = vol_data.get("skills", [])
        
        # 5. Matching Skills
        matching_skills = [skill for skill in vol_skills if skill in target_skills]
        
        # Calculate final deterministic score
        score = calculate_score(distance, matching_skills, priority)
        
        matched_volunteers.append(
            MatchVolunteerSchema(
                volunteerId=vol_doc.id,
                name=vol_data.get("fullName", "Unknown"),
                distanceKm=round(distance, 2),
                matchingSkills=matching_skills,
                score=round(score, 2)
            )
        )
        
    # Sort descending by score
    matched_volunteers.sort(key=lambda x: x.score, reverse=True)
    
    return IncidentMatchResponse(
        incidentId=incident_id,
        category=category,
        priority=priority,
        recommendedResources=recommended_resources,
        recommendedVolunteers=matched_volunteers
    )
