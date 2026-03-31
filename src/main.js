import { db } from "./firebaseConfig.js";
import { collection, query, doc, where, getDoc, getDocs, orderBy, limit, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

console.log("main.js loaded");
const mapEl = document.getElementById("map");

if (mapEl) {

  const auth = getAuth();
  const locationsRef = collection(db, "Places");
  const postsRef = collection(db, "posts");
  const usersRef = collection(db, "users");

  const map = L.map("map").setView([49.2768, -123.1120], 10);
  let marker;
  const placeMarkers = new Map();

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  var mapIcon = L.icon({
    iconUrl: '/images/marker.png',
    iconSize: [20, 25]
  });

  var userIcon = L.icon({
    iconUrl: '/images/person.png',
    iconSize: [50, 50]
  });

  if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        if (marker) {
          marker.setLatLng([lat, lng]);
          L.circle([lat, lng], { radius: accuracy }).addTo(map);
        } else {
          marker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
        }
      },
      function (error) {
        console.error("Error getting user location:", error);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }

  async function loadPlaceMarkers() {
    try {
      const snapshot = await getDocs(locationsRef);
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const lat = Number(data.Latitude);
        const lng = Number(data.Longitude);
        const name = data.Names;
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          console.log("Adding marker:", name, lat, lng);
          const m = L.marker([lat, lng], { icon: mapIcon })
            .addTo(map)
            .on("click", () => showLocationDetails(lat, lng));
          placeMarkers.set(docSnap.id, m);
        } else {
          console.warn("Missing lat/lng for doc:", docSnap.id, data);
        }
      });
    } catch (err) {
      console.error("Error fetching Places:", err);
    }
  }

  function openLocationFromQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const latParam = params.get("lat");
    const lngParam = params.get("lng");
    if (latParam === null || lngParam === null) return;
    const lat = Number(latParam);
    const lng = Number(lngParam);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    map.setView([lat, lng], 16);
    setTimeout(() => showLocationDetails(lat, lng), 300);
  }

  loadPlaceMarkers().then(() => {
    openLocationFromQueryParams();
  });

  const input = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const searchBar = document.getElementById("searchBar");

  function hideResults() {
    if (!searchResults) return;
    searchResults.innerHTML = "";
    searchResults.classList.remove("has-results");
  }

  function showResults() {
    if (!searchResults) return;
    searchResults.classList.add("has-results");
  }

  async function searchPlaces(text) {
    if (!text) return [];
    const search = text.trim().toLowerCase();
    const snapshot = await getDocs(collection(db, "Places"));
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((place) => (place.Names || "").toLowerCase().includes(search));
  }

  function renderResults(places) {
    if (!searchResults) return;
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
        const existingMarker = placeMarkers.get(place.id);
        if (existingMarker) existingMarker.fire("click");
        input.value = place.Names;
        hideResults();
      });
      searchResults.appendChild(item);
    });
    showResults();
  }

  async function saveLocationForCurrentUser(locationId, placeData) {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in first to save locations.");
      return;
    }
    try {
      const savedRef = collection(db, "users", user.uid, "savedLocations");
      const duplicateQ = query(savedRef, where("locationId", "==", locationId));
      const duplicateSnap = await getDocs(duplicateQ);
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
        createdAt: serverTimestamp()
      });
      alert("Location saved successfully.");
    } catch (error) {
      console.error("Error saving location:", error);
      alert("Could not save location.");
    }
  }

  async function showLocationDetails(lat, lng) {
    const location_q = query(
      locationsRef,
      where("Latitude", "==", lat),
      where("Longitude", "==", lng)
    );

    const location_doc = await getDocs(location_q);

    if (location_doc.empty) {
      console.warn("No matching location found");
      return;
    }

    const locationSnap = location_doc.docs[0];
    const locationData = locationSnap.data();
    const locationId = locationSnap.id;

    const location_name = document.getElementById("location-name");
    if (location_name) location_name.textContent = locationData.Names;

    // --- BOOKMARK SETUP ---
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userDoc = await getDoc(doc(usersRef, currentUser.uid));
      const savedPlaces = userDoc.data()?.savedPlaces || [];

      const bookmarkBtn = document.getElementById("bookmark-btn");
      if (bookmarkBtn) {
        bookmarkBtn.classList.toggle("saved", savedPlaces.includes(locationId));
        const newBtn = bookmarkBtn.cloneNode(true);
        bookmarkBtn.parentNode.replaceChild(newBtn, bookmarkBtn);
        newBtn.addEventListener("click", async () => {
          const isSaved = newBtn.classList.contains("saved");
          const userRef = doc(usersRef, currentUser.uid);
          if (isSaved) {
            await updateDoc(userRef, { savedPlaces: arrayRemove(locationId) });
            newBtn.classList.remove("saved");
          } else {
            await updateDoc(userRef, { savedPlaces: arrayUnion(locationId) });
            newBtn.classList.add("saved");
          }
        });
      }
    }
    // --- END BOOKMARK ---

    const posts_q = query(
      postsRef,
      where("location_id", "==", locationId),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const location_posts = await getDocs(posts_q);

    let crowd_estimate = 0;
    const location_feed = document.getElementById("location-feed");
    if (location_feed) location_feed.innerHTML = "";

    for (const post of location_posts.docs) {
      const data = post.data();
      const userDoc = await getDoc(doc(usersRef, data.user_id));
      const user_data = userDoc.data();

      if (location_feed) {
        location_feed.insertAdjacentHTML("beforeend", `
          <div class="post">
            <div class="user">
              <img src="images/${user_data.profile_img}" alt="profile-picture"/>
              <p class="user-name">${user_data.name}</p>
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
                <button class="vote-button"><img src="images/thumb-up.png"/></button>
                <button class="vote-button"><img src="images/thumb-down.png"/></button>
                <p>${data.num_likes} of ${data.num_votes} people agree (83%)</p>
              </div>
            </div>
          </div>
        `);
      }

      crowd_estimate += data.headcount_estimate;
    }

    crowd_estimate /= (location_posts.size === 0 ? 1 : location_posts.size);

    const crowd = document.getElementById("crowd-info");
    if (crowd) crowd.textContent = "Crowd Estimate: " + crowd_estimate;

    const rate_button = document.getElementById("rate-location-button");
    if (rate_button) {
      rate_button.onclick = () => {
        location.href = `rate.html?lat=${lat}&long=${lng}`;
      };
    }

    const save_button = document.getElementById("save-location-button");
    if (save_button) {
      save_button.onclick = async () => {
        await saveLocationForCurrentUser(locationId, locationData);
      };
    }

    const location_popup = document.getElementById("location-popup");
    if (location_popup) location_popup.style.display = "block";

    const close_button = document.getElementById("close-location-button");
    if (close_button) {
      close_button.onclick = () => closeLocationPopup();
    }
  }

  function closeLocationPopup() {
    const location_popup = document.getElementById("location-popup");
    if (location_popup) location_popup.style.display = "none";
  }

  input?.addEventListener("input", async () => {
    const text = input.value.trim();
    if (!text) { hideResults(); return; }
    try {
      const places = await searchPlaces(text);
      renderResults(places);
    } catch (error) {
      console.error("Error searching places:", error);
      hideResults();
    }
  });

  document.addEventListener("click", (e) => {
    if (!searchBar?.contains(e.target)) hideResults();
  });

  searchBar?.addEventListener("mouseenter", () => {
    map.dragging.disable();
    map.scrollWheelZoom.disable();
  });

  searchBar?.addEventListener("mouseleave", () => {
    map.dragging.enable();
    map.scrollWheelZoom.enable();
  });

  searchResults?.addEventListener("wheel", (e) => e.stopPropagation());

  searchResults?.addEventListener("mouseenter", () => {
    map.dragging.disable();
    map.scrollWheelZoom.disable();
  });

  searchResults?.addEventListener("mouseleave", () => {
    map.dragging.enable();
    map.scrollWheelZoom.enable();
  });

  input?.addEventListener("dragover", (e) => e.preventDefault());
  input?.addEventListener("drop", (e) => e.preventDefault());

}

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