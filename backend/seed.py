from datetime import datetime, timezone

from api.services.firebase import get_firestore

db = get_firestore()


def now():
    return datetime.now(timezone.utc).isoformat()


def clear_collection(name):
    docs = db.collection(name).stream()
    for doc in docs:
        doc.reference.delete()
    print(f"[OK] Cleared {name}")


# -----------------------------------
# RESET DATABASE
# -----------------------------------

for col in ["volunteers", "incidents", "missions"]:
    clear_collection(col)


# -----------------------------------
# VOLUNTEERS
# -----------------------------------

volunteers = [
    {
        "fullName": "Rahul Menon",
        "phone": "9876543210",
        "email": "rahul@example.com",
        "location": {"lat": 9.9816, "lng": 76.2999},
        "skills": ["First Aid", "CPR"],
        "availability": "Available",
        "status": "Active",
        "createdAt": now(),
        "updatedAt": now(),
        "certificate": {
            "uploaded": True,
            "fileUrl": "",
            "coordinatorApproved": True,
            "verification": {
                "status": "Coordinator Approved",
                "confidence": 97,
                "holderName": "Rahul Menon",
                "issuer": "Indian Red Cross Society",
                "certificateTitle": "First Aid & CPR",
                "skillCategory": "Medical",
                "issueDate": "2025-04-12",
                "expiryDate": "2028-04-12",
                "certificateNumber": "IRCS-2025-1148",
                "summary": "Certified in First Aid and CPR.",
                "possibleIssues": []
            }
        }
    },
    {
        "fullName": "Anjali Nair",
        "phone": "9876543211",
        "email": "anjali@example.com",
        "location": {"lat": 10.1076, "lng": 76.3516},
        "skills": ["Search & Rescue"],
        "availability": "Available",
        "status": "Active",
        "createdAt": now(),
        "updatedAt": now(),
        "certificate": None
    },
    {
        "fullName": "Vivek Raj",
        "phone": "9876543212",
        "email": "vivek@example.com",
        "location": {"lat": 10.0277, "lng": 76.3125},
        "skills": ["Boat Operator", "Swimmer", "Search & Rescue"],
        "assets": ["Boat", "Life Jackets", "Rope & Rescue Gear"],
        "availability": "Available",
        "status": "Active",
        "createdAt": now(),
        "updatedAt": now(),
        "certificate": None
    },
    {
        "fullName": "Sneha Thomas",
        "phone": "9876543213",
        "email": "sneha@example.com",
        "location": {"lat": 10.0205, "lng": 76.3080},
        "skills": ["Nurse"],
        "availability": "Available",
        "status": "Active",
        "createdAt": now(),
        "updatedAt": now(),
        "certificate": None
    },
    {
        "fullName": "Mohammed Irfan",
        "phone": "9876543214",
        "email": "irfan@example.com",
        "location": {"lat": 10.0500, "lng": 76.2700},
        "skills": ["Logistics"],
        "availability": "Offline",
        "status": "Active",
        "createdAt": now(),
        "updatedAt": now(),
        "certificate": None
    },
]

volunteer_ids = []

for volunteer in volunteers:
    ref = db.collection("volunteers").document()
    ref.set(volunteer)
    volunteer_ids.append(ref.id)

print("[OK] Seeded volunteers")


# -----------------------------------
# INCIDENTS
# -----------------------------------

incidents = [
    {
        "title": "Flooded Residential Area",
        "description": "30 houses flooded after continuous rainfall. Elderly trapped.",
        "category": "Flood",
        "priority": "Critical",
        "severity": "Critical",
        "status": "Active",
        "location": {"lat": 10.028, "lng": 76.312},
        "imageUrl": "",
        "createdAt": now(),
        "updatedAt": now(),
        "aiAnalysis": {
            "summary": "Major flood affecting residential area.",
            "recommendedResources": [
                "Boat Rescue Team",
                "Medical Team",
                "Food Supplies"
            ],
            "confidence": 0.98
        },
        "duplicateOf": None,
        "duplicateConfidence": None,
        "duplicateReason": None
    },
    {
        "title": "Apartment Fire",
        "description": "Fire reported on the third floor.",
        "category": "Fire",
        "priority": "High",
        "severity": "High",
        "status": "Pending",
        "location": {"lat": 10.031, "lng": 76.301},
        "imageUrl": "",
        "createdAt": now(),
        "updatedAt": now(),
        "aiAnalysis": {
            "summary": "Possible residential fire.",
            "recommendedResources": [
                "Fire Brigade",
                "Ambulance"
            ],
            "confidence": 0.95
        },
        "duplicateOf": None,
        "duplicateConfidence": None,
        "duplicateReason": None
    },
    {
        "title": "Road Traffic Accident",
        "description": "Bus collision with injuries.",
        "category": "Medical",
        "priority": "High",
        "severity": "High",
        "status": "Resolved",
        "location": {"lat": 10.015, "lng": 76.325},
        "imageUrl": "",
        "createdAt": now(),
        "updatedAt": now(),
        "aiAnalysis": {
            "summary": "Multiple casualties possible.",
            "recommendedResources": [
                "Ambulance",
                "Traffic Police"
            ],
            "confidence": 0.94
        },
        "duplicateOf": None,
        "duplicateConfidence": None,
        "duplicateReason": None
    }
]

incident_ids = []

for incident in incidents:
    ref = db.collection("incidents").document()
    ref.set(incident)
    incident_ids.append(ref.id)

print("[OK] Seeded incidents")


# -----------------------------------
# MISSIONS
# -----------------------------------

missions = [
    {
        "incidentId": incident_ids[0],
        "title": "Flood Rescue - Sector A",
        "description": "Rescue stranded families.",
        "priority": "Critical",
        "status": "In Progress",
        "createdBy": "Coordinator",
        "assignedVolunteers": [
            {
                "volunteerId": volunteer_ids[0],
                "name": "Rahul Menon",
                "role": "Medical Lead",
                "assignedAt": now(),
                "status": "Accepted"
            },
            {
                "volunteerId": volunteer_ids[2],
                "name": "Vivek Raj",
                "role": "Boat Operator",
                "assignedAt": now(),
                "status": "Accepted"
            }
        ],
        "notes": "Prioritize elderly residents.",
        "createdAt": now(),
        "updatedAt": now(),
        "startedAt": now(),
        "completedAt": None
    },
    {
        "incidentId": incident_ids[1],
        "title": "Apartment Fire Response",
        "description": "Support fire department.",
        "priority": "High",
        "status": "Pending",
        "createdBy": "Coordinator",
        "assignedVolunteers": [],
        "notes": "",
        "createdAt": now(),
        "updatedAt": now(),
        "startedAt": None,
        "completedAt": None
    }
]

for mission in missions:
    db.collection("missions").add(mission)

print("[OK] Seeded missions")

print("\n[SUCCESS] Demo database ready!")