import * as THREE from "three";
import { setupScene } from "./util/setupScene.js";
import { setupInteractions } from "./interactions.js";
import { updateMatrixCubes } from "./util/updateMatrixCubes.js";
import { fadeOverlayIn, fadeOverlayOut } from "./util/fade.js";

// === Configuration ===
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
  MOBILE_BREAKPOINT: 600,
  CENTER_SCALE_MOBILE: 10,
  CENTER_SCALE_NORMAL: 1,
  SCALE_LERP_SPEED: 0.1,
};

// === Global State ===
const state = {
  isDragging: false,
  previousMousePosition: { x: 0, y: 0 },
  velocityX: 0,
  velocityY: 0,
  idle: false,
  hoveredMatrix: null,
  hoveredCenterCube: null,
  hoverStartTime: 0,
  hoverThresholdMs: 500,
  rotated: true,
};

// === Setup Scene ===
const { scene, camera, renderer, matricesGroup } = setupScene(CONFIG);
document.getElementById("threejs-container").appendChild(renderer.domElement);

// === Page/Fade Elements ===
const fadeOverlay = document.getElementById("fadeOverlay");
const pages = Array.from(document.querySelectorAll(".page"));

// === Initialize State ===
hideAllPages();
assignPageIdsToCenterCubes();
setupBackButtons();
setupInteractions(state, camera, matricesGroup, renderer, () => {
  if (isMobile()) state.hoveredMatrix = null;
});
updateMatrixRotation();
window.addEventListener("resize", updateMatrixRotation);

// === Assign Page IDs and 'clicks' property to Matrix Center Cubes ===
function assignPageIdsToCenterCubes() {
  matricesGroup.children.forEach((matrix, i) => {
    const centerCube = matrix.children.find((c) => c.userData?.isCenter);
    if (centerCube) {
      centerCube.userData.pageId = `page${i + 1}`;
      centerCube.userData.clicks = 0;
    }
  });
}

// === Responsive Helpers ===
function isMobile() {
  return window.innerWidth < CONFIG.MOBILE_BREAKPOINT;
}

function updateMatrixRotation() {
  const target = isMobile() ? 0 : -Math.PI / 4;
  matricesGroup.userData.targetRotationZ = target;
  state.rotated = !isMobile();
}

// === Fade and Page Helpers ===
function hideAllPages() {
  document.getElementById("threejs-container").style.display = "block";
  pages.forEach((p) => p.classList.remove("visible"));
}

async function hidePagesAndShowThreeJS() {
  fadeOverlay.classList.add("fast-fade");
  await fadeOverlayIn(fadeOverlay);

  hideAllPages();
  await fadeOverlayOut(fadeOverlay);

  fadeOverlay.classList.remove("fast-fade");
  document.body.classList.remove("page-visible");
}

// === Back Button Events ===
function setupBackButtons() {
  pages.forEach((page) => {
    const backBtn = page.querySelector(".back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", hidePagesAndShowThreeJS);
    }
  });
}

// === Hover Tracking: Update hoveredCenterCube and hoverStartTime ===
function updateHoverState() {
  const matrix = state.hoveredMatrix;
  if (!matrix) {
    state.hoveredCenterCube = null;
    state.hoverStartTime = 0;
    return;
  }

  const centerCube = matrix.children.find((c) => c.userData?.isCenter);
  if (!centerCube) {
    state.hoveredCenterCube = null;
    state.hoverStartTime = 0;
    return;
  }

  if (state.hoveredCenterCube !== centerCube) {
    state.hoveredCenterCube = centerCube;
    state.hoverStartTime = performance.now();
  }
}

// === Rotation Inertia ===
function applyInertia() {
  const FRICTION = 0.98;

  if (!state.isDragging && !state.idle) {
    if (Math.abs(state.velocityX) > 0.0001) {
      matricesGroup.rotation.x += state.velocityX;
      state.velocityX *= FRICTION;
    } else {
      state.velocityX = 0;
    }

    if (Math.abs(state.velocityY) > 0.0001) {
      matricesGroup.rotation.y += state.velocityY;
      state.velocityY *= FRICTION;
    } else {
      state.velocityY = 0;
    }
  }
}

// === Animate ===
function animate() {
  requestAnimationFrame(animate);

  const isOnMobile = isMobile();
  applyInertia();

  // Smooth Z rotation
  const targetZ = matricesGroup.userData.targetRotationZ ?? -Math.PI / 4;
  matricesGroup.rotation.z += (targetZ - matricesGroup.rotation.z) * 0.1;

  // Ease X/Y rotation to neutral
  matricesGroup.rotation.x += (0 - matricesGroup.rotation.x) * 0.02;
  matricesGroup.rotation.y += (0 - matricesGroup.rotation.y) * 0.02;

  // Cube matrix updates
  updateMatrixCubes(state, matricesGroup, camera, isOnMobile);

  // Scale red center cubes differently for mobile
  matricesGroup.children.forEach((matrix) => {
    matrix.children.forEach((cubeGroup) => {
      if (!cubeGroup.userData.isCenter) return;

      const mesh = cubeGroup.children.find((c) => c instanceof THREE.Mesh);
      if (!mesh) return;

      const isRed = mesh.material.color.equals(new THREE.Color("red"));
      const targetScale =
        isRed && isOnMobile
          ? CONFIG.CENTER_SCALE_MOBILE
          : CONFIG.CENTER_SCALE_NORMAL;

      cubeGroup.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        CONFIG.SCALE_LERP_SPEED
      );
    });
  });

  // Always update hover state per frame
  updateHoverState();

  renderer.render(scene, camera);
}

animate();
