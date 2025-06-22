import * as THREE from "three";
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
  MOBILE_BREAKPOINT: 600, // px
  CENTER_SCALE_MOBILE: 3,
  CENTER_SCALE_NORMAL: 1,
  SCALE_LERP_SPEED: 0.1,
};

// === Shared State ===
const state = {
  isDragging: false,
  previousMousePosition: { x: 0, y: 0 },
  velocityX: 0,
  velocityY: 0,
  idle: false,
  hoveredMatrix: null,
  rotated: true, // start rotated 45°
};

// === Setup scene and renderer ===
const { scene, camera, renderer, matricesGroup } = setupScene(CONFIG);

// Append renderer to container div instead of body
const threejsContainer = document.getElementById("threejs-container");
threejsContainer.appendChild(renderer.domElement);

// === Assign page IDs to each matrix's center cube ===
matricesGroup.children.forEach((matrix, index) => {
  const centerCube = matrix.children.find((child) => child.userData?.isCenter);
  if (centerCube) {
    centerCube.userData.pageId = `page${index + 1}`; // page1, page2, ...
  }
});

// === Fade and page elements ===
const fadeOverlay = document.getElementById("fadeOverlay");
const pages = Array.from(document.querySelectorAll(".page"));

// Initially show Three.js container, hide pages
threejsContainer.style.display = "block";
pages.forEach((p) => p.classList.remove("visible"));

// --- Fade helpers ---
// Helper to fade overlay in/out (returns Promise)
function fadeOverlayIn() {
  return new Promise((resolve) => {
    fadeOverlay.style.opacity = "1";
    fadeOverlay.style.pointerEvents = "auto";
    fadeOverlay.addEventListener("transitionend", resolve, { once: true });
  });
}

function fadeOverlayOut() {
  return new Promise((resolve) => {
    fadeOverlay.style.opacity = "0";
    fadeOverlay.style.pointerEvents = "none";
    fadeOverlay.addEventListener("transitionend", resolve, { once: true });
  });
}

async function showPage(pageId) {
  await fadeOverlayIn();

  threejsContainer.style.display = "none";
  pages.forEach((p) => p.classList.remove("visible"));
  const page = document.getElementById(pageId);
  if (page) page.classList.add("visible");

  // Show normal cursor on pages, hide custom
  document.body.classList.add("page-visible");

  await fadeOverlayOut();
}

async function hidePagesAndShowThreeJS() {
  fadeOverlay.classList.add("fast-fade");
  await fadeOverlayIn();

  pages.forEach((p) => p.classList.remove("visible"));
  threejsContainer.style.display = "block";

  await fadeOverlayOut();
  fadeOverlay.classList.remove("fast-fade");
}

// Back button event setup
pages.forEach((page) => {
  const backBtn = page.querySelector(".back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      hidePagesAndShowThreeJS();
    });
  }
});

// === Setup interactions with hover callback ===
setupInteractions(state, camera, matricesGroup, renderer, () => {
  if (window.innerWidth < CONFIG.MOBILE_BREAKPOINT) {
    state.hoveredMatrix = null;
  }
});

// === Rotation logic ===
function updateMatrixRotation() {
  const shouldBeUnrotated = window.innerWidth < CONFIG.MOBILE_BREAKPOINT;

  if (shouldBeUnrotated && state.rotated) {
    matricesGroup.userData.targetRotationZ = 0;
    state.rotated = false;
  } else if (!shouldBeUnrotated && !state.rotated) {
    matricesGroup.userData.targetRotationZ = -Math.PI / 4;
    state.rotated = true;
  }
}
window.addEventListener("resize", updateMatrixRotation);
updateMatrixRotation(); // initial run

// === Animation loop ===
function animate() {
  const isMobile = window.innerWidth < CONFIG.MOBILE_BREAKPOINT;

  applyInertia(state, matricesGroup);

  const targetZ = matricesGroup.userData.targetRotationZ ?? -Math.PI / 4;
  matricesGroup.rotation.z += (targetZ - matricesGroup.rotation.z) * 0.1;

  matricesGroup.rotation.x += (0 - matricesGroup.rotation.x) * 0.02;
  matricesGroup.rotation.y += (0 - matricesGroup.rotation.y) * 0.02;

  updateMatrixCubes(state, matricesGroup, camera, isMobile);

  // Scale center red cubes on mobile view
  matricesGroup.children.forEach((matrix) => {
    matrix.children.forEach((cubeGroup) => {
      if (!cubeGroup.userData.isCenter) return;

      const mesh = cubeGroup.children.find(
        (child) => child instanceof THREE.Mesh
      );
      if (!mesh) return;

      const isRedCube = mesh.material.color.equals(new THREE.Color("red"));
      const targetScale =
        isMobile && isRedCube
          ? CONFIG.CENTER_SCALE_MOBILE
          : CONFIG.CENTER_SCALE_NORMAL;

      cubeGroup.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        CONFIG.SCALE_LERP_SPEED
      );
    });
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// === Helper: inertia for rotation ===
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

// === Click listener for showing pages ===
renderer.domElement.addEventListener("click", () => {
  if (!state.hoveredMatrix) return;

  const centerCube = state.hoveredMatrix.children.find(
    (child) => child.userData?.isCenter
  );

  const pageId = centerCube?.userData?.pageId;
  if (!pageId) return;

  showPage(pageId);
});
