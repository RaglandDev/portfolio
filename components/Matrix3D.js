import * as THREE from "three";
import { Box } from "./Box.js";

/**
 * Creates a 3x3x3 matrix of cubes centered at the origin.
 * One cube is marked as the center, and one front-center cube is intentionally omitted.
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
  const CENTER_INDEX = 1;

  const center = new THREE.Vector3(0, 0, 0);
  const group = new THREE.Group();

  for (let x = 0; x < DIM; x++) {
    for (let y = 0; y < DIM; y++) {
      for (let z = 0; z < DIM; z++) {
        // Skip the front-center cube
        if (x === CENTER_INDEX && y === CENTER_INDEX && z === 2) continue;

        const posX = (x - (DIM - 1) / 2) * spacing;
        const posY = (y - (DIM - 1) / 2) * spacing;
        const posZ = (z - (DIM - 1) / 2) * spacing;

        const isCenter =
          x === CENTER_INDEX && y === CENTER_INDEX && z === CENTER_INDEX;
        const cubeColor = isCenter ? "red" : boxColor;

        const cube = Box(cubeColor, edgeColor, edgeWidth);
        cube.position.set(posX, posY, posZ);

        // Store metadata for animation
        cube.userData.originalPosition = cube.position.clone();
        cube.userData.explodeDirection = cube.position
          .clone()
          .sub(center)
          .normalize();
        cube.userData.isCenter = isCenter;

        group.add(cube);

        // Add raycast collider if this is the center cube
        if (isCenter) {
          const hitSphereGeometry = new THREE.SphereGeometry(6, 8, 8);
          const hitSphereMaterial = new THREE.MeshBasicMaterial({
            color: "blue",
            transparent: true,
            opacity: 0.0,
            visible: true,
          });

          const hitSphere = new THREE.Mesh(
            hitSphereGeometry,
            hitSphereMaterial
          );
          hitSphere.position.set(0, -5, 0); // Offset to sit in front of center cube
          group.add(hitSphere);
          group.userData.raycastTarget = hitSphere;
          cube.userData.pageId = "page1";
        }
      }
    }
  }

  return group;
}
