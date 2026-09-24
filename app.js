import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  getFirestore,
  doc,
  setDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const allowBtn = document.getElementById("allowBtn");
const statusEl = document.getElementById("status");

function showStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = "status " + type;
}

function getSessionId() {
  let id = localStorage.getItem("safetyDrillSessionId");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("safetyDrillSessionId", id);
  }

  return id;
}

function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  });
}

allowBtn.addEventListener("click", async () => {

  if (!navigator.geolocation) {
    showStatus(
      "Location is not supported by this browser.",
      "error"
    );
    return;
  }

  allowBtn.disabled = true;
  showStatus("Getting your location...");

  try {

    const position = await getLocation();

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    showStatus("Location found. Recording it...");

    const sessionId = getSessionId();

    await setDoc(
      doc(db, "locations", sessionId),
      {
        sessionId: sessionId,
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy,
        timestamp: Timestamp.now()
      }
    );

    showStatus(
      "Location successfully recorded.",
      "success"
    );

    allowBtn.textContent = "Location Recorded";

  } catch (error) {

    console.error("Location error:", error);

    allowBtn.disabled = false;

    if (error.code === 1) {
      showStatus(
        "Location permission was denied. Please allow location access.",
        "error"
      );
    } else if (error.code === 2) {
      showStatus(
        "Location is unavailable. Turn ON phone Location and try again.",
        "error"
      );
    } else if (error.code === 3) {
      showStatus(
        "Location timed out. Please turn ON Location and try again.",
        "error"
      );
    } else {
      showStatus(
        "Could not get your location. Please try again.",
        "error"
      );
    }
  }
});
