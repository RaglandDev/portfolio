// main.js
import * as THREE from 'three';
import { Matrix3D } from './Matrix3D.js';

const BACKGROUND_COLOR = 'white';

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(BACKGROUND_COLOR, 1);
document.body.appendChild(renderer.domElement);

// Create 3x3 grid of Matrix3D
const matrixSpacing = 15;
const matricesGroup = new THREE.Group();
matricesGroup.rotation.z = -Math.PI / 4; // rotate left 45 degrees

for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    const matrix = Matrix3D(4, 'black', 'white', 2);
    matrix.position.set(
      (i - 1) * matrixSpacing,
      (j - 1) * matrixSpacing,
      0
    );
    matricesGroup.add(matrix);
  }
}

scene.add(matricesGroup);

camera.position.z = 50;
camera.position.y = -5;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let hoveredMatrix = null;

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  hoveredMatrix = null; // reset

  // Check hover for each matrix's raycast target
  for (const matrix of matricesGroup.children) {
    const target = matrix.userData.raycastTarget;
    if (target) {
      const intersects = raycaster.intersectObject(target, false);
      if (intersects.length > 0) {
        hoveredMatrix = matrix;
        break;
      }
    }
  }
});

window.addEventListener('mousedown', (event) => {
  isDragging = true;
  previousMousePosition = { x: event.clientX, y: event.clientY };
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

window.addEventListener('mousemove', (event) => {
  if (!isDragging) return;

  const deltaMove = {
    x: event.clientX - previousMousePosition.x,
    y: event.clientY - previousMousePosition.y,
  };

  // Rotate ONLY around Y-axis for left-right drag
  const rotationSpeed = 0.01;
  matricesGroup.rotation.y += deltaMove.x * rotationSpeed;

  previousMousePosition = { x: event.clientX, y: event.clientY };
});

function toRadians(angle) {
  return angle * (Math.PI / 180);
}

function animate() {
  matricesGroup.children.forEach((matrix) => {
    matrix.children.forEach((cube) => {
      if (!cube.userData.originalPosition) return;

      const targetPos = cube.userData.originalPosition.clone();
      if (matrix === hoveredMatrix) {
        targetPos.add(cube.userData.explodeDirection.clone().multiplyScalar(3));
      }

      cube.position.lerp(targetPos, 0.25);

      if (cube.userData.rotationSpeed) {
        cube.rotation.x += cube.userData.rotationSpeed.x;
        cube.rotation.y += cube.userData.rotationSpeed.y;
      }

      if (cube.userData.lineMaterial) {
        cube.userData.lineMaterial.resolution.set(window.innerWidth, window.innerHeight);
      }
    });
  });

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
