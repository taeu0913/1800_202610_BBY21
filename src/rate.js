//import functions as needed
import { addDoc, query, where, collection, serverTimestamp, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "./firebaseConfig.js";

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

    if (file) {
      var reader = new FileReader(); // Create a FileReader to read the file

      // When file reading is complete
      reader.onload = function (e) {
        var base64String = e.target.result.split(',')[1]; // Extract Base64 data

        ///display the image for user to preview
        document.getElementById("upload-image-preview").src = e.target.result;

        // Save to localStorage for now until Post is submitted
        localStorage.setItem("inputImage", base64String);
        console.log("Image saved to localStorage as Base64 string.");
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

// function getLocationId (latitude, longitude) {
//   let lat = latitude;
//   let long = longitude;
//   if (!latitude || !longitude) {
//     const urlParams = new URLSearchParams(window.location.search);
//     lat = urlParams.get('lat');
//     long = urlParams.get('long');
//   }
//   const locationsRef = collection(db, "Places");
//   const location_q = query(
//     locationsRef,
//     where("Latitude", "==", lat),
//     where("Longitude", "==", long)
//   );

//   const location_doc = getDoc(location_q);
//   // let name = location_doc.data().Names;
//   console.log("location doc: " + location_doc);
//   console.log("location doc: " + location_doc.id);

//   return location_doc.id;
// }
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

  // Get Base64 image from Local Storage
  const inputImage = localStorage.getItem("inputImage") || "";

  if(inputImage === "") {
    console.log("no image");
    return;
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  console.log("doc exists:", userDoc.exists());
  console.log("doc id:", userDoc.id);
  const userDocId = userDoc.id;

  // Get the user's geolocation (wrapped in a Promise)
  // const position = await getCurrentPositionSafe();

  // const latitude = position?.coords?.latitude || null;
  // const longitude = position?.coords?.longitude || null;


  // const user_location = location_doc.FileReader;

  try {
    // Save post to Firestore with geolocation
    const docRef = await addDoc(collection(db, "posts"), {
      user_id: userDocId,
      headcount_estimate: headcount,
      caption: desc,
      img: inputImage,
      num_likes: 0,
      num_votes: 0,
      timestamp: serverTimestamp(),
      location_id: locId
    });

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
  const urlParams = new URLSearchParams(window.location.search);
  const latitude = parseFloat(urlParams.get('lat'));
  const longitude = parseFloat(urlParams.get('long'));


  const locationsRef = collection(db, "Places");
  const location_q = query(
    locationsRef,
    where("Latitude", "==", latitude),
    where("Longitude", "==", longitude)
  );

  const location_doc = await getDocs(location_q);

  if (location_doc.empty) {
    console.warn("No matching location found");
    return;
  }

  let location_name = document.getElementById("user-location");
  location_name.textContent = location_doc.docs[0].data().Names;

  const submit_button = document.getElementById("submit-button");
  submit_button.addEventListener("click", () => savePost(location_doc.docs[0].id));

});
