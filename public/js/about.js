import * as THREE from "https://esm.sh/three@0.165.0";
import { OrbitControls } from "https://esm.sh/three@0.165.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://esm.sh/three@0.165.0/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "https://esm.sh/three@0.165.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three@0.165.0/examples/jsm/postprocessing/RenderPass.js";

const canvas = document.querySelector("#my-model-canvas");

// Scene setup
const scene = new THREE.Scene();
scene.background = null;

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
);
camera.position.set(2, 2, 5);

// Renderer (pixel style)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
renderer.setPixelRatio(1); // don’t adapt to devicePixelRatio
renderer.setSize(canvas.clientWidth / 4, canvas.clientHeight / 4, false); // low res render

// CSS upscale
renderer.domElement.style.width = canvas.clientWidth + "px";
renderer.domElement.style.height = canvas.clientHeight + "px";
renderer.domElement.style.imageRendering = "pixelated";

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;

// --- Postprocessing Setup ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Lights
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xfff5f0, 1.5);
fillLight.position.set(-5, 5, 5);
scene.add(fillLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;



// --- Texture loader + apply function ---
const texLoader = new THREE.TextureLoader();

function applyTexture(model, meshNames, texturePath) {
    texLoader.load(texturePath, (t) => {
        t.flipY = false;
        t.encoding = THREE.sRGBEncoding;
        t.minFilter = THREE.NearestFilter;
        t.magFilter = THREE.NearestFilter;
        t.generateMipmaps = false;

        meshNames.forEach((name) => {
            const mesh = model.getObjectByName(name);
            if (mesh) {
                mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.material.map = t;
                        child.material.needsUpdate = true;
                    }
                });
            }
        });
    });
}

// Loader
const loader = new GLTFLoader();
loader.load(
    '/model/my-model.glb',
    (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // ✅ Apply your textures
        applyTexture(model, ["pants"], "/model/textures/pants-texture.png");
        applyTexture(model, ["hair"], "/model/textures/hair-texture.png");
        applyTexture(model, ["head"], "/model/textures/face-texture.png");
        applyTexture(model, ["body"], "/model/textures/body-texture.png");

        // Center + scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = maxDim / (2 * Math.tan(fov / 2));

        camera.position.set(0, 0, cameraZ * 1.2);
        controls.target.set(0, 0, 0);
        controls.update();
    },
    undefined,
    (error) => console.error("Error loading model:", error)
);

// Animate
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render(); // ✅ use composer instead of renderer
}
animate();
