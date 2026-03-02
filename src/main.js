// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap';


// Initialize map
var map = L.map('map').setView([0, 0], 13);
var marker;

// add the tile layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

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


// If you have custom global styles, import them as well:
// import '../styles/style.css';
// document.addEventListener('DOMContentLoaded', sayHello);
const hamburger = document.getElementById("hamburger");
const menu = document.getElementById("menu");

hamburger.addEventListener("click", (e) => {
  e.stopPropagation();
  menu.style.display = menu.style.display === "block" ? "none" : "block";
});


// Optional: close menu when clicking outside
window.addEventListener("click", (e) => {
  if (!hamburger.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = "none";
  }
});
