import { db } from "./firebaseConfig.js";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

const auth = getAuth();
const list = document.getElementById("saved-list");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    list.innerHTML = "<p>You need to be logged in to see saved places.</p>";
    return;
  }

  // Get user doc to read savedPlaces array
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const savedPlaceIds = userDoc.data()?.savedPlaces || [];

  if (savedPlaceIds.length === 0) {
    list.innerHTML = "<p>No saved places yet.</p>";
    return;
  }

  // Fetch each place from Places collection
  const placePromises = savedPlaceIds.map(id => getDoc(doc(db, "Places", id)));
  const placeDocs = await Promise.all(placePromises);

  list.innerHTML = "";

  placeDocs.forEach(placeDoc => {
    if (!placeDoc.exists()) return;

    const data = placeDoc.data();
    const lat = data.Latitude;
    const lng = data.Longitude;
    const name = data.Names;

    list.insertAdjacentHTML("beforeend", `
      <div class="saved-card">
        <p class="saved-name">${name}</p>
        <a class="jump-btn" href="map.html?lat=${lat}&lng=${lng}">
          View on Map
        </a>
      </div>
    `);
  });
});