import * as THREE from "three";

export function setupInteractions(state, camera, matricesGroup, renderer) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const customCursor = document.createElement("div");
  customCursor.id = "customCursor";
  document.body.appendChild(customCursor);

  window.addEventListener("mousemove", (event) => {
    customCursor.style.left = `${event.clientX}px`;
    customCursor.style.top = `${event.clientY}px`;

    state.idle = false;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    state.hoveredMatrix = null;

    // hovering on 3d matrix
    for (const matrix of matricesGroup.children) {
      const target = matrix.userData.raycastTarget;
      if (target && raycaster.intersectObject(target, false).length > 0) {
        state.hoveredMatrix = matrix;
        break;
      }
    }

    // spinning 3x3 grid
    if (state.isDragging) {
      const deltaX = event.clientX - state.previousMousePosition.x;
      const deltaY = event.clientY - state.previousMousePosition.y;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const rotY = deltaX * 0.005;
        matricesGroup.rotation.y += rotY;
        state.velocityY = rotY;
        state.velocityX = 0;
      } else {
        const rotX = deltaY * 0.005;
        matricesGroup.rotation.x += rotX;
        state.velocityX = rotX;
        state.velocityY = 0;
      }

      state.previousMousePosition = { x: event.clientX, y: event.clientY };
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
}
