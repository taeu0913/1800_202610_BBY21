// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap';
import { db } from "./firebaseConfig.js";
import { collection, query, doc, where, getDoc, getDocs, orderBy, limit } from "firebase/firestore";

console.log("main.js loaded");
const mapEl = document.getElementById("map");

if (mapEl) {
  // Create list of preset locations
  const locations = [
    { name: "BC Place", lat: 49.2768, lng: -123.1120 },
    { name: "Hastings Park", lat: 49.2833, lng: -123.0379 }
  ];


const locationsRef = collection(db, "Places");
const postsRef = collection(db, "posts");
const usersRef = collection(db, "users");

async function showLocationDetails() {
  const location_q = query(locationsRef, where("Latitude", "==", 49.2768), where("Longitude", "==", -123.1120));
  const location_doc = await getDocs(location_q);
  
  let location_name = document.getElementById("location-name");
  location_name.textContent = location_doc.docs[0].data().Names;

  console.log("id: " + location_doc.docs[0].id);
  const posts_q = query(
    postsRef, 
    where("location_id", "==", location_doc.docs[0].id),
    orderBy("timestamp", "desc"),
    limit(5)
  );
  const location_posts = await getDocs(posts_q);

  let crowd_estimate = 0;  // mean of most recent 5 posts
  let location_feed = document.getElementById("location-feed");
  location_feed.innerHTML = "";
  console.log(location_posts.docs);
  for (const post of location_posts.docs) {
    console.log("entering loop");
    // doc.data() is never undefined for query doc snapshots
    let data = post.data();
    const userDoc = await getDoc(doc(usersRef, data.user_id));
    const user_data = userDoc.data();
    console.log("user data: " + user_data);
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
          <img class="post-image" src="images/${data.img}"/>
          <p class="post-caption">${data.caption}</p>
        </div>
      </div>
    `);

    crowd_estimate += data.headcount_estimate;
    
  }
  crowd_estimate /= (location_posts.size == 0 ? 1 : location_posts.size);
  let crowd = document.getElementById("crowd-info");
  crowd.textContent = "Crowd Estimate: " + crowd_estimate;

  let location_popup = document.getElementById("location-popup");
  location_popup.style.display = (location_popup.style.display === "none" ? "block" : "none");
}

  // Initialize map
  const map = L.map("map").setView([49.2768, -123.1120], 13);
  let marker;
  let searchMarker = null;

  // Add the tile layer
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);


  // Check if geolocation allowed
  if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        map.setView([lat, lng], 16);

        if (marker) {
          marker.setLatLng([lat, lng]);
        } else {
          marker = L.marker([lat, lng]).addTo(map);
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
    console.log("Total docs fetched:", snapshot.size); // ← does this print > 0?
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      console.log("Place doc:", data); // ← do you see your Places here?
      const lat = data.Latitude;
      const lng = data.Longitude;
      const name = data.Names;

      if (lat && lng) {
        console.log("Adding marker:", name, lat, lng);
        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(`<strong>${name}</strong>`)
          .on("click", () => showLocationDetails(lat, lng));
      } else {
        console.warn("Missing lat/lng for doc:", docSnap.id, data);
      }
    });
  } catch (err) {
    console.error("Error fetching Places:", err);
  }
}

loadPlaceMarkers()
//SearchBar

// disable map dragging when typing/hover
const input = document.getElementById("searchInput");
const searchIcon = document.getElementById("search");

// searchBar.addEventListener("mouseenter", () => {map.dragging.disable();});
// searchBar.addEventListener("mouseleave", () => {map.dragging.enable();});

// stop droping anything into the input
input.addEventListener("dragover", (e) => e.preventDefault());
input.addEventListener("drop", (e) => e.preventDefault());


// If you have custom global styles, import them as well:
// import '../styles/style.css';
// document.addEventListener('DOMContentLoaded', sayHello);

}
    // Search bar elements
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

        if (searchMarker) {
          map.removeLayer(searchMarker);
        }

        searchMarker = L.marker([lat, lng])
          .addTo(map)
          .bindPopup(place.Names)
          .openPopup();

        input.value = place.Names;
        hideResults();
      });

      searchResults.appendChild(item);
    });

    showResults();
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


