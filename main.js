import { setupScene } from "./util/setupScene.js";
import { setupInteractions } from "./interactions.js";
import { updateMatrixCubes } from "./util/updateMatrixCubes.js";

// === Constants ===
const CONFIG = {
  BACKGROUND_COLOR: "white",
  CUBE_OUTLINE_COLOR: "black",
  CUBE_COLOR: "white",
  CUBE_EDGE_WIDTH: 2,
  CUBE_SPACING: 4,
  MATRIX_SPACING: 15,
  FOV: 75,
  NEAR: 0.1,
  FAR: 1000,
  CAMERA_Z: 50,
  VIEW_HEIGHT: 65,
  ROTATION_BREAKPOINT: 600, // px
};

// === Shared State ===
const state = {
  isDragging: false,
  previousMousePosition: { x: 0, y: 0 },
  velocityX: 0,
  velocityY: 0,
  idle: false,
  hoveredMatrix: null,
  rotated: true, // start in rotated (45°) orientation
};

// === Setup ===
const { scene, camera, renderer, matricesGroup } = setupScene(CONFIG);
setupInteractions(state, camera, matricesGroup, renderer);

// === Rotation logic ===
function updateMatrixRotation() {
  const shouldBeUnrotated = window.innerWidth < CONFIG.ROTATION_BREAKPOINT;

  if (shouldBeUnrotated && state.rotated) {
    matricesGroup.userData.targetRotationZ = 0;
    state.rotated = false;
  } else if (!shouldBeUnrotated && !state.rotated) {
    matricesGroup.userData.targetRotationZ = -Math.PI / 4;
    state.rotated = true;
  }
}
window.addEventListener("resize", updateMatrixRotation);
updateMatrixRotation(); // run once on startup

// === Animation Loop ===
function animate() {
  applyInertia(state, matricesGroup);

  // Smooth Z rotation animation
  const targetZ = matricesGroup.userData.targetRotationZ ?? -Math.PI / 4;
  matricesGroup.rotation.z += (targetZ - matricesGroup.rotation.z) * 0.1;

  // Return to upright orientation on X/Y
  matricesGroup.rotation.x += (0 - matricesGroup.rotation.x) * 0.02;
  matricesGroup.rotation.y += (0 - matricesGroup.rotation.y) * 0.02;

  updateMatrixCubes(state, matricesGroup, camera);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

function applyInertia(state, group) {
  const FRICTION = 0.98;

  if (!state.isDragging && !state.idle) {
    if (Math.abs(state.velocityX) > 0.0001) {
      group.rotation.x += state.velocityX;
      state.velocityX *= FRICTION;
    } else {
      state.velocityX = 0;
    }

    if (Math.abs(state.velocityY) > 0.0001) {
      group.rotation.y += state.velocityY;
      state.velocityY *= FRICTION;
    } else {
      state.velocityY = 0;
    }
  }
}
