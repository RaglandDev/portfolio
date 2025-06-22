// main.js
import * as THREE from 'three';
import { Matrix3D } from './Matrix3D.js';

const BACKGROUND_COLOR = 'white';

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let velocityX = 0; // rotation velocity around X (forward/back)
let velocityY = 0; // rotation velocity around Y (left/right)
const friction = 0.98;
const throwThreshold = 0.07;

let idle = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 50;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(BACKGROUND_COLOR, 1);
document.body.appendChild(renderer.domElement);

const matricesGroup = new THREE.Group();
matricesGroup.rotation.z = -Math.PI / 4;

const matrixSpacing = 15;
for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    const matrix = Matrix3D(4, 'black', 'white', 2);
    matrix.position.set((i - 1) * matrixSpacing, (j - 1) * matrixSpacing, 0);
    matricesGroup.add(matrix);
  }
}
scene.add(matricesGroup);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredMatrix = null;

window.addEventListener('mousemove', (event) => {
  // When user moves inside canvas, consider active
  idle = false;

  matricesGroup.children.forEach((matrix) => {
    matrix.children.forEach((cube) => {
      delete cube.userData.idleVelocity;
    });
  });

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  hoveredMatrix = null;

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
  velocityX = 0;
  velocityY = 0;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

window.addEventListener('mousemove', (event) => {
  if (!isDragging) return;

  const deltaX = event.clientX - previousMousePosition.x;
  const deltaY = event.clientY - previousMousePosition.y;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    const rotationAmountY = deltaX * 0.005;
    matricesGroup.rotation.y += rotationAmountY;
    velocityY = rotationAmountY;
    velocityX = 0;
  } else {
    const rotationAmountX = deltaY * 0.005;
    matricesGroup.rotation.x += rotationAmountX;
    velocityX = rotationAmountX;
    velocityY = 0;
  }

  previousMousePosition = { x: event.clientX, y: event.clientY };
});

window.addEventListener('mouseout', (event) => {
  if (!event.relatedTarget) {
    idle = true;
  }
});
renderer.domElement.addEventListener('mouseenter', () => {
  idle = false;
  // Reset idle velocities so cubes return to original positions
  matricesGroup.children.forEach(matrix => {
    matrix.children.forEach(cube => {
      delete cube.userData.idleVelocity;
    });
  });
});

function animate() {
  if (!isDragging && !idle) {
    if (Math.abs(velocityX) > 0.0001) {
      matricesGroup.rotation.x += velocityX;
      velocityX *= friction;
    } else {
      velocityX = 0;
    }

    if (Math.abs(velocityY) > 0.0001) {
      matricesGroup.rotation.y += velocityY;
      velocityY *= friction;
    } else {
      velocityY = 0;
    }

    matricesGroup.rotation.x += (0 - matricesGroup.rotation.x) * 0.02;
    matricesGroup.rotation.y += (0 - matricesGroup.rotation.y) * 0.02;
  }

  matricesGroup.children.forEach((matrix) => {
    matrix.children.forEach((cube) => {
      if (!cube.userData.originalPosition) return;

      let targetPos = cube.userData.originalPosition.clone();

      if (!idle) {
        if (Math.abs(velocityX) > throwThreshold || Math.abs(velocityY) > throwThreshold) {
          const strength = Math.min(
            Math.max(Math.abs(velocityX), Math.abs(velocityY)) * 100,
            100
          );
          targetPos.add(cube.userData.explodeDirection.clone().multiplyScalar(strength));
        }

        if (matrix === hoveredMatrix) {
          targetPos.add(cube.userData.explodeDirection.clone().multiplyScalar(3));

          if (cube.userData.isCenter) {
            cube.scale.lerp(new THREE.Vector3(3, 3, 3), 0.1);

            const tempObj = new THREE.Object3D();
            tempObj.position.copy(cube.position);
            tempObj.lookAt(camera.position);
            cube.quaternion.slerp(tempObj.quaternion, 0.1);
          }
        } else {
          if (cube.userData.isCenter) {
            cube.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
          }
        }
      } else {
        if (!cube.userData.idleVelocity) {
          cube.userData.idleVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40
          );
        }

        cube.position.add(cube.userData.idleVelocity);

        if (cube.userData.rotationSpeed) {
          cube.rotation.x += cube.userData.rotationSpeed.x;
          cube.rotation.y += cube.userData.rotationSpeed.y;
        } else {
          cube.rotation.x += 0.05;
          cube.rotation.y += 0.05;
        }
      }

      cube.position.lerp(targetPos, 0.07);

      if (cube.userData.rotationSpeed && !idle) {
        cube.rotation.x += cube.userData.rotationSpeed.x;
        cube.rotation.y += cube.userData.rotationSpeed.y;
      }

      if (cube.userData.lineMaterial) {
        cube.userData.lineMaterial.resolution.set(window.innerWidth, window.innerHeight);
      }
    });
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


