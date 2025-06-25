import * as THREE from "three";
import {
  fadeOverlayIn,
  fadeOverlayOut,
  hidePagesAndShowThreeJS,
} from "./util/fade.js";
import { pages, isMobile } from "./main.js";

export function setupInteractions(
  state,
  camera,
  matricesGroup,
  renderer,
  onHoverChange
) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // === Setup custom cursor ===
  const customCursor = document.createElement("div");
  customCursor.id = "customCursor";
  document.body.appendChild(customCursor);

  // === Mouse Position Normalization ===
  function normalizeMouse(x, y) {
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
  }

  // === Matrix Hover Detection ===
  function getHoveredMatrix() {
    raycaster.setFromCamera(mouse, camera);
    return matricesGroup.children.find(
      (matrix) =>
        raycaster.intersectObject(matrix.userData.raycastTarget, false).length >
        0
    );
  }

  function updateHoverMatrix(x, y) {
    normalizeMouse(x, y);
    const previous = state.hoveredMatrix;
    state.hoveredMatrix = getHoveredMatrix();
    if (onHoverChange && previous !== state.hoveredMatrix) {
      onHoverChange(state.hoveredMatrix);
    }
  }

  // === Shared Page Navigation Handler ===
  function navigateToPage(pageId) {
    const fadeOverlay = document.getElementById("fadeOverlay");
    const container = document.getElementById("threejs-container");
    const targetPage = document.getElementById(pageId);
    const allPages = Array.from(document.querySelectorAll(".page"));

    fadeOverlayIn(fadeOverlay).then(() => {
      container.style.display = "none";
      allPages.forEach((p) => p.classList.remove("visible"));
      if (targetPage) targetPage.classList.add("visible");
      document.body.classList.add("page-visible");
      fadeOverlayOut(fadeOverlay);
    });
  }

  // === Click Handler ===
  function handleClick(event) {
    if (!isMobile()) {
      const matrix = state.hoveredMatrix;
      if (!matrix) return;

      const centerCube = matrix.children.find((c) => c.userData?.isCenter);
      if (!centerCube) return;

      const now = performance.now();
      if (state.hoveredCenterCube !== centerCube) {
        state.hoveredCenterCube = centerCube;
        state.hoverStartTime = now;
        return;
      }

      const duration = now - state.hoverStartTime;
      if (duration >= state.hoverThresholdMs) {
        navigateToPage(centerCube.userData.pageId);
        state.hoveredCenterCube = null;
        state.hoverStartTime = 0;
      }
    } else {
      handleMobileRaycast(event);
    }
  }

  function handleMobileRaycast(event) {
    normalizeMouse(event.clientX, event.clientY);
    raycaster.setFromCamera(mouse, camera);

    const centerMeshes = matricesGroup.children.flatMap((matrix) => {
      const centerCube = matrix.children.find((c) => c.userData?.isCenter);
      return centerCube?.children.find((c) => c instanceof THREE.Mesh) || [];
    });

    const intersects = raycaster.intersectObjects(centerMeshes, false);
    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      const centerCube = mesh.parent;
      navigateToPage(centerCube.userData.pageId);
    }
  }

  // === Mouse Events ===
  window.addEventListener("mousemove", (e) => {
    customCursor.style.left = `${e.clientX}px`;
    customCursor.style.top = `${e.clientY}px`;

    state.idle = false;
    updateHoverMatrix(e.clientX, e.clientY);

    if (state.isDragging) {
      const dx = e.clientX - state.previousMousePosition.x;
      const dy = e.clientY - state.previousMousePosition.y;
      const dominant = Math.abs(dx) > Math.abs(dy);

      if (dominant) {
        const rotY = dx * 0.005;
        matricesGroup.rotation.y += rotY;
        state.velocityY = rotY;
        state.velocityX = 0;
      } else {
        const rotX = dy * 0.005;
        matricesGroup.rotation.x += rotX;
        state.velocityX = rotX;
        state.velocityY = 0;
      }

      state.previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  window.addEventListener("mousedown", (e) => {
    state.isDragging = true;
    state.previousMousePosition = { x: e.clientX, y: e.clientY };
    state.velocityX = 0;
    state.velocityY = 0;
  });

  window.addEventListener("mouseup", () => {
    state.isDragging = false;
  });

  window.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) state.idle = true;
  });

  renderer.domElement.addEventListener("mouseenter", () => {
    state.idle = false;
  });

  // === Touch Events ===
  window.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      const { clientX, clientY } = e.touches[0];
      state.isDragging = true;
      state.previousMousePosition = { x: clientX, y: clientY };
      state.velocityX = 0;
      state.velocityY = 0;
    }
  });

  window.addEventListener("touchmove", (e) => {
    if (!state.isDragging || e.touches.length !== 1) return;

    const { clientX, clientY } = e.touches[0];
    const dx = clientX - state.previousMousePosition.x;
    const dy = clientY - state.previousMousePosition.y;

    const dominant = Math.abs(dx) > Math.abs(dy);
    if (dominant) {
      const rotY = dx * 0.005;
      matricesGroup.rotation.y += rotY;
      state.velocityY = rotY;
      state.velocityX = 0;
    } else {
      const rotX = dy * 0.005;
      matricesGroup.rotation.x += rotX;
      state.velocityX = rotX;
      state.velocityY = 0;
    }

    state.previousMousePosition = { x: clientX, y: clientY };
    updateHoverMatrix(clientX, clientY);
    state.idle = false;
  });

  window.addEventListener("touchend", () => {
    state.isDragging = false;
  });

  window.addEventListener("touchcancel", () => {
    state.isDragging = false;
  });

  // === Click Navigation ===
  renderer.domElement.addEventListener("click", handleClick);
}

export function setupBackButtons() {
  pages.forEach((page) => {
    const backBtn = page.querySelector(".back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", hidePagesAndShowThreeJS);
    }
  });
}
