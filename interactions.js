import * as THREE from "three";

export function setupInteractions(
  state,
  camera,
  matricesGroup,
  renderer,
  onHoverChange
) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Create and append custom cursor element
  const customCursor = document.createElement("div");
  customCursor.id = "customCursor";
  document.body.appendChild(customCursor);

  // Handle mouse movement for hover detection and rotation drag
  window.addEventListener("mousemove", (event) => {
    // Update custom cursor position
    customCursor.style.left = `${event.clientX}px`;
    customCursor.style.top = `${event.clientY}px`;

    state.idle = false;

    // Normalize mouse coordinates for raycasting
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Track previous hovered matrix to detect changes
    const prevHovered = state.hoveredMatrix;
    state.hoveredMatrix = null;

    // Raycast each matrix's target to detect hover
    for (const matrix of matricesGroup.children) {
      const target = matrix.userData.raycastTarget;
      if (target && raycaster.intersectObject(target, false).length > 0) {
        state.hoveredMatrix = matrix;
        break;
      }
    }

    // Trigger hover change callback if hover state changed
    if (onHoverChange && prevHovered !== state.hoveredMatrix) {
      onHoverChange(state.hoveredMatrix);
    }

    // Handle dragging rotation
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

  // Start dragging on mouse down
  window.addEventListener("mousedown", (event) => {
    state.isDragging = true;
    state.previousMousePosition = { x: event.clientX, y: event.clientY };
    state.velocityX = 0;
    state.velocityY = 0;
  });

  // Stop dragging on mouse up
  window.addEventListener("mouseup", () => {
    state.isDragging = false;
  });

  // Mark idle state when cursor leaves window
  window.addEventListener("mouseout", (event) => {
    if (!event.relatedTarget) {
      state.idle = true;
    }
  });

  // Reset idle state when cursor re-enters renderer
  renderer.domElement.addEventListener("mouseenter", () => {
    state.idle = false;
  });
}
