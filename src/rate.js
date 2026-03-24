//import functions as needed
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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
        localStorage.setItem("inputmage", base64String);
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

function getNearestLocationId(latitude, longitude) {
  return "HpsHQPQicGd7cvRQi6U6";
}
//------------------------------------------------------------
// This function saves the post data (description and image) to Firestore
// when the "Save Post" button is clicked.
//-------------------------------------------------------------
async function savePost() {
  alert("SAVE POST is triggered");

  const user = auth.currentUser;
  if (!user) {
    console.log("Error, no user signed in");
    return;
  }

  const desc = document.getElementById("post-caption").value;
  const headcount = document.getElementById("headcount-input").value;

  // Get Base64 image from Local Storage
  const inputImage = localStorage.getItem("inputImage") || "";

  // Get the user's geolocation (wrapped in a Promise)
  const position = await getCurrentPositionSafe();

  const latitude = position?.coords?.latitude || null;
  const longitude = position?.coords?.longitude || null;

  const location = getNearestLocationId(latitude, longitude);

  try {
    // Save post to Firestore with geolocation
    const docRef = await addDoc(collection(db, "posts"), {
      user_id: user.uid,
      headcount_estimate: headcount,
      caption: desc,
      image: inputImage,
      num_likes: 0,
      num_votes: 0,
      timestamp: serverTimestamp(),
      location_id: location
    });

    console.log("Post document added");
    console.log(docRef.id);

    // Optional: savePostIDforUser(docRef.id);
    // Do you want to keep track if what posts the user has done?

  } catch (error) {
    console.error("Error adding post:", error);
  }
}

uploadImage();

//------------------------------------------------------------
// Add event listener to the "Save Post" button
//-------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const submit_button = document.getElementById("submit-button");
  submit_button.addEventListener("click", savePost);
});


onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
});

//Logout - logoutBtn
// const logoutBtn = document.getElementById("logoutBtn");

// function logoutUser() {
//   signOut(auth)
//     .then(() => {
//       console.log("User logged out");
//       window.location.href = "login.html"; // redirect after logout
//     })
//     .catch((error) => {
//       console.error("Logout error:", error);
//     });
// }

// if (logoutBtn) {
//   logoutBtn.addEventListener("click", logoutUser);
// }