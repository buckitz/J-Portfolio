// models.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const texLoader = new THREE.TextureLoader();

let currentModel = null;

/**
 * Utility: apply texture to meshes
 */
function applyTexture(model, meshNames, texturePath) {
    const tex = texLoader.load(texturePath, (t) => {
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

/**
 * Loads a GLTF model and adds it to the scene
 */
export function loadModel(scene, path, onLoaded) {
    loader.load(
        path,
        (gltf) => {
            if (currentModel) {
                scene.remove(currentModel);
            }

            currentModel = gltf.scene;

            // Apply textures depending on model
            if (path.includes("phone")) {
                //  Phone textures
                applyTexture(currentModel, ["phone"], "/model/textures/phone-texture.png");
                applyTexture(currentModel, ["home-button"], "/model/textures/middle-button-texture.png");
                applyTexture(currentModel, ["switch-button"], "/model/textures/phone-button-texture.png");

                // Scale / position for phone
                currentModel.scale.set(1.0, 1.0, 1.0);
                currentModel.position.set(0, -0.3, 0);

            } else {
                //  Computer-specific textures
                applyTexture(currentModel, ["mouse", "desktop", "keyboard", "computer"], "/model/textures/computer-texture.001.png");
                applyTexture(currentModel, ["table"], "/model/textures/table-texture.png");
                applyTexture(currentModel, ["home-button", 'switch-button'], "/model/textures/button-texture.png");

                // Scale / position for computer
                currentModel.scale.set(1, 1, 1);
                currentModel.position.set(0, -0.5, 0);
            }

            scene.add(currentModel);
            if (onLoaded) onLoaded(currentModel);
        },
        undefined,
        (err) => console.error("Error loading model:", err)
    );
}
