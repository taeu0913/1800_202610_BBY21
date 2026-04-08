import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged, updateProfile, updatePassword, verifyBeforeUpdateEmail } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const profileForm = document.getElementById("profileSettingsForm");
const passwordForm = document.getElementById("passwordForm");
const settingsMessage = document.getElementById("settingsMessage");

const settingsName = document.getElementById("settingsName");
const settingsEmail = document.getElementById("settingsEmail");
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

      if (settingsName) {
        settingsName.value = data.name || user.displayName || "";
      }

      if (settingsEmail) {
        settingsEmail.value = data.email || user.email || "";
      }

      // sync firestore email with auth email
      await setDoc(
        userRef,
        {
          email: user.email || "",
          pendingEmail: null
        },
        { merge: true }
      );

      if (data.theme) {
        applyTheme(data.theme);
      }

    } else {
      settingsName.value = user.displayName || "";
      settingsEmail.value = user.email || "";
    }

  } catch (error) {
    console.error(error);
    showMessage("Failed to load settings.", "error");
  }
});

profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) return;

  const name = settingsName.value.trim();
  const email = settingsEmail.value.trim().toLowerCase();

  if (!email) {
    showMessage("Email is required.", "error");
    return;
  }

  try {
    await updateProfile(currentUser, {
      displayName: name
    });

    const currentEmail = (currentUser.email || "").toLowerCase();

    if (email !== currentEmail) {
      console.log("Current auth email:", currentUser.email);
      console.log("Requested new email:", email);

      const actionCodeSettings = {
        url: "http://localhost:5173/login.html",
        handleCodeInApp: false
      };

      await verifyBeforeUpdateEmail(currentUser, email, actionCodeSettings);

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          name,
          pendingEmail: email
        },
        { merge: true }
      );

      showMessage(
        "Email change request submitted. Check your current email inbox for Firebase's message.",
        "success"
      );
      return;
    }

    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        name,
        email: currentUser.email || ""
      },
      { merge: true }
    );

    showMessage("Profile updated successfully.", "success");
  } catch (error) {
    console.error(error);

    if (error.code === "auth/requires-recent-login") {
      showMessage("Please log in again to change your email.", "error");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);

      return;
    } else if (error.code === "auth/invalid-email") {
      showMessage("Please enter a valid email address.", "error");
    } else if (error.code === "auth/email-already-in-use") {
      showMessage("That email is already in use.", "error");
    } else {
      showMessage("Failed to update profile.", "error");
    }
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
        showMessage("Session expired. Redirecting to login...", "error");

        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);

  return;
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

    showMessage("Light mode saved.", "success");
  } catch (error) {
    console.error(error);
    showMessage("Failed to save theme.", "error");
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

    showMessage("Dark mode saved.", "success");
  } catch (error) {
    console.error(error);
    showMessage("Failed to save theme.", "error");
  }
});