import * as THREE from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";

/**
 * Creates a cube with an outline using LineSegments2.
 *
 * @param {string} boxColor - Fill color of the cube.
 * @param {string} edgeColor - Color of the wireframe edges.
 * @param {number} edgeWidth - Thickness of the wireframe edges.
 * @returns {THREE.Group} Group containing the cube mesh and its outline.
 */
export function Box(boxColor = "black", edgeColor = "black", edgeWidth = 2) {
  const group = new THREE.Group();
  const size = 2;
  const half = size / 2;

  // === Solid Cube ===
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshBasicMaterial({
    color: boxColor,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  // === Wireframe Outline ===
  const vertices = [
    [-half, -half, -half],
    [half, -half, -half],
    [half, half, -half],
    [-half, half, -half],
    [-half, -half, half],
    [half, -half, half],
    [half, half, half],
    [-half, half, half],
  ];

  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];

  const positions = edges.flatMap(([a, b]) => [...vertices[a], ...vertices[b]]);

  const lineGeometry = new LineGeometry();
  lineGeometry.setPositions(positions);

  const lineMaterial = new LineMaterial({
    color: edgeColor,
    linewidth: edgeWidth,
  });

  const outline = new LineSegments2(lineGeometry, lineMaterial);
  group.add(outline);

  // === Metadata ===
  group.userData.lineMaterial = lineMaterial;
  group.userData.rotationSpeed = {
    x: (Math.random() - 0.5) * 0.004,
    y: (Math.random() - 0.5) * 0.004,
  };

  return group;
}
