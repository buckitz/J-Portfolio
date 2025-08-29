
// main.js
import "./style.scss";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS3DRenderer, CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { loadModel } from "./models.js";
import * as TWEEN from "@tweenjs/tween.js";

let orbitEnabled = false;
const defaultCameraPos = new THREE.Vector3(0, 1, 3.25); // change based on breakpoint
const defaultTarget = new THREE.Vector3(0, 0, 0);       // where camera should look

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const container = document.querySelector(".computer");
const canvas = document.querySelector("#computer-canvas");

let scene, camera, renderer, cssRenderer, controls;
let currentCssObject = null;
let currentModelPath = null;
let switchButton = null;
let homeButton = null;

initScene();

function initScene() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);
  // Click listener
  window.addEventListener("click", onClick);

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 1, 3.25);

  // Renderers
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(container.clientWidth, container.clientHeight);
  cssRenderer.domElement.classList.add("css3d-container");
  container.appendChild(cssRenderer.domElement);

  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;


  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.copy(camera.position);


  // Lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2)); // slightly stronger ambient
  const dirLight = new THREE.DirectionalLight(0xffffff, 3); // brighter key light
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xfff5f0, 1.5);
  fillLight.position.set(-5, 5, 5);
  scene.add(fillLight);

  // Initial load
  checkBreakpoint();

  // Resize
  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    cssRenderer.setSize(container.clientWidth, container.clientHeight);

    // Re-check model on resize
    checkBreakpoint();
  });

  // Animate
  function animate(time) {
    requestAnimationFrame(animate);
    controls.update();
    checkHover();
    TWEEN.update(time || performance.now()); // pass in timestamp
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
  }

  animate();
}

// Set up Breakpoints

function checkBreakpoint() {
  if (window.innerWidth < 954) {
    // Phone
    if (currentModelPath !== "/model/phone-model.glb") {
      loadNewModel("/model/phone-model.glb", "screen", "/html/screen.html", { w: 720, h: 1280 });
    }

    camera.position.set(0, 2.5, 5.2); // Phone camera
    controls.target.copy(camera.position);

  } else {
    // Computer
    if (currentModelPath !== "/model/final-computer-model.gltf") {
      loadNewModel("/model/final-computer-model.gltf", "screen", "/html/screen.html", { w: 1280, h: 1024 });
    }

    if (window.innerWidth < 1300) {
      camera.position.set(0, 1, 4);
    } else if (window.innerWidth < 2030) {
      camera.position.set(0, 1, 3.25);
    } else {
      camera.position.set(0, 1, 3);
    }

    controls.target.copy(camera.position);;
  }
}


function resetToDefaultView() {
  if (window.innerWidth < 954) {
    // Phone defaults
    camera.position.set(0, 2.5, 5.2);
    controls.target.copy(camera.position);
  } else {
    // Computer defaults
    if (window.innerWidth < 1300) {
      camera.position.set(0, 1, 4);
    } else if (window.innerWidth < 2030) {
      camera.position.set(0, 1, 3.25);
    } else {
      camera.position.set(0, 1, 3);
    }
    controls.target.copy(camera.position);
  }

  controls.update();
}

// model & iframe

function loadNewModel(path, screenMeshName, iframeSrc, SCREEN_SIZE) {
  currentModelPath = path;

  // Remove old iframe
  if (currentCssObject) {
    scene.remove(currentCssObject);
    currentCssObject = null;
  }

  loadModel(scene, path, (model) => {
    switchButton = model.getObjectByName("switch-button") || null;
    homeButton = model.getObjectByName("home-button") || null;

    const screenMesh = model.getObjectByName(screenMeshName);
    if (screenMesh) {
      screenMesh.updateWorldMatrix(true, false);

      const box = new THREE.Box3().setFromObject(screenMesh);
      const size = new THREE.Vector3();
      box.getSize(size);

      const scaleX = SCREEN_SIZE.w / size.x;
      const scaleY = SCREEN_SIZE.h / size.y;
      const scaleFactor = Math.min(scaleX, scaleY);

      const iframe = document.createElement("iframe");
      iframe.src = iframeSrc;
      iframe.style.width = `${SCREEN_SIZE.w}px`;
      iframe.style.height = `${SCREEN_SIZE.h}px`;
      iframe.style.border = "none";

      const cssObject = new CSS3DObject(iframe);
      cssObject.position.copy(box.getCenter(new THREE.Vector3()));
      const rotation = new THREE.Euler().setFromRotationMatrix(screenMesh.matrixWorld);
      cssObject.rotation.copy(rotation);
      cssObject.scale.set(1 / scaleFactor, 1 / scaleFactor, 1 / scaleFactor);

      // Fix rotation only for phone model
      if (path.includes("phone-model")) {
        const fix = new THREE.Quaternion();
        fix.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2); // 90° Z correction
        cssObject.quaternion.multiply(fix);
      }

      scene.add(cssObject);
      currentCssObject = cssObject;

    }
  });
}

function onClick(event) {
  if (!switchButton && !homeButton) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const clickable = [];
  if (switchButton) clickable.push(switchButton);
  if (homeButton) clickable.push(homeButton);

  const intersects = raycaster.intersectObjects(clickable, true);

  if (intersects.length > 0) {
    const btn = intersects[0].object;

    if (btn === switchButton) {
      // Animate the button press
      new TWEEN.Tween(btn.scale)
        .to({ x: 0.7, y: 0.7, z: 0.7 }, 200)
        .yoyo(true)
        .repeat(1)
        .start();

      // ✅ Toggle orbit controls
      orbitEnabled = !orbitEnabled;
      controls.enabled = orbitEnabled;

      if (orbitEnabled) {
        // Orbit mode ON → focus on model
        controls.target.set(0, 0, 0);
        controls.update();
      } else {
        // Orbit mode OFF → restore defaults based on breakpoint
        resetToDefaultView();
      }

      console.log("Switch button clicked! Orbit:", orbitEnabled);
    }

    if (btn === homeButton) {
      console.log("Home button clicked!");
      if (currentCssObject && currentCssObject.element) {
        currentCssObject.element.src = "/html/screen.html";
      }
    }
  }
}

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

function checkHover() {
  if (!switchButton && !homeButton) return;

  raycaster.setFromCamera(mouse, camera);

  const clickable = [];
  if (switchButton) clickable.push(switchButton);
  if (homeButton) clickable.push(homeButton);

  const intersects = raycaster.intersectObjects(clickable, true);

  if (intersects.length > 0) {
    document.body.style.cursor = "pointer"; // 🔥 Show pointer
  } else {
    document.body.style.cursor = "default"; // Reset
  }
}

