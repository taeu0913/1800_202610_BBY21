import { db } from "./firebaseConfig.js";
import {
  collection,
  query,
  orderBy,
  startAt,
  endAt,
  getDocs
} from "firebase/firestore";

console.log("main.js loaded");
const mapEl = document.getElementById("map");

if (mapEl) {
  // Create list of preset locations
  const locations = [
    { name: "BC Place", lat: 49.2768, lng: -123.1120 },
    { name: "Hastings Park", lat: 49.2833, lng: -123.0379 }
  ];

  function showLocationDetails() {
    const locationPopup = document.getElementById("location-popup");
    if (!locationPopup) return;

    locationPopup.style.display =
      locationPopup.style.display === "none" ? "block" : "none";
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

  // Add preset locations to map
  locations.forEach((loc) => {
    L.marker([loc.lat, loc.lng])
      .addTo(map)
      .on("click", () => showLocationDetails(loc));
  });

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
}