import { collection, getDocs } from "firebase/firestore";

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
  const R = 6371; // Earth's radius in km
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
  console.log("finding closest location");
  const userPos = await getUserLocation();
  console.log("got user location");
  const snapshot = await getDocs(collection(db, "Places"));

  let closest = null;
  let minDistance = Infinity;

  snapshot.forEach((doc) => {
    const { Latitude, Longitude } = doc.data(); // adjust field names to match yours
    const dist = haversineDistance(userPos.lat, userPos.lng, Latitude, Longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closest = { id: doc.id, ...doc.data(), distance: dist };
    }
  });

  return closest; // { id, lat, lng, distance, ...other fields }
};