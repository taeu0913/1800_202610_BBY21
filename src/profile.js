import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

// Profile Page: saved locations + more btn
const savedListEl = document.getElementById("savedLocationsList");
const savedEmptyEl = document.getElementById("savedEmptyText");
const savedMoreBtn = document.getElementById("savedMoreBtn");

const SAVED_PAGE_SIZE = 4;
let savedVisibleCount = SAVED_PAGE_SIZE;
let savedLocations = [];
let currentUid = null;
let unsubscribeSavedLocations = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUid = user.uid;
  listenToSavedLocations(user.uid);

  const userRef = doc(db, "users", user.uid);

  onSnapshot(userRef, (userSnap) => {
    if (userSnap.exists()) {
      const data = userSnap.data();

      document.getElementById("profileName").textContent =
        data.name || user.displayName || "User";

      document.getElementById("infoEmail").textContent =
        data.email || user.email || "No email";

      document.getElementById("infoLocation").textContent =
        data.location || "No location";
    } else {
      document.getElementById("profileName").textContent =
        user.displayName || "User";

      document.getElementById("infoEmail").textContent =
        user.email || "No email";

      document.getElementById("infoLocation").textContent = "No location";
    }
  }, (error) => {
    console.error("Error loading profile:", error);
  });
});

function renderSavedLocations() {
  if (!savedListEl || !savedEmptyEl || !savedMoreBtn) return;

  savedListEl.innerHTML = "";

  const statSaved = document.getElementById("statSaved");
  if (statSaved) {
    statSaved.textContent = String(savedLocations.length);
  }

  if (savedLocations.length === 0) {
    savedEmptyEl.classList.remove("hidden");
    savedMoreBtn.classList.add("hidden");
    return;
  }

  savedEmptyEl.classList.add("hidden");

  const toShow = savedLocations.slice(0, savedVisibleCount);

  toShow.forEach((loc) => {
    const li = document.createElement("li");
    li.className = "saved-li";

    const title = document.createElement("p");
    title.className = "saved-li-title";
    title.textContent = loc.title || "Unnamed Location";

    const actions = document.createElement("div");
    actions.className = "saved-actions";

    if (typeof loc.latitude === "number" && typeof loc.longitude === "number") {
      const mapLink = document.createElement("a");
      mapLink.href = `map.html?lat=${loc.latitude}&lng=${loc.longitude}`;
      mapLink.textContent = "Open on map";
      mapLink.className = "saved-open-link";
      actions.appendChild(mapLink);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "saved-delete-btn";
    deleteBtn.textContent = "❌";
    deleteBtn.setAttribute("aria-label", "Delete saved location");

    deleteBtn.addEventListener("click", async () => {
      try {
        await deleteSavedLocation(loc.id);
      } catch (error) {
        console.error("Error deleting saved location:", error);
      }
    });

    const row = document.createElement("div");
    row.className = "saved-row";

    row.appendChild(title);
    row.appendChild(actions);
    row.appendChild(deleteBtn);

    li.appendChild(row);
    savedListEl.appendChild(li);
  });

  if (savedVisibleCount >= savedLocations.length) {
    savedMoreBtn.classList.add("hidden");
  } else {
    savedMoreBtn.classList.remove("hidden");
  }
}

function listenToSavedLocations(uid) {
  if (unsubscribeSavedLocations) {
    unsubscribeSavedLocations();
  }

  const savedRef = collection(db, "users", uid, "savedLocations");
  const q = query(savedRef, orderBy("createdAt", "desc"));

  unsubscribeSavedLocations = onSnapshot(q, (snapshot) => {
    savedLocations = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    renderSavedLocations();
  }, (error) => {
    console.error("Error loading saved locations:", error);
  });
}

async function deleteSavedLocation(savedLocationId) {
  if (!currentUid) {
    alert("You must be logged in.");
    return;
  }

  await deleteDoc(doc(db, "users", currentUid, "savedLocations", savedLocationId));
}

// Only run saved-locations logic on profile page
if (savedListEl && savedEmptyEl && savedMoreBtn) {
  savedMoreBtn.addEventListener("click", () => {
    savedVisibleCount += SAVED_PAGE_SIZE;
    renderSavedLocations();
  });
}


//Logout - logoutBtn
const logoutBtn = document.getElementById("logoutBtn");

function logoutUser() {
  signOut(auth)
    .then(() => {
      window.location.href = "login.html"; // redirect after logout
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", logoutUser);
}