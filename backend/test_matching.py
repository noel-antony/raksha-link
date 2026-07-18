import requests
import time
from firebase_admin import credentials, firestore, initialize_app
import os
from dotenv import load_dotenv

BASE_URL = "http://localhost:8000"

import firebase_admin

def setup_test_data():
    load_dotenv()
    if not len(firebase_admin._apps) > 0:
        cred = credentials.Certificate('credentials/firebase-admin.json')
        initialize_app(cred)
    db = firestore.client()
    
    # 1. Clear existing incidents and volunteers
    [doc.reference.delete() for doc in db.collection('volunteers').stream()]
    [doc.reference.delete() for doc in db.collection('incidents').stream()]
    
    # 2. Create Incidents
    # Flood
    inc_flood = db.collection('incidents').add({
        "title": "Flood Incident",
        "description": "Flood",
        "lat": 10.0,
        "lng": 76.0,
        "aiAnalysis": {
            "category": "Flood",
            "priority": "Medium",
            "recommendedResources": []
        }
    })[1]
    
    # Fire
    inc_fire = db.collection('incidents').add({
        "title": "Fire Incident",
        "description": "Fire",
        "lat": 10.0,
        "lng": 76.0,
        "aiAnalysis": {
            "category": "Fire",
            "priority": "High",
            "recommendedResources": []
        }
    })[1]
    
    # Critical (Generic)
    inc_critical = db.collection('incidents').add({
        "title": "Critical Incident",
        "description": "Critical",
        "lat": 10.0,
        "lng": 76.0,
        "aiAnalysis": {
            "category": "Other",
            "priority": "Critical",
            "recommendedResources": []
        }
    })[1]
    
    # Empty (No nearby)
    inc_empty = db.collection('incidents').add({
        "title": "Far Away Incident",
        "description": "Far",
        "lat": 20.0,
        "lng": 80.0, # Very far
        "aiAnalysis": {
            "category": "Other",
            "priority": "Low",
            "recommendedResources": []
        }
    })[1]
    
    # 3. Create Volunteers
    # vol_boat (Closest)
    db.collection('volunteers').add({
        "fullName": "Boat Operator Vol",
        "skills": ["Boat Operator"],
        "location": {"lat": 10.0, "lng": 76.0}, # 0 km
        "status": "Active",
        "availability": "Available"
    })
    
    # vol_swim (Further)
    db.collection('volunteers').add({
        "fullName": "Swimming Vol",
        "skills": ["Swimming"],
        "location": {"lat": 10.01, "lng": 76.01}, # ~1.5 km
        "status": "Active",
        "availability": "Available"
    })
    
    # vol_med (Even Further)
    db.collection('volunteers').add({
        "fullName": "Medical Vol",
        "skills": ["Medical"],
        "location": {"lat": 10.02, "lng": 76.02}, # ~3 km
        "status": "Active",
        "availability": "Available"
    })
    
    # vol_fire (Closest)
    db.collection('volunteers').add({
        "fullName": "Firefighter Vol",
        "skills": ["Firefighting"],
        "location": {"lat": 10.0, "lng": 76.0}, # 0 km
        "status": "Active",
        "availability": "Available"
    })
    
    # vol_critical_1 (Closer)
    db.collection('volunteers').add({
        "fullName": "Critical Closer",
        "skills": ["General volunteers"],
        "location": {"lat": 10.0, "lng": 76.0}, # 0 km
        "status": "Active",
        "availability": "Available"
    })
    
    # vol_critical_2 (Further)
    db.collection('volunteers').add({
        "fullName": "Critical Further",
        "skills": ["General volunteers"],
        "location": {"lat": 10.05, "lng": 76.05}, # ~7.5 km
        "status": "Active",
        "availability": "Available"
    })
    
    # vol_busy
    db.collection('volunteers').add({
        "fullName": "Busy Vol",
        "skills": ["General volunteers"],
        "location": {"lat": 10.0, "lng": 76.0},
        "status": "Active",
        "availability": "Busy"
    })
    
    # vol_inactive
    db.collection('volunteers').add({
        "fullName": "Inactive Vol",
        "skills": ["General volunteers"],
        "location": {"lat": 10.0, "lng": 76.0},
        "status": "Inactive",
        "availability": "Available"
    })
    
    return {
        "flood": inc_flood.id,
        "fire": inc_fire.id,
        "critical": inc_critical.id,
        "empty": inc_empty.id
    }

def test_matching():
    print("Setting up test data...")
    ids = setup_test_data()
    
    print("Waiting for server to start...")
    time.sleep(3)

    print("\n--- Scenario 1: Flood ---")
    res = requests.get(f"{BASE_URL}/incidents/{ids['flood']}/matches")
    data = res.json()
    volunteers = data.get("recommendedVolunteers", [])
    print(f"Status: {res.status_code}")
    print(f"Top Match: {volunteers[0]['name'] if volunteers else 'None'}")
    
    print("\n--- Scenario 2: Fire ---")
    res = requests.get(f"{BASE_URL}/incidents/{ids['fire']}/matches")
    data = res.json()
    volunteers = data.get("recommendedVolunteers", [])
    print(f"Status: {res.status_code}")
    print(f"Top Match: {volunteers[0]['name'] if volunteers else 'None'}")
    
    print("\n--- Scenario 3: Critical incident (closer ranks higher) ---")
    res = requests.get(f"{BASE_URL}/incidents/{ids['critical']}/matches")
    data = res.json()
    volunteers = data.get("recommendedVolunteers", [])
    print(f"Status: {res.status_code}")
    print(f"Matches: {[v['name'] for v in volunteers[:2]]}")
    
    print("\n--- Scenario 4 & 5: Busy / Inactive ignored ---")
    # Both critical matches should only return the Active/Available ones
    names = [v['name'] for v in volunteers]
    print(f"Contains Busy Vol: {'Busy Vol' in names}")
    print(f"Contains Inactive Vol: {'Inactive Vol' in names}")
    
    print("\n--- Scenario 6: No nearby volunteers ---")
    res = requests.get(f"{BASE_URL}/incidents/{ids['empty']}/matches")
    data = res.json()
    volunteers = data.get("recommendedVolunteers", [])
    print(f"Status: {res.status_code}")
    print(f"Matches count: {len(volunteers)}")


if __name__ == "__main__":
    test_matching()
