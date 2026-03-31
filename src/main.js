// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap';
import { db } from "./firebaseConfig.js";
import { collection, query, doc, where, getDoc, getDocs, orderBy, limit, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { getAuth } from "firebase/auth";

console.log("main.js loaded");
const mapEl = document.getElementById("map");

if (mapEl) {

  const auth = getAuth(); 
  const locationsRef = collection(db, "Places");
  const postsRef = collection(db, "posts");
  const usersRef = collection(db, "users");

  // Initialize map
  const map = L.map("map").setView([49.2768, -123.1120], 10);
  let marker;
  const placeMarkers = new Map();


  // Add the tile layer
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
  // Check if geolocation allowed
  if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        //map.setView([lat, lng], 10); <-- dont uncomment unless needed!!!!!!

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

  // function that loads 
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

  loadPlaceMarkers();
  //SearchBar
  // Search bar elements
  const searchIcon = document.getElementById("search");
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

  // Firestore search
  async function searchPlaces(text) {
    if (!text) return [];

    const search = text.trim().toLowerCase();
    const snapshot = await getDocs(collection(db, "Places"));

    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((place) =>
        (place.Names || "").toLowerCase().includes(search)
      );
  }

  function renderResults(places) {
    if (!searchResults) return;

    searchResults.innerHTML = "";

    if (places.length === 0) {
      hideResults();
      return;
    }

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
        if (existingMarker) {
          existingMarker.fire("click");
        }

        input.value = place.Names;
        hideResults();
      });

      searchResults.appendChild(item);
    });

    showResults();
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

    const placeId = location_doc.docs[0].id;

    let location_name = document.getElementById("location-name");
    location_name.textContent = location_doc.docs[0].data().Names;

    // --- BOOKMARK SETUP ---
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userDoc = await getDoc(doc(usersRef, currentUser.uid));
      const savedPlaces = userDoc.data()?.savedPlaces || [];

      const bookmarkBtn = document.getElementById("bookmark-btn");
      bookmarkBtn.classList.toggle("saved", savedPlaces.includes(placeId));

      const newBtn = bookmarkBtn.cloneNode(true);
      bookmarkBtn.parentNode.replaceChild(newBtn, bookmarkBtn);

      newBtn.addEventListener("click", async () => {
        const isSaved = newBtn.classList.contains("saved");
        const userRef = doc(usersRef, currentUser.uid);

        if (isSaved) {
          await updateDoc(userRef, { savedPlaces: arrayRemove(placeId) });
          newBtn.classList.remove("saved");
        } else {
          await updateDoc(userRef, { savedPlaces: arrayUnion(placeId) });
          newBtn.classList.add("saved");
        }
      });
    }
    // --- END BOOKMARK ---

    const posts_q = query(
      postsRef,
      where("location_id", "==", location_doc.docs[0].id),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const location_posts = await getDocs(posts_q);

    let crowd_estimate = 0;
    let location_feed = document.getElementById("location-feed");
    location_feed.innerHTML = "";

    for (const post of location_posts.docs) {
      let data = post.data();
      const userDoc = await getDoc(doc(usersRef, data.user_id));
      const user_data = userDoc.data();

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
              <p class="estimate">
                Estimate: ${data.headcount_estimate} people
              </p>
              <small>Is this accurate?</small>
              <button class="vote-button">
                <img src="images/thumb-up.png"/>
              </button>
              <button class="vote-button">
                <img src="images/thumb-down.png"/>
              </button>
              <p>${data.num_likes} of ${data.num_votes} people agree (83%)</p>
            </div>
          </div>
        </div>
      `);

      crowd_estimate += data.headcount_estimate;
    }

    crowd_estimate /= (location_posts.size === 0 ? 1 : location_posts.size);

    let crowd = document.getElementById("crowd-info");
    crowd.textContent = "Crowd Estimate: " + crowd_estimate;

    let rate_button = document.getElementById("rate-location-button");
    rate_button?.addEventListener("click", () => {
      console.log("rate button clicked");
      location.href = `rate.html?lat=${lat}&long=${lng}`;
    });

    let location_popup = document.getElementById("location-popup");
    location_popup.style.display = "block";

    let close_button = document.getElementById("close-location-button");
    close_button.addEventListener("click", () => {
      closeLocationPopup();
    });
  }

  function closeLocationPopup() {
    let location_popup = document.getElementById("location-popup");
    location_popup.style.display = "none";
  }

  input?.addEventListener("input", async () => {
    const text = input.value.trim();

    if (!text) {
      hideResults();
      return;
    }

    try {
      const places = await searchPlaces(text);
      renderResults(places);
    } catch (error) {
      console.error("Error searching places:", error);
      hideResults();
    }
  });

  // Hide results when clicking outside search area
  document.addEventListener("click", (e) => {
    if (!searchBar?.contains(e.target)) {
      hideResults();
    }
  });

  // Prevent map dragging while using search area
  searchBar?.addEventListener("mouseenter", () => {
    map.dragging.disable();
    map.scrollWheelZoom.disable();
  });

  searchBar?.addEventListener("mouseleave", () => {
    map.dragging.enable();
    map.scrollWheelZoom.enable();
  });

  // Prevent map zoom/move when scrolling inside results
  searchResults?.addEventListener("wheel", (e) => {
    e.stopPropagation();
  });

  searchResults?.addEventListener("mouseenter", () => {
    map.dragging.disable();
    map.scrollWheelZoom.disable();
  });

  searchResults?.addEventListener("mouseleave", () => {
    map.dragging.enable();
    map.scrollWheelZoom.enable();
  });

  // Stop dropping anything into the input
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


