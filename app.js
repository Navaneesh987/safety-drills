import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  initializeFirestore,
  doc,
  setDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);

// Helps Firestore work on networks where its normal connection is blocked.
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});

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

  try {

    showStatus("Getting your location...");

    const position = await getLocation();

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    showStatus("Location found. Recording it...");

    const sessionId = getSessionId();

    const saveLocation = setDoc(
      doc(db, "locations", sessionId),
      {
        sessionId: sessionId,
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy,
        timestamp: Timestamp.now()
      }
    );

    const timeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("FIRESTORE_TIMEOUT"));
      }, 15000);
    });

    await Promise.race([saveLocation, timeout]);

    showStatus(
      "Location successfully recorded.",
      "success"
    );

    allowBtn.textContent = "Location Recorded";

  } catch (error) {

    console.error("SAVE/LOCATION ERROR:", error);

    allowBtn.disabled = false;

    if (error.message === "FIRESTORE_TIMEOUT") {

      showStatus(
        "Could not connect to the database. Please try again.",
        "error"
      );

    } else if (error.code === 1) {

      showStatus(
        "Location permission was denied. Please allow location access.",
        "error"
      );

    } else if (error.code === 2) {

      showStatus(
        "Location is unavailable. Please check GPS/location services.",
        "error"
      );

    } else if (error.code === 3) {

      showStatus(
        "Location timed out. Please try again.",
        "error"
      );

    } else {

      showStatus(
        "Could not record your location. Please try again.",
        "error"
      );
    }
  }
});
