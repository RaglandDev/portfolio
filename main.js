import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { setupScene } from "./util/setupScene.js";
import { setupInteractions, setupBackButtons } from "./interactions.js";
import {
  updateMatrixCubes,
  updateMatrixRotation,
  scaleCenterCubes,
} from "./util/updateMatrixCubes.js";
import { hideAllPages } from "./util/fade.js";

// === Configuration ===
const CONFIG = {
  PAGE_LABELS: [
    ["null", 58],
    ["null", 58],
    ["null", 58],
    ["null", 58],
    ["projects", 58],
    ["null", 58],
    ["null", 58],
    ["null", 58],
    ["null", 58],
  ],
  BACKGROUND_COLOR: "white",
  CUBE_OUTLINE_COLOR: "black",
  CUBE_COLOR: "white",
  CUBE_EDGE_WIDTH: 2,
  CUBE_SPACING: 4.5,
  MATRIX_SPACING: 15,
  FOV: 75,
  NEAR: 0.1,
  FAR: 1000,
  CAMERA_Z: 50,
  MOBILE_BREAKPOINT: 600,
  CENTER_SCALE_MOBILE: 10,
  CENTER_SCALE_NORMAL: 1,
  SCALE_LERP_SPEED: 0.1,
};

// === Global State ===
export const state = {
  isDragging: false,
  previousMousePosition: { x: 0, y: 0 },
  velocityX: 0,
  velocityY: 0,
  idle: false,
  hoveredMatrix: null,
  hoveredCenterCube: null,
  hoverStartTime: 0,
  hoverThresholdMs: 250,
  rotated: true,
};

// === Utility ===
export function isMobile() {
  return window.innerWidth < CONFIG.MOBILE_BREAKPOINT;
}

// === Scene Initialization ===
const { scene, camera, renderer, matricesGroup } = setupScene(CONFIG);
document.getElementById("threejs-container").appendChild(renderer.domElement);

export const pages = Array.from(document.querySelectorAll(".page"));
init();

function init() {
  hideAllPages();
  assignPageIdsToCenterCubes();
  setupBackButtons();

  setupInteractions(state, camera, matricesGroup, renderer, () => {
    if (isMobile()) state.hoveredMatrix = null;
  });

  updateMatrixRotation(matricesGroup, state);
  window.addEventListener("resize", () =>
    updateMatrixRotation(matricesGroup, state)
  );
}

// === Assign Page IDs and Click Tracking ===
function assignPageIdsToCenterCubes() {
  matricesGroup.children.forEach((matrix, i) => {
    const centerCube = matrix.children.find((c) => c.userData?.isCenter);
    if (centerCube) {
      centerCube.userData.pageId = `page${i + 1}`;
      centerCube.userData.clicks = 0;
    }
  });
}

// === Hover Tracking ===
function updateHoverState() {
  const matrix = state.hoveredMatrix;
  const centerCube = matrix?.children.find((c) => c.userData?.isCenter);

  if (centerCube && state.hoveredCenterCube !== centerCube) {
    state.hoveredCenterCube = centerCube;
    state.hoverStartTime = performance.now();
  } else if (!centerCube) {
    state.hoveredCenterCube = null;
    state.hoverStartTime = 0;
  }
}

// === Inertia for Rotation ===
function applyInertia() {
  const FRICTION = 0.98;

  if (!state.isDragging && !state.idle) {
    ["velocityX", "velocityY"].forEach((axis) => {
      if (Math.abs(state[axis]) > 0.0001) {
        const rotAxis = axis === "velocityX" ? "x" : "y";
        matricesGroup.rotation[rotAxis] += state[axis];
        state[axis] *= FRICTION;
      } else {
        state[axis] = 0;
      }
    });
  }
}

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);

  const isOnMobile = isMobile();

  applyInertia();
  easeRotation();
  updateMatrixCubes(state, matricesGroup, camera, isOnMobile);
  scaleCenterCubes(CONFIG, matricesGroup, isOnMobile, camera);
  updateHoverState();

  renderer.render(scene, camera);
}
animate();

// === Helpers ===
function easeRotation() {
  // Z Rotation
  const targetZ = matricesGroup.userData.targetRotationZ ?? -Math.PI / 4;
  matricesGroup.rotation.z += (targetZ - matricesGroup.rotation.z) * 0.1;

  // Neutralize X and Y
  matricesGroup.rotation.x += (0 - matricesGroup.rotation.x) * 0.02;
  matricesGroup.rotation.y += (0 - matricesGroup.rotation.y) * 0.02;
}
