import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import { MOCK_VOLUNTEERS, MOCK_CRISIS_EVENTS } from "./src/config/mockData.js";

const firebaseConfig = {
  apiKey: "AIzaSyD20PAra7OUKZcRRYncAlMuZ294Jm4-a_0",
  authDomain: "neighboraid-293c2.firebaseapp.com",
  projectId: "neighboraid-293c2",
  storageBucket: "neighboraid-293c2.firebasestorage.app",
  messagingSenderId: "361368432806",
  appId: "1:361368432806:web:064652ebffc5769cee4467"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedData() {
  try {
    console.log("Seeding Volunteers...");
    for (const volunteer of MOCK_VOLUNTEERS) {
      await setDoc(doc(db, "volunteers", volunteer.id), volunteer);
      console.log(`Pushed volunteer: ${volunteer.id} - ${volunteer.name}`);
    }

    console.log("\nSeeding Crisis Events...");
    for (const crisis of MOCK_CRISIS_EVENTS) {
      await setDoc(doc(db, "crises", crisis.id), crisis);
      console.log(`Pushed crisis: ${crisis.id} - ${crisis.type}`);
    }

    console.log("\nSuccessfully seeded all mock data into Firestore!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
