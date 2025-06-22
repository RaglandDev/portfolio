import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

export function Box(boxColor = 'black', edgeColor = 'black', edgeWidth = 2) {
  const group = new THREE.Group();

  const cubeSize = 2;
  const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  const cubeMaterial = new THREE.MeshBasicMaterial({
    color: boxColor,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
  group.add(cubeMesh);

  const h = cubeSize / 2;
  const vertices = [
    [-h, -h, -h], [ h, -h, -h], [ h,  h, -h], [-h,  h, -h],
    [-h, -h,  h], [ h, -h,  h], [ h,  h,  h], [-h,  h,  h],
  ];

  const edges = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7],
  ];

  const positions = [];
  for (const [start, end] of edges) {
    positions.push(...vertices[start], ...vertices[end]);
  }

  const lineGeometry = new LineGeometry();
  lineGeometry.setPositions(positions);

  const lineMaterial = new LineMaterial({
    color: edgeColor,
    linewidth: edgeWidth,
  });

  const edgeLines = new LineSegments2(lineGeometry, lineMaterial);
  group.add(edgeLines);

  group.userData.lineMaterial = lineMaterial;

  group.userData.rotationSpeed = {
    x: (Math.random() - 0.5) * 0.004,
    y: (Math.random() - 0.5) * 0.004,
  };

  return group;
}
