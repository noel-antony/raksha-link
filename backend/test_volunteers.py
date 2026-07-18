import requests
import time

BASE_URL = "http://localhost:8000"

def test_volunteers():
    print("Waiting for server to start...")
    time.sleep(3)

    print("--- 1. Registration ---")
    vol_a = {
        "fullName": "Volunteer A",
        "phone": "+919876543210",
        "email": "vola_v3@example.com",
        "location": {"lat": 10.0, "lng": 76.0},
        "skills": ["Medical", "Boat Operator"],
        "availability": "Available"
    }
    vol_b = {
        "fullName": "Volunteer B",
        "phone": "+919876543231",
        "email": "volb_v3@example.com",
        "location": {"lat": 10.01, "lng": 76.01},
        "skills": ["Firefighting"],
        "availability": "Available"
    }
    vol_c = {
        "fullName": "Volunteer C",
        "phone": "+919876543232",
        "email": "volc_v3@example.com",
        "location": {"lat": 10.10, "lng": 76.10}, # Further away
        "skills": ["Search & Rescue"],
        "availability": "Busy"
    }

    res_a = requests.post(f"{BASE_URL}/volunteers/", json=vol_a)
    print("Create A:", res_a.status_code)
    id_a = res_a.json()["id"]

    res_b = requests.post(f"{BASE_URL}/volunteers/", json=vol_b)
    print("Create B:", res_b.status_code)
    id_b = res_b.json()["id"]

    res_c = requests.post(f"{BASE_URL}/volunteers/", json=vol_c)
    print("Create C:", res_c.status_code)
    id_c = res_c.json()["id"]

    print("\n--- 2. Duplicate Validation ---")
    res_dup = requests.post(f"{BASE_URL}/volunteers/", json=vol_a)
    print("Duplicate Registration:", res_dup.status_code, res_dup.json().get("detail"))

    print("\n--- 3. Updates ---")
    res_upd = requests.patch(f"{BASE_URL}/volunteers/{id_b}", json={"availability": "Busy"})
    print("Update B:", res_upd.status_code, res_upd.json().get("availability"))

    print("\n--- 4. Radius Search & Filtering ---")
    # Search around 10.0, 76.0 within 5000 meters (5km)
    # A is at 0m, B is at ~1500m, C is at ~15000m
    params = {
        "lat": 10.0,
        "lng": 76.0,
        "radius": 5000
    }
    res_search = requests.get(f"{BASE_URL}/volunteers/search", params=params)
    print("Radius Search (5km):", [v["fullName"] for v in res_search.json()])

    # Search with Skill filter
    params_skill = {
        "lat": 10.0,
        "lng": 76.0,
        "radius": 50000,
        "skill": "Medical"
    }
    res_search_skill = requests.get(f"{BASE_URL}/volunteers/search", params=params_skill)
    print("Search by Skill (Medical):", [v["fullName"] for v in res_search_skill.json()])

    print("\n--- 5. Soft Deletion ---")
    res_del = requests.delete(f"{BASE_URL}/volunteers/{id_a}")
    print("Delete A:", res_del.status_code)
    
    res_get_a = requests.get(f"{BASE_URL}/volunteers/{id_a}")
    print("Status after delete:", res_get_a.json().get("status"))

    print("\n--- Clean up (Hard delete for test repeatability) ---")
    from firebase_admin import firestore
    db = firestore.client()
    db.collection("volunteers").document(id_a).delete()
    db.collection("volunteers").document(id_b).delete()
    db.collection("volunteers").document(id_c).delete()
    print("Cleaned up Firestore documents.")

if __name__ == "__main__":
    test_volunteers()
