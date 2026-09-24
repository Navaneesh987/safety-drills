import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
  getFirestore, collection, getDocs, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const login = document.getElementById("login");
const dashboard = document.getElementById("dashboard");
const loginStatus = document.getElementById("loginStatus");
const recordsEl = document.getElementById("records");
const countEl = document.getElementById("count");

let map;
let markers = [];

function initMap() {
  if (map) return;
  map = L.map("map").setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
}

function clearMarkers() {
  markers.forEach(m => m.remove());
  markers = [];
}

function formatTime(ts) {
  if (!ts?.toDate) return "Pending…";
  return ts.toDate().toLocaleString();
}

async function loadLocations() {
  initMap();
  clearMarkers();
  recordsEl.innerHTML = "";

  const q = query(
    collection(db, "locations"),
    orderBy("timestamp", "desc"),
    limit(500)
  );

  const snapshot = await getDocs(q);
  countEl.textContent = `${snapshot.size} recent location record(s)`;
  const bounds = [];

  snapshot.forEach((docSnap) => {
    const d = docSnap.data();
    const lat = Number(d.latitude);
    const lng = Number(d.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`
      <strong>Participant:</strong> ${escapeHtml(d.participantId)}<br>
      <strong>Latitude:</strong> ${lat.toFixed(6)}<br>
      <strong>Longitude:</strong> ${lng.toFixed(6)}<br>
      <strong>Accuracy:</strong> ${Number(d.accuracy).toFixed(1)} m<br>
      <strong>Time:</strong> ${escapeHtml(formatTime(d.timestamp))}
    `);
    markers.push(marker);
    bounds.push([lat, lng]);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(d.participantId)}</td>
      <td>${lat.toFixed(6)}</td>
      <td>${lng.toFixed(6)}</td>
      <td>${Number(d.accuracy).toFixed(1)} m</td>
      <td>${escapeHtml(formatTime(d.timestamp))}</td>
    `;
    recordsEl.appendChild(tr);
  });

  if (bounds.length) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

document.getElementById("loginBtn").addEventListener("click", async () => {
  loginStatus.textContent = "Signing in…";
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("email").value.trim(),
      document.getElementById("password").value
    );
  } catch {
    loginStatus.textContent = "Sign-in failed. Check the administrator email and password.";
    loginStatus.className = "status error";
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => signOut(auth));
document.getElementById("refreshBtn").addEventListener("click", () => loadLocations());

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    login.style.display = "block";
    dashboard.style.display = "none";
    return;
  }

  login.style.display = "none";
  dashboard.style.display = "block";

  try {
    await loadLocations();
  } catch (e) {
    console.error(e);
    countEl.textContent = "Unable to load locations. Check your Firestore rules.";
  }
});
