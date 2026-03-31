import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig.js";

const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.error("Geolocation error:", err.code, err.message);
        reject(err);
      }
    );
  });
};

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const findClosestLocation = async (db) => {
  const userPos = await getUserLocation();
  console.log("User position:", userPos);

  const snapshot = await getDocs(collection(db, "Places"));
  console.log("Total places fetched:", snapshot.size);

  let closest = null;
  let minDistance = Infinity;

  snapshot.forEach((doc) => {
    const { Latitude, Longitude, Names } = doc.data();
    const dist = haversineDistance(userPos.lat, userPos.lng, Latitude, Longitude);
    console.log(`Place: ${Names}, Distance: ${dist.toFixed(3)} km`); // ← shows every place + distance
    if (dist < minDistance) {
      minDistance = dist;
      closest = { id: doc.id, ...doc.data(), distance: dist };
    }
  });

  console.log("Closest:", closest?.Names, "| Distance:", closest?.distance.toFixed(3), "km");
  return closest;
};

const PROXIMITY_THRESHOLD_KM = 0.4;

export function showLocationPopup(locationName, lat, lng) {
  document.getElementById("popup-location-name").textContent = locationName;

  const overlay = document.getElementById("location-overlay");
  overlay.style.display = "flex"; // ← directly set display instead of toggling a class

  document.getElementById("rate-btn").onclick = () => {
    window.location.href = `/map?lat=${lat}&lng=${lng}`;
  };
}

export function closeLocationPopup() {
  document.getElementById("location-overlay").style.display = "none";
  sessionStorage.setItem("popupShown", "true"); // ← also mark dismissed
}
window.closeLocationPopup = closeLocationPopup;


const checkAndShowPopup = async () => {
  // Don't show if already seen this session
  if (sessionStorage.getItem("popupShown")) return;

  try {
    const closest = await findClosestLocation(db);

    if (closest && closest.distance <= PROXIMITY_THRESHOLD_KM) {
      showLocationPopup(closest.Names, closest.Latitude, closest.Longitude);
      sessionStorage.setItem("popupShown", "true"); // ← mark as shown
    }
  } catch (err) {
    console.error("Could not determine location:", err);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("location-overlay").addEventListener("click", (e) => {
    if (e.target.id === "location-overlay") closeLocationPopup();
  });

  checkAndShowPopup();
});