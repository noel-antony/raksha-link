from typing import List, Optional, Dict
from api.services.firebase import get_firestore
from api.models.volunteer import Availability, Status
from api.schemas.incident import IncidentMatchResponse, MatchVolunteerSchema
from api.utils.geo import haversine_distance

# Skill Mapping based on incident category
CATEGORY_SKILLS_MAP: Dict[str, List[str]] = {
    "Flood": ["Boat Operator", "Swimming", "Swimmer", "Medical", "Logistics", "Search & Rescue", "First Aid", "Nurse"],
    "Fire": ["Firefighting", "Medical", "Crowd Control", "First Aid", "Nurse"],
    "Road Accident": ["Medical", "Crowd Control", "Logistics", "First Aid", "Nurse"],
    "Medical Emergency": ["Medical", "First Aid", "Nurse"],
    "Building Collapse": ["Search & Rescue", "Heavy Vehicle", "Medical", "First Aid"],
    "Landslide": ["Search & Rescue", "Heavy Vehicle", "Medical", "First Aid"],
    "Gas Leak": ["Firefighting", "Crowd Control"],
    "Power Failure": ["Logistics", "Heavy Vehicle"],
    "Tree Fall": ["Heavy Vehicle", "Search & Rescue", "Medical"],
    "Other": [],
}

PRIORITY_BONUS_MAP: Dict[str, float] = {
    "Critical": 15.0,
    "High": 10.0,
    "Medium": 5.0,
    "Low": 0.0
}

# Progressive search radii in km
SEARCH_RADII_KM = [20.0, 50.0, 150.0, 500.0]


def calculate_score(
    distance_km: float, 
    matching_skills: List[str], 
    priority: str,
    max_radius: float = 20.0
) -> float:
    """
    Calculate the deterministic score for a volunteer.
    """
    # Distance Score: 0-10 scaled relative to the search radius used
    distance_score = max(0.0, 10.0 * (1.0 - (distance_km / max_radius)))
    
    # Skill Score: 10 per matched skill, max 40
    skill_score = min(40.0, len(matching_skills) * 10.0)
    
    # Priority Bonus
    priority_bonus = PRIORITY_BONUS_MAP.get(priority, 0.0)
    
    return distance_score + skill_score + priority_bonus


def get_incident_matches(incident_id: str) -> Optional[IncidentMatchResponse]:
    """
    Given an incident, automatically recommend the most suitable volunteers.
    Uses progressive radius expansion: tries 20km, then 50km, 150km, statewide.
    """
    db = get_firestore()
    
    # 1. Load Incident
    incident_ref = db.collection("incidents").document(incident_id)
    incident_doc = incident_ref.get()
    
    if not incident_doc.exists:
        return None
        
    incident_data = incident_doc.to_dict()
    
    ai_analysis = incident_data.get("aiAnalysis", {}) or {}
    category = incident_data.get("category", "Other")
    priority = incident_data.get("priority", "Low")
    recommended_resources = ai_analysis.get("recommendedResources", [])
    
    inc_lat = incident_data.get("location", {}).get("lat", 0.0) if "location" in incident_data else incident_data.get("lat", 0.0)
    inc_lng = incident_data.get("location", {}).get("lng", 0.0) if "location" in incident_data else incident_data.get("lng", 0.0)
    
    target_skills = CATEGORY_SKILLS_MAP.get(category, CATEGORY_SKILLS_MAP["Other"])
    
    # 2. Load all available Active volunteers once
    volunteers_query = (
        db.collection("volunteers")
        .where("status", "==", Status.ACTIVE.value)
        .where("availability", "==", Availability.AVAILABLE.value)
    )
    
    all_volunteers = []
    for vol_doc in volunteers_query.stream():
        vol_data = vol_doc.to_dict()
        loc = vol_data.get("location", {})
        vol_lat = loc.get("lat", 0.0)
        vol_lng = loc.get("lng", 0.0)
        
        distance_km = haversine_distance(inc_lat, inc_lng, vol_lat, vol_lng) / 1000.0
        vol_skills = vol_data.get("skills", [])
        
        # Broad matching: check if volunteer skill overlaps with target skills
        matching_skills = [skill for skill in vol_skills if skill in target_skills]
        
        all_volunteers.append({
            "doc_id": vol_doc.id,
            "data": vol_data,
            "distance_km": distance_km,
            "matching_skills": matching_skills,
        })
    
    # 3. Progressive radius expansion
    matched_volunteers: List[MatchVolunteerSchema] = []
    used_radius = SEARCH_RADII_KM[0]
    
    for radius in SEARCH_RADII_KM:
        used_radius = radius
        matched_volunteers = []
        for vol in all_volunteers:
            if vol["distance_km"] <= radius:
                score = calculate_score(
                    vol["distance_km"], vol["matching_skills"], priority, max_radius=radius
                )
                matched_volunteers.append(
                    MatchVolunteerSchema(
                        volunteerId=vol["doc_id"],
                        name=vol["data"].get("fullName", "Unknown"),
                        distanceKm=round(vol["distance_km"], 2),
                        matchingSkills=vol["matching_skills"],
                        score=round(score, 2)
                    )
                )
        # If we found at least 1 volunteer, stop expanding
        if matched_volunteers:
            break
        
    # Sort descending by score
    matched_volunteers.sort(key=lambda x: x.score, reverse=True)
    
    return IncidentMatchResponse(
        incidentId=incident_id,
        category=category,
        priority=priority,
        recommendedResources=recommended_resources,
        recommendedVolunteers=matched_volunteers
    )
