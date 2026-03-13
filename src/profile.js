import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
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

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSavedLocations() {
  if (!savedListEl || !savedEmptyEl || !savedMoreBtn) return;

  savedListEl.innerHTML = "";

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
    li.innerHTML = `
      <p class="saved-li-title">${escapeHtml(loc.title)}</p>
      <p class="saved-li-sub">${escapeHtml(loc.note || "")}</p>
    `;
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

async function addSavedLocation(title, note) {
  if (!currentUid) {
    alert("You must be logged in.");
    return;
  }

  const savedRef = collection(db, "users", currentUid, "savedLocations");

  await addDoc(savedRef, {
    title,
    note,
    createdAt: serverTimestamp()
  });
}

async function clearSavedLocations() {
  if (!currentUid) {
    alert("You must be logged in.");
    return;
  }

  const savedRef = collection(db, "users", currentUid, "savedLocations");
  const snapshot = await getDocs(savedRef);

  for (const item of snapshot.docs) {
    await deleteDoc(doc(db, "users", currentUid, "savedLocations", item.id));
  }
}

// Only run saved-locations logic on profile page
if (savedListEl && savedEmptyEl && savedMoreBtn) {
  savedMoreBtn.addEventListener("click", () => {
    savedVisibleCount += SAVED_PAGE_SIZE;
    renderSavedLocations();
  });

  const addSavedBtn = document.getElementById("addSavedBtn");
  if (addSavedBtn) {
    addSavedBtn.addEventListener("click", async () => {
      try {
        const n = savedLocations.length + 1;

        await addSavedLocation(
          `Saved Location #${n}`,
          "Demo item (replace with real saved data)"
        );

        savedVisibleCount = SAVED_PAGE_SIZE;
      } catch (error) {
        console.error("Error adding saved location:", error);
      }
    });
  }

  const clearBtn = document.getElementById("clearSavedBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      try {
        await clearSavedLocations();
        savedVisibleCount = SAVED_PAGE_SIZE;
      } catch (error) {
        console.error("Error clearing saved locations:", error);
      }
    });
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUid = user.uid;
      listenToSavedLocations(user.uid);
    } else {
      currentUid = null;
      savedLocations = [];
      renderSavedLocations();

      if (unsubscribeSavedLocations) {
        unsubscribeSavedLocations();
        unsubscribeSavedLocations = null;
      }
    }
  });
}


onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();

      document.getElementById("profileName").textContent =
        data.name || user.displayName || "User";

      document.getElementById("infoEmail").textContent =
        data.email || user.email || "No email";

      document.getElementById("infoLocation").textContent =
        data.location || "No location";

      document.getElementById("statPoints").textContent =
        data.points ?? 0;
    } else {
      document.getElementById("profileName").textContent =
        user.displayName || "User";

      document.getElementById("infoEmail").textContent =
        user.email || "No email";

      document.getElementById("infoLocation").textContent = "No location";
      document.getElementById("statPoints").textContent = "0";
    }
  } catch (error) {
    console.error("Error loading profile:", error);
  }
});

//Logout - logoutBtn
const logoutBtn = document.getElementById("logoutBtn");

function logoutUser() {
  signOut(auth)
    .then(() => {
      console.log("User logged out");
      window.location.href = "login.html"; // redirect after logout
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", logoutUser);
}