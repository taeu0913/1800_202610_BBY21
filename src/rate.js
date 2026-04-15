//import functions as needed
import { addDoc, query, where, collection, serverTimestamp, doc, getDoc, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebaseConfig.js";
import { findClosestLocation } from "./utils.js";

let currentImageBase64 = "";
const MAX_SIZE_KB = 800;


//------------------------------------------------------------
// This function is an Event Listener for the file (image) picker
// When an image is chosen, it will then save that image into the
// user's document in Firestore
//-------------------------------------------------------------
function uploadImage() {
  // Attach event listener to the file input
  // Function to handle file selection and Base64 encoding
  document.getElementById("upload-image").addEventListener("change", handleFileSelect);
  function handleFileSelect(event) {
    var file = event.target.files[0]; // Get the selected file


    if (file.size > MAX_SIZE_KB * 1024) {
      alert(`Image must be under ${MAX_SIZE_KB}KB.`);
      event.target.value = ""; // reset the input
      return;
    }

    if (file) {
      var reader = new FileReader(); // Create a FileReader to read the file

      // When file reading is complete
      reader.onload = function (e) {

        ///display the image for user to preview
        document.getElementById("upload-image-preview").src = e.target.result;

        currentImageBase64 = e.target.result.split(',')[1];
      };

      // Read the file as a Data URL (Base64 encoding)
      reader.readAsDataURL(file);
    }
  }
}
//------------------------------------------------------------
// This function gets the current geolocation position safely.
// It returns a Promise that resolves to the position or null if
// geolocation is not available or permission is denied.
//-------------------------------------------------------------
function getCurrentPositionSafe() {
    return new Promise(resolve => {
        if (!navigator.geolocation) return resolve(null);

        navigator.geolocation.getCurrentPosition(
            pos => resolve(pos),
            () => resolve(null),
            { enableHighAccuracy: true }
        );
    });
}

//------------------------------------------------------------
// This function saves the post data (description and image) to Firestore
// when the "Save Post" button is clicked.
//-------------------------------------------------------------
async function savePost(locId) {
  console.log("SAVE POST is triggered");

  const user = auth.currentUser;
  if (!user) {
    console.log("Error, no user signed in");
    return;
  }

  if (currentImageBase64 === "") {
    console.log("no image");
    return;
  }

  const desc = document.getElementById("post-caption").value;
  const headcount_input = document.getElementById("headcount-input")?.value;
  if (headcount_input === "" || headcount_input === undefined) {
    console.log("invalid headcount");
    return;
  }
  const headcount = Number(headcount_input);
  if (!Number.isInteger(headcount) || headcount < 0) {
    console.log("invalid headcount");
    return;
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  console.log("doc exists:", userDoc.exists());
  console.log("doc id:", userDoc.id);
  const userDocId = userDoc.id;

  try {
    // Save post to Firestore with geolocation
    const docRef = await addDoc(collection(db, "posts"), {
      user_id: userDocId,
      headcount_estimate: headcount,
      caption: desc,
      img: currentImageBase64,
      timestamp: serverTimestamp(),
      location_id: locId
    });

    currentImageBase64 = "";

    console.log("Post document added");
    console.log(docRef.id);
    location.href = "feed.html";

  } catch (error) {
    console.error("Error adding post:", error);
  }
}

uploadImage();

//------------------------------------------------------------
// Add event listener to the "Save Post" button
//-------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  console.log("dom loaded listener");
  const urlParams = new URLSearchParams(window.location.search);
  const latitude = parseFloat(urlParams.get('lat'));
  const longitude = parseFloat(urlParams.get('long'));

  let closest;

  try {
    closest = await findClosestLocation(db);
    console.log("closest found via findClosestLocation: " + closest);
  } catch (err) {
    console.warn("findClosestLocation failed, falling back to lat/long params:", err);

    if (!isNaN(latitude) && !isNaN(longitude)) {
      const placesRef = collection(db, "Places");
      const q = query(placesRef, where("Latitude", "==", latitude), where("Longitude", "==", longitude));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        console.warn("No location found matching lat/long params");
        return;
      }

      const matchedDoc = querySnap.docs[0];
      closest = { id: matchedDoc.id, ...matchedDoc.data() };
      console.log("closest found via lat/long fallback: " + closest.id);
    } else {
      console.warn("No valid lat/long params available for fallback");
      return;
    }
  }

  console.log("closest id: " + closest.id);
  const locationRef = doc(db, "Places", closest.id);
  const locationSnap = await getDoc(locationRef);

  if (!locationSnap.exists()) {
    console.warn("No matching location found");
    return;
  }

  let location_name = document.getElementById("user-location");
  location_name.textContent = locationSnap.data().Names;

  console.log("adding listener");
  const submit_button = document.getElementById("submit-button");
  submit_button.addEventListener("click", () => savePost(locationSnap.id));

});


onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
});
