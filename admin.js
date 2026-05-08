import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");

const slugInput = document.getElementById("slugInput");
const titleInput = document.getElementById("titleInput");
const itemsInput = document.getElementById("itemsInput");
const loadBtn = document.getElementById("loadBtn");
const saveBtn = document.getElementById("saveBtn");
const logoutBtn = document.getElementById("logoutBtn");
const publicLink = document.getElementById("publicLink");

let currentUser = null;

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Enter your email and password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert("Login failed: " + error.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (user) {
    console.log("Your UID is:", user.uid);
    loginSection.style.display = "none";
    adminSection.style.display = "block";
  } else {
    loginSection.style.display = "block";
    adminSection.style.display = "none";
  }
});

loadBtn.addEventListener("click", async () => {
  const slug = slugInput.value.trim();

  if (!slug) {
    alert("Please type a slug first.");
    return;
  }

  try {
    const ref = doc(db, "wheels", slug);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      titleInput.value = data.title || "";
      itemsInput.value = (data.items || []).join("\n");
    } else {
      titleInput.value = "";
      itemsInput.value = "";
      alert("No wheel found. Saving will create a new one.");
    }

    updatePublicLink(slug);
  } catch (error) {
    alert("Could not load wheel: " + error.message);
  }
});

saveBtn.addEventListener("click", async () => {
  if (!currentUser) {
    alert("You must log in first.");
    return;
  }

  const slug = slugInput.value.trim();
  const title = titleInput.value.trim();
  const items = itemsInput.value
    .split("\n")
    .map(item => item.trim())
    .filter(item => item);

  if (!slug) {
    alert("Please type a slug.");
    return;
  }

  if (items.length === 0) {
    alert("Please enter at least one wheel item.");
    return;
  }

  try {
    await setDoc(doc(db, "wheels", slug), {
      title,
      items,
      ownerUid: currentUser.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });

    updatePublicLink(slug);
    alert("Wheel saved successfully.");
  } catch (error) {
    alert("Could not save wheel: " + error.message);
  }
});

function updatePublicLink(slug) {
  const publicUrl = `${window.location.origin}/spin-the-wheel/wheel.html?slug=${encodeURIComponent(slug)}`;
  publicLink.textContent = publicUrl;
}
