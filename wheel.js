import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const wheelTitle = document.getElementById("wheelTitle");
const spinBtn = document.getElementById("spinBtn");
const winnerText = document.getElementById("winnerText");
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

let items = [];
let currentRotation = 0;
let spinning = false;

const colors = [
   "#4ade80",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#f87171",
  "#fbbf24",
  "#34d399",
  "#22c55e",
  "#38bdf8"
];

function getSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug");
}

async function loadWheel() {
  const slug = getSlugFromUrl();

  if (!slug) {
    wheelTitle.textContent = "Missing wheel link";
    winnerText.textContent = "No slug was found in the URL.";
    spinBtn.disabled = true;
    return;
  }

  try {
    const ref = doc(db, "wheels", slug);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      wheelTitle.textContent = "Wheel not found";
      winnerText.textContent = "This wheel does not exist.";
      spinBtn.disabled = true;
      return;
    }

    const data = snap.data();
    wheelTitle.textContent = data.title || "Spin the Wheel";
    items = data.items || [];

    if (items.length === 0) {
      winnerText.textContent = "This wheel has no items.";
      spinBtn.disabled = true;
      return;
    }

    drawWheel();
  } catch (error) {
    winnerText.textContent = "Error loading wheel: " + error.message;
    spinBtn.disabled = true;
  }
}

function drawWheel(rotationDeg = 0) {
  const total = items.length;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 220;
  const arcSize = (Math.PI * 2) / total;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((rotationDeg * Math.PI) / 180);

  for (let i = 0; i < total; i++) {
    const startAngle = i * arcSize;
    const endAngle = startAngle + arcSize;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();

    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(startAngle + arcSize / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#111827";
    ctx.font = "bold 18px Arial";
    ctx.fillText(items[i], radius - 20, 8, 180);
    ctx.restore();
  }

  ctx.restore();

  ctx.beginPath();
  ctx.arc(centerX, centerY, 45, 0, Math.PI * 2);
  ctx.fillStyle = "#111827";
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText("SPIN", centerX, centerY + 8);

  drawPointer();
}

function drawPointer() {
  const centerX = canvas.width / 2;
  const topY = 20;

  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.moveTo(centerX, topY);
  ctx.lineTo(centerX - 18, topY + 35);
  ctx.lineTo(centerX + 18, topY + 35);
  ctx.closePath();
  ctx.fill();
}

function getWinnerIndex(finalRotation) {
  const total = items.length;
  const degreesPerSlice = 360 / total;
  const normalizedRotation = ((finalRotation % 360) + 360) % 360;
  const pointerAngle = (360 - normalizedRotation + 270) % 360;
  return Math.floor(pointerAngle / degreesPerSlice) % total;
}

function spinWheel() {
  if (spinning || items.length === 0) return;

  spinning = true;
  winnerText.textContent = "";

  const extraRotation = 1800 + Math.random() * 1800;
  const startRotation = currentRotation;
  const endRotation = currentRotation + extraRotation;
  const duration = 4000;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const rotation = startRotation + (endRotation - startRotation) * easeOut;

     drawWheel(rotation);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      currentRotation = endRotation;
      const winnerIndex = getWinnerIndex(currentRotation);
      winnerText.textContent = "Winner: " + items[winnerIndex];
      spinning = false;
    }
  }

  requestAnimationFrame(animate);
}

spinBtn.addEventListener("click", spinWheel);

loadWheel();
