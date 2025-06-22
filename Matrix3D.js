// Matrix3D.js
import * as THREE from 'three';
import { Box } from './Box.js';

export function Matrix3D(spacing = 4, edgeColor = 'black', boxColor = 'white', edgeWidth = 2) {
  const dim = 3; // fixed dimension
  const group = new THREE.Group();

  const centerIndex = 1; // for 3x3x3 center cube index (0-based)

  const center = new THREE.Vector3(0, 0, 0);

  for (let x = 0; x < dim; x++) {
    for (let y = 0; y < dim; y++) {
      for (let z = 0; z < dim; z++) {
        const posX = (x - (dim - 1) / 2) * spacing;
        const posY = (y - (dim - 1) / 2) * spacing;
        const posZ = (z - (dim - 1) / 2) * spacing;

        const isCenter = x === centerIndex && y === centerIndex && z === centerIndex;
        const cubeCurrentColor = isCenter ? 'red' : boxColor;

        const cube = Box(cubeCurrentColor, edgeColor, edgeWidth);
        cube.position.set(posX, posY, posZ);
        cube.userData.originalPosition = cube.position.clone();
        cube.userData.explodeDirection = cube.position.clone().sub(center).normalize();
        cube.userData.isCenter = isCenter;

        group.add(cube);

        if (isCenter) {
          // Add invisible collider for raycasting
          const hitSphereGeometry = new THREE.SphereGeometry(6, 8, 8);
          const hitSphereMaterial = new THREE.MeshBasicMaterial({
            color: 'blue', transparent: true, opacity: 0.0, visible: true
          });
          const hitSphere = new THREE.Mesh(hitSphereGeometry, hitSphereMaterial);
          hitSphere.position.set(0, -5, 0)
          group.add(hitSphere);
          group.userData.raycastTarget = hitSphere;
        }
      }
    }
  }

  return group;
}
