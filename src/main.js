// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap';

console.log("main.js loaded");
const mapEl = document.getElementById("map");

if (mapEl) {
// Create list of locations
const locations = [
  { name: "BC Place", lat: 49.2768, lng: -123.1120 },
  { name: "Hastings Park", lat: 49.2833, lng: -123.0379 }
];

function showLocationDetails() {
  let location_popup = document.getElementById("location-popup");
  let location_name = location_popup.location_name;
  let crowd = location_popup.crowd_info;
  location_popup.style.display = (location_popup.style.display === "none" ? "block" : "none");
}

// Initialize map
var map = L.map('map').setView([49.2768, -123.1120], 13);
var marker;

// add the tile layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// add preset locations to map
locations.forEach(loc => {
  L.marker([loc.lat, loc.lng])
    .addTo(map)
    .on("click", () => showLocationDetails(loc))
});

// check if geolocation allowed
if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    function (position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      // set vies to current position
      map.setView([lat, lng], 30);

      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng]).addTo(map);
      }
    },
    // error callback
    function (error) {
      console.error("Error getting user location:", error);
    }
  );
} else {
  console.error("Geolocation is not supported by this browser.");
}

//SearchBar

// disable map dragging when typing/hover
const input = document.getElementById("searchInput");
const searchIcon = document.getElementById("search");

searchBar.addEventListener("mouseenter", () => {map.dragging.disable();});
searchBar.addEventListener("mouseleave", () => {map.dragging.enable();});

// stop droping anything into the input
input.addEventListener("dragover", (e) => e.preventDefault());
input.addEventListener("drop", (e) => e.preventDefault());


// If you have custom global styles, import them as well:
// import '../styles/style.css';
// document.addEventListener('DOMContentLoaded', sayHello);

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

