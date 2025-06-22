import * as THREE from "three";
import { Matrix3D } from "./Matrix3D.js";

// === Constants ===
const BACKGROUND_COLOR = "white";
const CUBE_OUTLINE_COLOR = "black";
const CUBE_COLOR = "white";
const CUBE_EDGE_WIDTH = 2;
const CUBE_SPACING = 4;
const MATRIX_SPACING = 15;
const FRICTION = 0.98;
const EXPLODE_THRESHOLD = 0.07;
const MAX_EXPLODE_STRENGTH = 100;
const CENTER_HOVER_SCALE = 3;
const CENTER_NORMAL_SCALE = 1;
const SCALE_LERP_SPEED = 0.1;
const POSITION_LERP_SPEED = 0.07;
const IDLE_VELOCITY_MAGNITUDE = 40;
const DEFAULT_ROTATION_SPEED = 0.05;
const HOVER_EXPLODE_PUSH = 3;
const FOV = 75;
const ASPECT_RATIO = window.innerWidth / window.innerHeight;
const NEAR = 0.1;
const FAR = 1000;
const CAMERA_Z = 50;
const VIEW_HEIGHT = 65;

// === State ===
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let velocityX = 0;
let velocityY = 0;
let idle = false;
let hoveredMatrix = null;

// === Scene Setup ===
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(FOV, ASPECT_RATIO, NEAR, FAR);
camera.position.z = CAMERA_Z;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(BACKGROUND_COLOR, 1);
document.body.appendChild(renderer.domElement);
updateCameraFOV(); // call once on startup

// === Matrices Group ===
const matricesGroup = new THREE.Group();
matricesGroup.rotation.z = -Math.PI / 4;

for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    const matrix = Matrix3D(
      CUBE_SPACING,
      CUBE_OUTLINE_COLOR,
      CUBE_COLOR,
      CUBE_EDGE_WIDTH
    );
    matrix.position.set((i - 1) * MATRIX_SPACING, (j - 1) * MATRIX_SPACING, 0);
    matricesGroup.add(matrix);
  }
}
scene.add(matricesGroup);

// === Raycasting ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// === Custom Cursor ===
const customCursor = document.createElement("div");
customCursor.id = "customCursor";
document.body.appendChild(customCursor);

// === Animation Loop ===
function animate() {
  applyInertia();

  // Return to original orientation
  matricesGroup.rotation.x += (0 - matricesGroup.rotation.x) * 0.02;
  matricesGroup.rotation.y += (0 - matricesGroup.rotation.y) * 0.02;

  updateMatrixCubes();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

// === Event Listeners ===
window.addEventListener("resize", updateCameraFOV);

window.addEventListener("mousemove", (event) => {
  customCursor.style.left = `${event.clientX}px`;
  customCursor.style.top = `${event.clientY}px`;

  idle = false;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  hoveredMatrix = null;

  // "Find" the matrix that is currently being hovered over
  for (const matrix of matricesGroup.children) {
    const target = matrix.userData.raycastTarget;
    if (target && raycaster.intersectObject(target, false).length > 0) {
      hoveredMatrix = matrix;
      break;
    }
  }

  // Spin around X or Y axis
  if (isDragging) {
    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      const rotY = deltaX * 0.005;
      matricesGroup.rotation.y += rotY;
      velocityY = rotY;
      velocityX = 0;
    } else {
      const rotX = deltaY * 0.005;
      matricesGroup.rotation.x += rotX;
      velocityX = rotX;
      velocityY = 0;
    }

    previousMousePosition = { x: event.clientX, y: event.clientY };
  }
});

window.addEventListener("mousedown", (event) => {
  isDragging = true;
  previousMousePosition = { x: event.clientX, y: event.clientY };
  velocityX = 0;
  velocityY = 0;
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

window.addEventListener("mouseout", (event) => {
  if (!event.relatedTarget) idle = true;
});

renderer.domElement.addEventListener("mouseenter", () => {
  idle = false;
});

// === Helpers ===
function applyInertia() {
  if (!isDragging && !idle) {
    if (Math.abs(velocityX) > 0.0001) {
      matricesGroup.rotation.x += velocityX;
      velocityX *= FRICTION;
    } else {
      velocityX = 0;
    }

    if (Math.abs(velocityY) > 0.0001) {
      matricesGroup.rotation.y += velocityY;
      velocityY *= FRICTION;
    } else {
      velocityY = 0;
    }
  }
}

function updateCameraFOV() {
  const fovRadians = 2 * Math.atan(VIEW_HEIGHT / 2 / CAMERA_Z);
  camera.fov = THREE.MathUtils.radToDeg(fovRadians);

  camera.aspect = ASPECT_RATIO;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateMatrixCubes() {
  matricesGroup.children.forEach((matrix) => {
    matrix.children.forEach((cube) => {
      if (!cube.userData.originalPosition) return;

      const targetPos = cube.userData.originalPosition.clone();

      if (!idle) {
        const maxVelocity = Math.max(Math.abs(velocityX), Math.abs(velocityY));
        if (maxVelocity > EXPLODE_THRESHOLD) {
          const strength = Math.min(maxVelocity * 100, MAX_EXPLODE_STRENGTH);
          targetPos.add(
            cube.userData.explodeDirection.clone().multiplyScalar(strength)
          );
        }

        if (matrix === hoveredMatrix) {
          targetPos.add(
            cube.userData.explodeDirection
              .clone()
              .multiplyScalar(HOVER_EXPLODE_PUSH)
          );

          if (cube.userData.isCenter) {
            cube.scale.lerp(
              new THREE.Vector3(
                CENTER_HOVER_SCALE,
                CENTER_HOVER_SCALE,
                CENTER_HOVER_SCALE
              ),
              SCALE_LERP_SPEED
            );

            const tempObj = new THREE.Object3D();
            tempObj.position.copy(cube.position);
            tempObj.lookAt(camera.position);
            cube.quaternion.slerp(tempObj.quaternion, SCALE_LERP_SPEED);
          }
        } else if (cube.userData.isCenter) {
          cube.scale.lerp(
            new THREE.Vector3(
              CENTER_NORMAL_SCALE,
              CENTER_NORMAL_SCALE,
              CENTER_NORMAL_SCALE
            ),
            SCALE_LERP_SPEED
          );
        }
      } else {
        if (!cube.userData.idleVelocity) {
          cube.userData.idleVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * IDLE_VELOCITY_MAGNITUDE,
            (Math.random() - 0.5) * IDLE_VELOCITY_MAGNITUDE,
            (Math.random() - 0.5) * IDLE_VELOCITY_MAGNITUDE
          );
        }

        cube.position.add(cube.userData.idleVelocity);
        cube.rotation.x +=
          cube.userData.rotationSpeed?.x ?? DEFAULT_ROTATION_SPEED;
        cube.rotation.y +=
          cube.userData.rotationSpeed?.y ?? DEFAULT_ROTATION_SPEED;
      }

      cube.position.lerp(targetPos, POSITION_LERP_SPEED);

      if (cube.userData.rotationSpeed && !idle) {
        cube.rotation.x += cube.userData.rotationSpeed.x;
        cube.rotation.y += cube.userData.rotationSpeed.y;
      }

      if (cube.userData.lineMaterial) {
        cube.userData.lineMaterial.resolution.set(
          window.innerWidth,
          window.innerHeight
        );
      }
    });
  });
}
