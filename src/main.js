import * as THREE from "three";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// BACKGROUND
let baseHue = 250;
let hueShiftSpeed = 0.03;

function createGradientTexture(hue) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);

  gradient.addColorStop(0, `hsl(${hue}, 100%, 0%)`);
  gradient.addColorStop(0.5, `hsl(${hue + 3}, 100%, 0.7%)`);
  gradient.addColorStop(1, `hsl(${hue + 5}, 100%, 1.5%)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1, 512);

  return new THREE.CanvasTexture(canvas);
}


const STAR_SPREAD = 1000;
let STAR_COUNT = 1500;
let starSpeed = 4;

let starGeometry = new THREE.BufferGeometry();
let starPositions = new Float32Array(STAR_COUNT * 3);

function initStars(count) {
  starPositions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    starPositions[i * 3]     = (Math.random() - 0.5) * STAR_SPREAD;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * STAR_SPREAD;
    starPositions[i * 3 + 2] = Math.random() * -STAR_SPREAD;
  }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
}

initStars(STAR_COUNT);

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 1.5,
  transparent: true,
  opacity: 0.9,
  depthWrite: false,
});

let stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

function rebuildStars(count) {
  scene.remove(stars);
  starGeometry.dispose();
  starGeometry = new THREE.BufferGeometry();
  STAR_COUNT = count;
  initStars(count);
  stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}


const FRAME_COUNT = 5;
const SPACE_OBJ_COUNT = 5;

const spaceObjTexture = new THREE.TextureLoader().load('/public/spaceObjects.png');
spaceObjTexture.colorSpace = THREE.SRGBColorSpace;

const spaceObjects = [];

function spawnSpaceObject(mesh, randomZ = false) {
  const frame = Math.floor(Math.random() * FRAME_COUNT);
  mesh.material.map.offset.set(frame / FRAME_COUNT, 0);

  mesh.position.set(
    (Math.random() - 0.5) * STAR_SPREAD * 0.25,
    (Math.random() - 0.5) * STAR_SPREAD * 0.25,
    randomZ ? Math.random() * -STAR_SPREAD : -STAR_SPREAD * (0.8 + Math.random() * 0.2)
  );

  const size = 3 + Math.random() * 3.5;
  mesh.scale.setScalar(size);

  mesh.userData.rotSpeed = (Math.random() - 0.5) * 0.015;
  mesh.userData.speed    = 0.6 + Math.random() * 1.2;
}

for (let i = 0; i < SPACE_OBJ_COUNT; i++) {
  const tex = spaceObjTexture.clone();
  tex.needsUpdate  = true;
  tex.repeat.set(1 / FRAME_COUNT, 1);
  tex.offset.set(0, 0);

  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.01,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  spawnSpaceObject(mesh, true); 
  scene.add(mesh);
  spaceObjects.push(mesh);
}


const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

const TRACKS = {
  planetarium: "/planetarium.wav",
  atmosphere:  "/atmosphere.wav",
  lullaby:     "/lullaby.wav",
};

let currentTrack = "planetarium";
let currentVolume = 0.5;

function loadAndPlay(trackName) {
  if (sound.isPlaying) sound.stop();

  document.querySelectorAll(".sound-btn").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`[data-track="${trackName}"]`);
  if (btn) btn.classList.add("loading");

  audioLoader.load(TRACKS[trackName], (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(currentVolume);
    sound.play();
    currentTrack = trackName;

    document.querySelectorAll(".sound-btn").forEach(b => b.classList.remove("loading", "active"));
    if (btn) btn.classList.add("active");
  });
}

function loadAndPlayCustom(url, displayName) {
  if (sound.isPlaying) sound.stop();

  document.querySelectorAll(".sound-btn").forEach(b => b.classList.remove("active", "loading"));
  const btn = document.querySelector('[data-track="custom"]');
  if (btn) {
    btn.classList.add("loading");
    const lbl = btn.querySelector(".label");
    if (lbl) lbl.textContent = displayName.toUpperCase().slice(0, 12);
  }

  audioLoader.load(url, (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(currentVolume);
    sound.play();
    currentTrack = "custom";

    document.querySelectorAll(".sound-btn").forEach(b => b.classList.remove("loading", "active"));
    if (btn) btn.classList.add("active");
  });
}

loadAndPlay("planetarium");


const soundControls = document.getElementById("sound-controls");

Object.keys(TRACKS).forEach((trackName) => {
  const btn = document.createElement("button");
  btn.className = "sound-btn";
  btn.dataset.track = trackName;

  const indicator = document.createElement("span");
  indicator.className = "indicator";

  const label = document.createElement("span");
  label.className = "label";
  label.textContent = trackName.toUpperCase();

  btn.appendChild(indicator);
  btn.appendChild(label);

  btn.addEventListener("click", () => {
    if (currentTrack !== trackName || !sound.isPlaying) {
      loadAndPlay(trackName);
    }
  });

  soundControls.appendChild(btn);
});

const customBtn = document.createElement("button");
customBtn.className = "sound-btn sound-btn--custom";
customBtn.dataset.track = "custom";

const customIndicator = document.createElement("span");
customIndicator.className = "indicator";

const customLabel = document.createElement("span");
customLabel.className = "label";
customLabel.textContent = "CUSTOM ↑";

customBtn.appendChild(customIndicator);
customBtn.appendChild(customLabel);

const customFileInput = document.getElementById("custom-audio-input");

customBtn.addEventListener("click", () => {
  customFileInput.click();
});

customFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  const displayName = file.name.replace(/\.[^/.]+$/, ""); 
  loadAndPlayCustom(url, displayName);

  customFileInput.value = "";
});

soundControls.appendChild(customBtn);

document.querySelector('[data-track="planetarium"]')?.classList.add("active");


const volumeSlider  = document.getElementById("volume-slider");
const volumeReadout = document.getElementById("volume-value");

volumeSlider.addEventListener("input", () => {
  currentVolume = parseFloat(volumeSlider.value);
  volumeReadout.textContent = Math.round(currentVolume * 100);
  if (sound.isPlaying) sound.setVolume(currentVolume);
  updateSliderFill(volumeSlider);
});


const hueSlider  = document.getElementById("hue-slider");
const hueReadout = document.getElementById("hue-value");

hueSlider.addEventListener("input", () => {
  hueShiftSpeed = parseFloat(hueSlider.value);
  hueReadout.textContent = (hueShiftSpeed * 100 / 3).toFixed(1);
  updateSliderFill(hueSlider);
});


const starsSlider  = document.getElementById("stars-slider");
const starsReadout = document.getElementById("stars-value");

starsSlider.addEventListener("input", () => {
  const count = parseInt(starsSlider.value, 10);
  starsReadout.textContent = count;
  rebuildStars(count);
  updateSliderFill(starsSlider);
});


const speedSlider  = document.getElementById("speed-slider");
const speedReadout = document.getElementById("speed-value");

speedSlider.addEventListener("input", () => {
  starSpeed = parseFloat(speedSlider.value);
  speedReadout.textContent = starSpeed.toFixed(1);
  updateSliderFill(speedSlider);
});


function updateSliderFill(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.setProperty("--fill-pct", `${pct}%`);
}

updateSliderFill(volumeSlider);
updateSliderFill(hueSlider);
updateSliderFill(starsSlider);
updateSliderFill(speedSlider);


const panelToggle = document.getElementById("panel-toggle");
const panels = document.querySelectorAll(".controls-panel");

panelToggle.addEventListener("click", () => {
  const hiding = !panels[0].classList.contains("hidden");
  panels.forEach(p => p.classList.toggle("hidden", hiding));
  panelToggle.classList.toggle("panels-hidden", hiding);
});


function animate() {
  requestAnimationFrame(animate);

  baseHue += hueShiftSpeed;
  scene.background = createGradientTexture(baseHue);

  const positions = starGeometry.attributes.position.array;

  for (let i = 0; i < STAR_COUNT; i++) {
    const base = i * 3;

    let x = positions[base];
    let y = positions[base + 1];
    let z = positions[base + 2];

    z += starSpeed;

  const depthProgress = 1 - (Math.abs(z) / STAR_SPREAD);
const coneStrength = 2.5; 
x += x * depthProgress * 0.02 * coneStrength;
y += y * depthProgress * 0.02 * coneStrength;

    if (z > camera.position.z) {
      x = (Math.random() - 0.5) * STAR_SPREAD;
      y = (Math.random() - 0.5) * STAR_SPREAD;
      z = -STAR_SPREAD;
    }

    positions[base]     = x;
    positions[base + 1] = y;
    positions[base + 2] = z;
  }

  starGeometry.attributes.position.needsUpdate = true;

  for (const obj of spaceObjects) {
    obj.position.z += obj.userData.speed;
    obj.rotation.z += obj.userData.rotSpeed;

    const depthProgress = 1 - (Math.abs(obj.position.z) / STAR_SPREAD);
    obj.position.x += obj.position.x * depthProgress * 0.005;
    obj.position.y += obj.position.y * depthProgress * 0.005;

    if (obj.position.z > camera.position.z + 5) {
      spawnSpaceObject(obj, false); 
    }
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});