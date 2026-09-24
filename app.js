import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getFirestore, doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const allowBtn = document.getElementById("allowBtn");
const statusEl = document.getElementById("status");

function sessionId() {
  let id = localStorage.getItem("safetyDrillSessionId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("safetyDrillSessionId", id);
  }
  return id;
}

function status(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function getPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    });
  });
}

allowBtn.addEventListener("click", async () => {
  if (!("geolocation" in navigator)) {
    status("This browser does not support GPS location.", "error");
    return;
  }

  allowBtn.disabled = true;
  status("Requesting location permission…");

  try {
    const position = await getPosition();
    const { latitude, longitude, accuracy } = position.coords;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        !Number.isFinite(accuracy)) {
      throw new Error("Invalid location data received.");
    }

    const id = sessionId();

    await setDoc(doc(db, "locations", id), {
      participantId: id,
      latitude,
      longitude,
      accuracy,
      timestamp: serverTimestamp()
    });

    status("Location successfully recorded.", "success");
    allowBtn.textContent = "Location Recorded";
  } catch (error) {
    console.error(error);

    if (error.code === 1) {
      status("Location permission was denied. Please allow location access if you want to participate.", "error");
    } else if (error.code === 2) {
      status("Your location is currently unavailable. Please try again.", "error");
    } else if (error.code === 3) {
      status("Location request timed out. Please try again.", "error");
    } else if (error.message?.includes("permission-denied")) {
      status("The drill could not record the location because database access was denied. Check the Firebase rules.", "error");
    } else {
      status("We could not record your location. Please try again.", "error");
    }

    allowBtn.disabled = false;
  }
});
