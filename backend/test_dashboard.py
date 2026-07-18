import requests
import time
# pyrefly: ignore [missing-import]
import firebase_admin
from firebase_admin import credentials, firestore, initialize_app
from dotenv import load_dotenv

BASE_URL = "http://localhost:8000"

def setup_test_data():
    load_dotenv()
    if not len(firebase_admin._apps) > 0:
        cred = credentials.Certificate('credentials/firebase-admin.json')
        initialize_app(cred)
    db = firestore.client()
    
    # Clean DB
    [doc.reference.delete() for doc in db.collection('missions').stream()]
    [doc.reference.delete() for doc in db.collection('volunteers').stream()]
    [doc.reference.delete() for doc in db.collection('incidents').stream()]
    
    # Create Incident
    inc_flood = db.collection('incidents').add({
        "title": "Flood Incident",
        "category": "Flood",
        "priority": "Critical",
        "status": "pending",
        "createdAt": "2024-01-01T00:00:00Z"
    })[1]
    
    # Create Mission
    db.collection('missions').add({
        "incidentId": inc_flood.id,
        "title": "Flood Rescue Mission",
        "priority": "Critical",
        "status": "Pending",
        "assignedVolunteers": [{"volunteerId": "123"}],
        "createdAt": "2024-01-01T00:01:00Z"
    })
    
    # Create Active Volunteers
    db.collection('volunteers').add({
        "fullName": "Vol 1",
        "status": "Active",
        "availability": "Available",
        "skills": ["Medical", "Firefighting"],
        "createdAt": "2024-01-01T00:02:00Z"
    })
    
    db.collection('volunteers').add({
        "fullName": "Vol 2",
        "status": "Active",
        "availability": "Available",
        "skills": ["Medical", "Boat Operator"],
        "createdAt": "2024-01-01T00:03:00Z"
    })
    
    db.collection('volunteers').add({
        "fullName": "Vol Busy",
        "status": "Active",
        "availability": "Busy",
        "skills": ["Heavy Vehicle"],
        "createdAt": "2024-01-01T00:04:00Z"
    })
    
    db.collection('volunteers').add({
        "fullName": "Vol Inactive",
        "status": "Inactive",
        "availability": "Available",
        "skills": [],
        "createdAt": "2024-01-01T00:05:00Z"
    })

def test_dashboard():
    print("Setting up test data...")
    setup_test_data()
    
    print("Waiting for server to start...")
    time.sleep(3)

    print("\n--- Scenario 1: Health Check ---")
    res = requests.get(f"{BASE_URL}/health")
    print(f"Status: {res.status_code}")
    data = res.json()
    print("Health Data:", data)
    assert data["status"] == "healthy"
    assert data["collections"]["incidents"] == 1
    assert data["collections"]["missions"] == 1
    assert data["collections"]["volunteers"] == 4

    print("\n--- Scenario 2: Dashboard Statistics ---")
    res = requests.get(f"{BASE_URL}/dashboard")
    print(f"Status: {res.status_code}")
    data = res.json()
    print("Stats:", data["statistics"])
    assert data["statistics"]["activeIncidents"] == 1
    assert data["statistics"]["activeMissions"] == 1
    assert data["statistics"]["availableVolunteers"] == 2
    assert data["statistics"]["busyVolunteers"] == 1
    
    print("Volunteer Summary:", data["volunteerSummary"])
    assert data["volunteerSummary"]["total"] == 4
    assert data["volunteerSummary"]["skillsDistribution"]["Medical"] == 2

    print("\n--- Scenario 3: Activity Feed ---")
    res = requests.get(f"{BASE_URL}/activity")
    print(f"Status: {res.status_code}")
    data = res.json()
    print(f"Total Activities: {len(data)}")
    assert len(data) == 6
    print(f"Most recent: {data[0]['title']} ({data[0]['type']})")


if __name__ == "__main__":
    test_dashboard()
