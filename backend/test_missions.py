import requests
import time
import firebase_admin
from firebase_admin import credentials, firestore, initialize_app
import os
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
    
    # 1. Create Incident
    inc_flood = db.collection('incidents').add({
        "title": "Flood Incident",
        "description": "Flood",
        "priority": "Medium",
        "status": "pending"
    })[1]
    
    # 2. Create Active Volunteers
    vol1 = db.collection('volunteers').add({
        "fullName": "Vol 1",
        "status": "Active",
        "availability": "Available"
    })[1]
    
    vol2 = db.collection('volunteers').add({
        "fullName": "Vol 2",
        "status": "Active",
        "availability": "Available"
    })[1]
    
    vol3 = db.collection('volunteers').add({
        "fullName": "Vol 3",
        "status": "Active",
        "availability": "Available"
    })[1]
    
    # 3. Create Unavailable Volunteer
    vol_busy = db.collection('volunteers').add({
        "fullName": "Busy Vol",
        "status": "Active",
        "availability": "Busy"
    })[1]
    
    return {
        "incident": inc_flood.id,
        "vols": [vol1.id, vol2.id, vol3.id],
        "busy_vol": vol_busy.id
    }

def test_missions():
    print("Setting up test data...")
    data = setup_test_data()
    inc_id = data["incident"]
    vols = data["vols"]
    busy_vol = data["busy_vol"]
    
    print("Waiting for server to start...")
    time.sleep(3)

    print("\n--- Scenario 1: Create Mission (3 volunteers) ---")
    payload = {
        "incidentId": inc_id,
        "title": "Flood Rescue Mission",
        "description": "Rescue operations",
        "selectedVolunteerIds": vols
    }
    res = requests.post(f"{BASE_URL}/missions/", json=payload)
    print(f"Create Mission Status: {res.status_code}")
    if res.status_code != 201:
        print("Response:", res.json())
        return
        
    mission = res.json()
    mission_id = mission["id"]
    print(f"Mission ID: {mission_id}")
    print(f"Assigned Volunteers: {len(mission['assignedVolunteers'])}")
    
    # Check incident sync
    inc_res = requests.get(f"{BASE_URL}/incidents/{inc_id}")
    print(f"Incident Status: {inc_res.json().get('status')} (Expected: Assigned)")

    print("\n--- Scenario 2: Assign unavailable volunteer ---")
    payload_bad = {
        "incidentId": inc_id,
        "title": "Bad Mission",
        "description": "Should fail",
        "selectedVolunteerIds": [busy_vol]
    }
    res_bad = requests.post(f"{BASE_URL}/missions/", json=payload_bad)
    print(f"Bad Assign Status: {res_bad.status_code} (Expected 400)")
    print(f"Error: {res_bad.json().get('detail')}")

    print("\n--- Scenario 3: Approve Mission ---")
    res_approve = requests.patch(f"{BASE_URL}/missions/{mission_id}", json={"status": "Approved"})
    print(f"Approve Status: {res_approve.status_code}")
    print(f"Mission Status: {res_approve.json().get('status')} (Expected: Approved)")

    print("\n--- Scenario 4: Complete Mission ---")
    res_complete = requests.patch(f"{BASE_URL}/missions/{mission_id}", json={"status": "Completed"})
    print(f"Complete Status: {res_complete.status_code}")
    completedAt = res_complete.json().get('completedAt')
    print(f"Mission Status: {res_complete.json().get('status')} (Expected: Completed)")
    print(f"CompletedAt Timestamp: {completedAt}")

    print("\n--- Scenario 5: Cancel Mission (Soft Delete) ---")
    res_del = requests.delete(f"{BASE_URL}/missions/{mission_id}")
    print(f"Delete Status: {res_del.status_code}")
    
    # Verify soft delete
    res_get = requests.get(f"{BASE_URL}/missions/{mission_id}")
    print(f"Mission Status after delete: {res_get.json().get('status')} (Expected: Cancelled)")

if __name__ == "__main__":
    test_missions()
