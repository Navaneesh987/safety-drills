import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
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
        enableHighAccuracy: true,
        timeout: 60000,
        maximumAge: 0
      }
    );

  });
}

allowBtn.addEventListener("click", async () => {

  if (!navigator.geolocation) {
    showStatus(
      "Location services are not supported by this browser.",
      "error"
    );
    return;
  }

  allowBtn.disabled = true;

  showStatus("Getting your location…");

  try {

    const position = await getLocation();

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    const participantId = getSessionId();

    showStatus("Location found. Recording it…");

    await setDoc(
      doc(db, "locations", participantId),
      {
        sessionId: participantId,
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy,
        timestamp: serverTimestamp()
      }
    );

    showStatus(
      "Location successfully recorded.",
      "success"
    );

    allowBtn.textContent = "Location Recorded";

  } catch (error) {

    console.error("Location error:", error);

    if (error.code === 1) {

      showStatus(
        "Location permission was denied. Please allow location access and try again.",
        "error"
      );

    } else if (error.code === 2) {

      showStatus(
        "Your location is currently unavailable. Please check GPS/location services and try again.",
        "error"
      );

    } else if (error.code === 3) {

      showStatus(
        "Location request timed out. Please make sure GPS/location is ON and try again.",
        "error"
      );

    } else {

      showStatus(
        "Something went wrong while recording your location. Please try again.",
        "error"
      );

    }

    allowBtn.disabled = false;
  }
});
