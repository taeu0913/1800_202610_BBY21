// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap';
import { db } from "./firebaseConfig.js";
import { collection, query, doc, where, getDoc, getDocs, orderBy, limit } from "firebase/firestore";

console.log("main.js loaded");
const mapEl = document.getElementById("map");

if (mapEl) {
// Create list of locations
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
  crowd_estimate /= (location_posts.size == 0 ? 1 : location_posts.size);
  let crowd = document.getElementById("crowd-info");
  crowd.textContent = "Crowd Estimate: " + crowd_estimate;

  let location_popup = document.getElementById("location-popup");
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

