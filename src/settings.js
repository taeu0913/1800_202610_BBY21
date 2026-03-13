import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged, updateProfile, updatePassword } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const profileForm = document.getElementById("profileSettingsForm");
const passwordForm = document.getElementById("passwordForm");
const settingsMessage = document.getElementById("settingsMessage");

const settingsName = document.getElementById("settingsName");
const settingsLocation = document.getElementById("settingsLocation");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");

const lightModeBtn = document.getElementById("lightModeBtn");
const darkModeBtn = document.getElementById("darkModeBtn");


let currentUser = null;

function showMessage(message, type = "success") {
  const msg = document.getElementById("settingsMessage");
  if (!msg) return;

  msg.textContent = message;

  msg.classList.remove("success", "error", "show");
  msg.classList.add(type);

  setTimeout(() => {
    msg.classList.add("show");
  }, 10);

  setTimeout(() => {
    msg.classList.remove("show");
  }, 2500);
}

function applyTheme(theme) {
  document.body.classList.remove("light-mode", "dark-mode");
  document.body.classList.add(theme === "dark" ? "dark-mode" : "light-mode");
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  applyTheme(savedTheme);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();

      settingsName.value = data.name || user.displayName || "";
      settingsLocation.value = data.location || "";

      if (data.theme) {
        applyTheme(data.theme);
      }
    } else {
      settingsName.value = user.displayName || "";
    }
  } catch (error) {
    console.error(error);
    showMessage("Failed to load settings.");
  }
});

profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) return;

  const name = settingsName.value.trim();
  const location = settingsLocation.value.trim();

  try {
    await updateProfile(currentUser, {
      displayName: name
    });

    const userRef = doc(db, "users", currentUser.uid);

    await setDoc(
      userRef,
      {
        name,
        email: currentUser.email,
        username,
        location
      },
      { merge: true }
    );

    showMessage("Profile updated successfully.");
  } catch (error) {
    console.error(error);
    showMessage("Failed to update profile.");
  }
});

passwordForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) return;

  const password = newPassword.value.trim();
  const confirm = confirmPassword.value.trim();

  if (password.length < 6) {
    showMessage("Password must be at least 6 characters.", "error");
    return;
  }

  if (password !== confirm) {
    showMessage("Passwords do not match.", "error");
    return;
  }

  try {
    await updatePassword(currentUser, password);

    newPassword.value = "";
    confirmPassword.value = "";

    showMessage("Password updated successfully.", "success");
  } catch (error) {
    console.error(error);

    if (error.code === "auth/requires-recent-login") {
      showMessage("Please log in again before changing password.", "error");
    } else {
      showMessage("Failed to update password.", "error");
    }
  }
});

lightModeBtn?.addEventListener("click", async () => {
  applyTheme("light");
  localStorage.setItem("theme", "light");

  if (!currentUser) return;

  try {
    await setDoc(
      doc(db, "users", currentUser.uid),
      { theme: "light" },
      { merge: true }
    );

    showMessage("Light mode saved.");
  } catch (error) {
    console.error(error);
    showMessage("Failed to save theme.");
  }
});

darkModeBtn?.addEventListener("click", async () => {
  applyTheme("dark");
  localStorage.setItem("theme", "dark");

  if (!currentUser) return;

  try {
    await setDoc(
      doc(db, "users", currentUser.uid),
      { theme: "dark" },
      { merge: true }
    );

    showMessage("Dark mode saved.");
  } catch (error) {
    console.error(error);
    showMessage("Failed to save theme.");
  }
});
