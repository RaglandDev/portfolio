import * as THREE from "three";
import { fadeOverlayIn, fadeOverlayOut } from "./util/fade.js";
import { pages, isMobile } from "./main.js";
import { hidePagesAndShowThreeJS } from "./util/fade.js";

export function setupInteractions(
  state,
  camera,
  matricesGroup,
  renderer,
  onHoverChange
) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const customCursor = document.createElement("div");
  customCursor.id = "customCursor";
  document.body.appendChild(customCursor);

  // === Utility Functions ===

  function normalizeMouseEvent(x, y) {
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
  }

  function getIntersectedMatrix() {
    raycaster.setFromCamera(mouse, camera);
    for (const matrix of matricesGroup.children) {
      const target = matrix.userData.raycastTarget;
      if (target && raycaster.intersectObject(target, false).length > 0) {
        return matrix;
      }
    }
    return null;
  }

  function navigateToMatrixPage(matrix) {
    const centerCube = matrix.children.find((c) => c.userData?.isCenter);
    const pageId = centerCube?.userData?.pageId;
    if (!pageId) return;

    const fadeOverlay = document.getElementById("fadeOverlay");
    const threejsContainer = document.getElementById("threejs-container");
    const targetPage = document.getElementById(pageId);

    fadeOverlay.style.pointerEvents = "auto";
    fadeOverlay.style.opacity = "1";

    fadeOverlay.addEventListener(
      "transitionend",
      () => {
        threejsContainer.style.display = "none";
        targetPage.classList.add("visible");
        fadeOverlay.style.opacity = "0";
        fadeOverlay.style.pointerEvents = "none";
      },
      { once: true }
    );
  }

  function updateHoverMatrix(x, y) {
    normalizeMouseEvent(x, y);
    raycaster.setFromCamera(mouse, camera);

    const prevHovered = state.hoveredMatrix;
    state.hoveredMatrix = getIntersectedMatrix();

    if (onHoverChange && prevHovered !== state.hoveredMatrix) {
      onHoverChange(state.hoveredMatrix);
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

      if (Math.abs(dx) > Math.abs(dy)) {
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
      const touch = e.touches[0];
      state.isDragging = true;
      state.previousMousePosition = { x: touch.clientX, y: touch.clientY };
      state.velocityX = 0;
      state.velocityY = 0;
    }
  });

  window.addEventListener("touchmove", (e) => {
    if (!state.isDragging || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const dx = touch.clientX - state.previousMousePosition.x;
    const dy = touch.clientY - state.previousMousePosition.y;

    if (Math.abs(dx) > Math.abs(dy)) {
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

    state.previousMousePosition = { x: touch.clientX, y: touch.clientY };
    updateHoverMatrix(touch.clientX, touch.clientY);
    state.idle = false;
  });

  window.addEventListener("touchend", () => {
    state.isDragging = false;
  });

  window.addEventListener("touchcancel", () => {
    state.isDragging = false;
  });

  // === Add this inside setupInteractions ===
  renderer.domElement.addEventListener("click", (event) => {
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

      const hoverDuration = now - state.hoverStartTime;
      if (hoverDuration >= state.hoverThresholdMs) {
        const pageId = centerCube.userData.pageId;
        if (pageId) {
          const fadeOverlay = document.getElementById("fadeOverlay");
          const pages = Array.from(document.querySelectorAll(".page"));
          const container = document.getElementById("threejs-container");

          fadeOverlayIn(fadeOverlay).then(() => {
            container.style.display = "none";
            pages.forEach((p) => p.classList.remove("visible"));
            const page = document.getElementById(pageId);
            if (page) page.classList.add("visible");
            document.body.classList.add("page-visible");
            fadeOverlayOut(fadeOverlay);
          });

          state.hoveredCenterCube = null;
          state.hoverStartTime = 0;
        }
      }
    } else {
      // Mobile raycast
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const centerMeshes = [];
      matricesGroup.children.forEach((matrix) => {
        const centerCube = matrix.children.find((c) => c.userData?.isCenter);
        if (centerCube) {
          const mesh = centerCube.children.find((c) => c instanceof THREE.Mesh);
          if (mesh) centerMeshes.push(mesh);
        }
      });

      const intersects = raycaster.intersectObjects(centerMeshes, false);
      if (intersects.length > 0) {
        const mesh = intersects[0].object;
        const centerCube = mesh.parent;
        const pageId = centerCube.userData.pageId;

        if (pageId) {
          const fadeOverlay = document.getElementById("fadeOverlay");
          const pages = Array.from(document.querySelectorAll(".page"));
          const container = document.getElementById("threejs-container");

          fadeOverlayIn(fadeOverlay).then(() => {
            container.style.display = "none";
            pages.forEach((p) => p.classList.remove("visible"));
            const page = document.getElementById(pageId);
            if (page) page.classList.add("visible");
            document.body.classList.add("page-visible");
            fadeOverlayOut(fadeOverlay);
          });
        }
      }
    }
  });
}

export function setupBackButtons() {
  pages.forEach((page) => {
    const backBtn = page.querySelector(".back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", hidePagesAndShowThreeJS);
    }
  });
}
