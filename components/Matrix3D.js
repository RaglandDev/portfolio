import * as THREE from "three";
import { Box } from "./Box.js";

/**
 * Creates a 3x3x3 matrix of cubes centered at the origin.
 * One cube is marked as the center, and one front-center cube is omitted.
 *
 * @param {number} spacing - Distance between cubes.
 * @param {string} edgeColor - Color of cube edges.
 * @param {string} boxColor - Fill color of cubes.
 * @param {number} edgeWidth - Thickness of cube edges.
 * @returns {THREE.Group} Group containing the matrix of cubes and a raycast target.
 */
export function Matrix3D(
  spacing = 4,
  edgeColor = "black",
  boxColor = "white",
  edgeWidth = 2
) {
  const DIM = 3;
  const CENTER = 1;
  const group = new THREE.Group();
  const center = new THREE.Vector3(0, 0, 0);

  for (let x = 0; x < DIM; x++) {
    for (let y = 0; y < DIM; y++) {
      for (let z = 0; z < DIM; z++) {
        // Skip front-center cube
        const isFrontCenter = x === CENTER && y === CENTER && z === 2;
        if (isFrontCenter) continue;

        const position = new THREE.Vector3(
          (x - 1) * spacing,
          (y - 1) * spacing,
          (z - 1) * spacing
        );

        const isCenter = x === CENTER && y === CENTER && z === CENTER;
        const cubeColor = isCenter ? "red" : boxColor;
        const cube = Box(cubeColor, edgeColor, edgeWidth);
        cube.position.copy(position);

        // Animation metadata
        cube.userData.originalPosition = position.clone();
        cube.userData.explodeDirection = position
          .clone()
          .sub(center)
          .normalize();
        cube.userData.isCenter = isCenter;

        if (isCenter) {
          const raycastTarget = createRaycastTarget();
          group.add(raycastTarget);
          group.userData.raycastTarget = raycastTarget;
        }

        group.add(cube);
      }
    }
  }

  return group;
}

// Creates an invisible sphere mesh to use for raycasting hit detection
function createRaycastTarget() {
  const geometry = new THREE.SphereGeometry(6, 8, 8);
  const material = new THREE.MeshBasicMaterial({
    color: "blue",
    transparent: true,
    opacity: 0.0,
    visible: true,
  });

  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(0, -5, 0); // Offset to sit in front of center cube
  return sphere;
}
