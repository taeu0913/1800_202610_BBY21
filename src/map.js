import { db } from "./firebaseConfig.js";
import {
  collection,
  query,
  doc,
  where,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth , onAuthStateChanged } from "firebase/auth";
import { findClosestLocation } from "./utils.js";

// ─────────────────────────────────────────────
// CONSTANTS & FIREBASE REFS
// ─────────────────────────────────────────────

const auth = getAuth();
const locationsRef = collection(db, "Places");
const postsRef = collection(db, "posts");
const usersRef = collection(db, "users");

const MAP_DEFAULT_VIEW = [49.2768, -123.1120];
const MAP_DEFAULT_ZOOM = 10;
const MAP_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const POST_LIMIT = 5;
const PROXIMITY_THRESHOLD_KM = 0.4;

// ─────────────────────────────────────────────
// MAP SETUP
// ─────────────────────────────────────────────

function initMap() {
  const map = L.map("map").setView(MAP_DEFAULT_VIEW, MAP_DEFAULT_ZOOM);

  L.tileLayer(MAP_TILE_URL, {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  return map;
}

const mapIcon = L.icon({ iconUrl: "/images/marker.png", iconSize: [20, 25] });
const userIcon = L.icon({ iconUrl: "/images/person.png", iconSize: [50, 50] });

// ─────────────────────────────────────────────
// GEOLOCATION
// ─────────────────────────────────────────────

function formatReadableLocation(address = {}) {
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.suburb ||
    "";

  const province =
    address.state_code || address.state || "";

  if (city && province) {
    return `${city}, ${province}`;
  }

  return city || province || "Unknown location";
}

async function reverseGeocode(lat, lng) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
    `&lat=${encodeURIComponent(lat)}` +
    `&lon=${encodeURIComponent(lng)}` +
    `&zoom=14&addressdetails=1&accept-language=en`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed: ${response.status}`);
  }

  const data = await response.json();
  const address = data.address || {};

  const readableName = formatReadableLocation(address);

  return {
    readableName,
    fullDisplayName: data.display_name || "Unknown location",
  };
}

let lastSavedLocationKey = null;

async function saveReadableUserLocation(lat, lng) {
  const user = auth.currentUser;
  if (!user) return;

  const roundedLat = lat.toFixed(3);
  const roundedLng = lng.toFixed(3);
  const locationKey = `${roundedLat},${roundedLng}`;

  if (lastSavedLocationKey === locationKey) return;
  lastSavedLocationKey = locationKey;

  try {
    const { readableName, fullDisplayName } = await reverseGeocode(lat, lng);

    await setDoc(doc(db, "users", user.uid), {
      location: readableName,
      locationFull: fullDisplayName,
      latitude: lat,
      longitude: lng,
      locationUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  } catch (error) {
    console.error("Error saving readable user location:", error);
  }
}

function watchUserLocation(map) {
  if (!("geolocation" in navigator)) {
    console.error("Geolocation is not supported by this browser.");
    return;
  }

  let userMarker = null;
  let accuracyCircle = null;

  navigator.geolocation.watchPosition(
    ({ coords: { latitude: lat, longitude: lng, accuracy } }) => {
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
      } else {
        userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
      }
      if (accuracyCircle) accuracyCircle.remove();
      accuracyCircle = L.circle([lat, lng], { radius: accuracy }).addTo(map);

      saveReadableUserLocation(lat, lng);


    },
    (error) => console.error("Error getting user location:", error)
    
  );
}

// ─────────────────────────────────────────────
// PLACE MARKERS
// ─────────────────────────────────────────────

async function loadPlaceMarkers(map, onMarkerClick) {
  const placeMarkers = new Map();

  try {
    const snapshot = await getDocs(locationsRef);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const lat = Number(data.Latitude);
      const lng = Number(data.Longitude);

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        console.warn("Missing lat/lng for doc:", docSnap.id, data);
        return;
      }

      const marker = L.marker([lat, lng], { icon: mapIcon })
        .addTo(map)
        .on("click", () => onMarkerClick(lat, lng));

      placeMarkers.set(docSnap.id, marker);
    });
  } catch (err) {
    console.error("Error fetching Places:", err);
  }

  return placeMarkers;
}

// ─────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────

async function searchPlaces(text) {
  if (!text) return [];
  const search = text.trim().toLowerCase();
  const snapshot = await getDocs(locationsRef);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((place) => (place.Names || "").toLowerCase().includes(search));
}

function initSearch(map, placeMarkers) {
  const input = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const searchBar = document.getElementById("searchBar");

  if (!input || !searchResults || !searchBar) return;

  function hideResults() {
    searchResults.innerHTML = "";
    searchResults.classList.remove("has-results");
  }

  function renderResults(places) {
    searchResults.innerHTML = "";
    if (places.length === 0) { hideResults(); return; }

    places.forEach((place) => {
      const item = document.createElement("div");
      item.textContent = place.Names;
      item.className = "search-result-item";
      item.addEventListener("click", () => {
        const lat = Number(place.Latitude);
        const lng = Number(place.Longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return;

        map.setView([lat, lng], 16);
        placeMarkers.get(place.id)?.fire("click");
        input.value = place.Names;
        hideResults();
      });
      searchResults.appendChild(item);
    });

    searchResults.classList.add("has-results");
  }

  input.addEventListener("input", async () => {
    const text = input.value.trim();
    if (!text) { hideResults(); return; }
    try {
      renderResults(await searchPlaces(text));
    } catch (error) {
      console.error("Error searching places:", error);
      hideResults();
    }
  });

  // Close results when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchBar.contains(e.target)) hideResults();
  });

  // Disable map interaction when hovering over search UI
  const disableMap = () => { map.dragging.disable(); map.scrollWheelZoom.disable(); };
  const enableMap  = () => { map.dragging.enable();  map.scrollWheelZoom.enable();  };

  searchBar.addEventListener("mouseenter", disableMap);
  searchBar.addEventListener("mouseleave", enableMap);
  searchResults.addEventListener("mouseenter", disableMap);
  searchResults.addEventListener("mouseleave", enableMap);
  searchResults.addEventListener("wheel", (e) => e.stopPropagation());

  // Prevent accidental drag-and-drop into input
  input.addEventListener("dragover", (e) => e.preventDefault());
  input.addEventListener("drop", (e) => e.preventDefault());
}

// ─────────────────────────────────────────────
// SAVED LOCATIONS
// ─────────────────────────────────────────────

async function saveLocationForCurrentUser(locationId, placeData) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please log in first to save locations.");
    return;
  }

  try {
    const savedRef = collection(db, "users", user.uid, "savedLocations");
    const duplicateSnap = await getDocs(
      query(savedRef, where("locationId", "==", locationId))
    );

    if (!duplicateSnap.empty) {
      alert("This location is already saved.");
      return;
    }

    await addDoc(savedRef, {
      locationId,
      title: placeData.Names || "Unnamed Location",
      note: `Lat: ${placeData.Latitude}, Lng: ${placeData.Longitude}`,
      latitude: Number(placeData.Latitude),
      longitude: Number(placeData.Longitude),
      createdAt: serverTimestamp(),
    });

    alert("Location saved successfully.");
  } catch (error) {
    console.error("Error saving location:", error);
    alert("Could not save location.");
  }
}

// ─────────────────────────────────────────────
// BOOKMARK
// ─────────────────────────────────────────────

async function initBookmarkButton(locationId, locationData) {
  const currentUser = auth.currentUser;
  const bookmarkBtn = document.getElementById("bookmark-btn");
  if (!bookmarkBtn) return;

  const btn = bookmarkBtn.cloneNode(true);
  bookmarkBtn.parentNode.replaceChild(btn, bookmarkBtn);

  if (!currentUser) {
    btn.classList.remove("saved");
    btn.addEventListener("click", () => {
      alert("Please log in first to save locations.");
    });
    return;
  }

  const savedRef = collection(db, "users", currentUser.uid, "savedLocations");
  const savedQ = query(savedRef, where("locationId", "==", locationId));
  const savedSnap = await getDocs(savedQ);

  btn.classList.toggle("saved", !savedSnap.empty);

  btn.addEventListener("click", async () => {
    try {
      const latestSnap = await getDocs(savedQ);

      if (!latestSnap.empty) {
        await deleteDoc(latestSnap.docs[0].ref);
        btn.classList.remove("saved");
      } else {
        await addDoc(savedRef, {
          locationId,
          title: locationData.Names || "Unnamed Location",
          note: "",
          latitude: Number(locationData.Latitude),
          longitude: Number(locationData.Longitude),
          createdAt: serverTimestamp(),
        });
        btn.classList.add("saved");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      alert("Could not update saved location.");
    }
  });
}

// ─────────────────────────────────────────────
// VOTING
// ─────────────────────────────────────────────

async function getVoteCounts(postId) {
  const votesSnap = await getDocs(collection(db, "posts", postId, "votes"));
  let upvotes = 0;
  let total = 0;
  votesSnap.forEach((d) => {
    if (d.data().vote === 1) upvotes++;
    total++;
  });
  return { upvotes, total };
}

async function castVote(postId, value, postEl) {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) return;

  const voteRef = doc(db, "posts", postId, "votes", currentUserId);
  const existing = await getDoc(voteRef);
  const currentVote = existing.exists() ? existing.data().vote : null;

  const upBtn = postEl.querySelector(".upvote");
  const downBtn = postEl.querySelector(".downvote");

  if (currentVote === value) {
    upBtn.classList.remove("active");
    downBtn.classList.remove("active");
    await deleteDoc(voteRef);
  } else {
    upBtn.classList.toggle("active", value === 1);
    downBtn.classList.toggle("active", value === -1);
    await setDoc(voteRef, { vote: value });
  }
}

async function initVoteButtons(postId, postEl) {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) return;

  const voteRef = doc(db, "posts", postId, "votes", currentUserId);
  const existing = await getDoc(voteRef);

  if (existing.exists()) {
    const v = existing.data().vote;
    if (v === 1)  postEl.querySelector(".upvote").classList.add("active");
    if (v === -1) postEl.querySelector(".downvote").classList.add("active");
  }

  postEl.querySelector(".upvote").addEventListener("click",   () => castVote(postId, 1,  postEl));
  postEl.querySelector(".downvote").addEventListener("click", () => castVote(postId, -1, postEl));
}

// ─────────────────────────────────────────────
// POST RENDERING
// ─────────────────────────────────────────────

function buildPostHTML(postId, data, userData, upvotes, total) {
  const pct = total > 0 ? (upvotes / total * 100).toFixed(0) : 0;
  return `
    <div class="post" data-post-id="${postId}">
      <div class="user">
        <img src="images/${userData.profile_img}" alt="profile-picture"/>
        <p class="user-name">${userData.name}</p>
        <div class="timestamp">
          <small>${data.timestamp.toDate().toLocaleString()}</small>
        </div>
      </div>
      <div class="post-content">
        <img class="post-image" src="data:image/png;base64,${data.img}"/>
        <p class="post-caption">${data.caption}</p>
        <div class="rating">
          <p class="estimate">Estimate: ${data.headcount_estimate} people</p>
          <small>Is this accurate?</small>
          <button class="upvote vote-button"><img src="images/thumb-up.png"/></button>
          <button class="downvote vote-button"><img src="images/thumb-down.png"/></button>
          <p>${upvotes} of ${total} people agree (${pct}%)</p>
        </div>
      </div>
    </div>
  `;
}

async function loadLocationPosts(locationId, locationFeedEl) {
  const postsQuery = query(
    postsRef,
    where("location_id", "==", locationId),
    orderBy("timestamp", "desc"),
    limit(POST_LIMIT)
  );

  const postsSnap = await getDocs(postsQuery);
  locationFeedEl.innerHTML = "";
  let totalHeadcount = 0;

  for (const postSnap of postsSnap.docs) {
    const data = postSnap.data();
    const userDoc = await getDoc(doc(usersRef, data.user_id));
    const { upvotes, total } = await getVoteCounts(postSnap.id);

    locationFeedEl.insertAdjacentHTML(
      "beforeend",
      buildPostHTML(postSnap.id, data, userDoc.data(), upvotes, total)
    );

    const postEl = locationFeedEl.querySelector(`[data-post-id="${postSnap.id}"]`);
    await initVoteButtons(postSnap.id, postEl);

    totalHeadcount += Number(data.headcount_estimate);
  }

  const count = postsSnap.size || 1;
  return totalHeadcount / count;
}

// ─────────────────────────────────────────────
// LOCATION POPUP
// ─────────────────────────────────────────────

const popup = document.getElementById("location-popup");
function showPopup() {
  popup.style.display = "block";      // make it mount

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      popup.classList.add("show"); // animate in
    });
  });
}

function hidePopup() {
  popup.classList.remove("show");     // animate out
  popup.addEventListener("transitionend", () => {
    if (!popup.classList.contains("show")) {
      popup.style.display = "none";   // fully hide after animation
    }
  }, { once: true });
}

async function showLocationDetails(lat, lng) {
  const locationSnap = await getDocs(
    query(locationsRef, where("Latitude", "==", lat), where("Longitude", "==", lng))
  );

  if (locationSnap.empty) {
    console.warn("No matching location found");
    return;
  }

  const docSnap = locationSnap.docs[0];
  const locationData = docSnap.data();
  const locationId = docSnap.id;
  
  // if (popup) popup.style.display = "block";

  const closeBtn = document.getElementById("close-location-button");
  if (closeBtn) closeBtn.onclick = hidePopup;
  // if (closeBtn) closeBtn.onclick = closeLocationPopup;

  // Populate name
  const locationNameEl = document.getElementById("location-name");
  if (locationNameEl) locationNameEl.textContent = locationData.Names;

  // Bookmark
  await initBookmarkButton(locationId, locationData);

  // Posts & crowd estimate
  const locationFeedEl = document.getElementById("location-feed");
  if (locationFeedEl) {
    const avgHeadcount = await loadLocationPosts(locationId, locationFeedEl);
    const crowdEl = document.getElementById("crowd-info");
    if (crowdEl) crowdEl.textContent = "Crowd Estimate: " + avgHeadcount;
  }

  // Buttons
  const rateBtn = document.getElementById("rate-location-button");
  if (rateBtn) rateBtn.onclick = () => { location.href = `rate.html?lat=${lat}&long=${lng}`; };
  // Show popup
  showPopup();


}

function closeLocationPopup() {
  const popup = document.getElementById("location-popup");
  if (popup) popup.style.display = "none";
}


// ─────────────────────────────────────────────
// RATE POPUP
// ─────────────────────────────────────────────

function showRatePopup(locationName, lat, lng) {
  document.getElementById("popup-location-name").textContent = locationName;

  const overlay = document.getElementById("location-overlay");
  overlay.style.display = "flex"; // ← directly set display instead of toggling a class

  document.getElementById("rate-btn").onclick = () => {
    window.location.href = `/rate.html?lat=${lat}&lng=${lng}`;
  };
}

function closeRatePopup() {
  document.getElementById("location-overlay").style.display = "none";
}

// ─────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────

function openLocationFromQueryParams(map) {
  const params = new URLSearchParams(window.location.search);
  const latParam = params.get("lat");
  const lngParam = params.get("lng");

  if (latParam === null || lngParam === null) return;

  const lat = Number(latParam);
  const lng = Number(lngParam);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

  map.setView([lat, lng], 16);

  setTimeout(() => {
    showLocationDetails(lat, lng);
  }, 300);
}

document.addEventListener("DOMContentLoaded", async () => {
  const mapEl = document.getElementById("map");

  if (mapEl) {
    const map = initMap();
    watchUserLocation(map);

    const placeMarkers = await loadPlaceMarkers(map, showLocationDetails);
    initSearch(map, placeMarkers);
    openLocationFromQueryParams(map);

    const closest = await findClosestLocation(db);
    if (closest && closest.distance <= PROXIMITY_THRESHOLD_KM) {
      showRatePopup(closest.Names, closest.Latitude, closest.Longitude);
    }
  }

  document.getElementById("close-rate-btn").addEventListener("click", (e) => {
    closeRatePopup();
  });
  // checkAndShowPopup();
});

const hamburger = document.getElementById("hamburger");
const menu = document.getElementById("menu");

if (hamburger && menu) {
  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  });

  window.addEventListener("click", (e) => {
    if (!hamburger.contains(e.target) && !menu.contains(e.target)) {
      menu.style.display = "none";
    }
  });
}