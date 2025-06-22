import * as THREE from 'three';
import { Box } from './Box.js';

export function Matrix3D(dimX, dimY, dimZ, spacing = 4, edgeColor = 'black', boxColor = 'white', edgeWidth = 2) {
  const group = new THREE.Group();

  const centerX = Math.floor(dimX / 2);
  const centerY = Math.floor(dimY / 2);
  const centerZ = Math.floor(dimZ / 2);

  const center = new THREE.Vector3(0, 0, 0);

  for (let x = 0; x < dimX; x++) {
    for (let y = 0; y < dimY; y++) {
      for (let z = 0; z < dimZ; z++) {
        const posX = (x - (dimX - 1) / 2) * spacing;
        const posY = (y - (dimY - 1) / 2) * spacing;
        const posZ = (z - (dimZ - 1) / 2) * spacing;

        const isCenter = x === centerX && y === centerY && z === centerZ;
        const cubeCurrentColor = isCenter ? 'red' : boxColor;

        const cube = Box(cubeCurrentColor, edgeColor, edgeWidth);
        cube.position.set(posX, posY, posZ);
        cube.userData.originalPosition = cube.position.clone();
        cube.userData.explodeDirection = cube.position.clone().sub(center).normalize();
        cube.userData.isCenter = isCenter;

        group.add(cube);

        if (isCenter) {
          const hitSphereGeometry = new THREE.SphereGeometry(6, 8, 8);
          const hitSphereMaterial = new THREE.MeshBasicMaterial({
            color: 'blue',
            transparent: true,
            opacity: 0.0, // invis
            depthWrite: false,
          });

          const hitSphere = new THREE.Mesh(hitSphereGeometry, hitSphereMaterial);
          hitSphere.position.set(0, -3, 0); 
          hitSphere.name = 'raycastTarget';
          group.add(hitSphere);
          group.userData.raycastTarget = hitSphere;
        }
      }
    }
  }

  return group;
}
