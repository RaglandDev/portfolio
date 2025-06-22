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

const gridGroup = Matrix3D(3, 3, 3, 3, 'black', 'white', 3);
scene.add(gridGroup);

camera.position.z = 20;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let isHoveringCenter = false;

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const raycastTarget = gridGroup.userData.raycastTarget;
  if (raycastTarget) {
    const intersects = raycaster.intersectObject(raycastTarget, false);
    isHoveringCenter = intersects.length > 0;
    if (isHoveringCenter) {
      console.log('center')
    }
  } else {
    isHoveringCenter = false;
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

  const deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      toRadians(deltaMove.y * 0.5),
      toRadians(deltaMove.x * 0.5),
      0,
      'XYZ'
    )
  );

  gridGroup.quaternion.multiplyQuaternions(
    deltaRotationQuaternion,
    gridGroup.quaternion
  );

  previousMousePosition = { x: event.clientX, y: event.clientY };
});

function toRadians(angle) {
  return angle * (Math.PI / 180);
}

function animate() {
  gridGroup.children.forEach((cube) => {
    if (!cube.userData.originalPosition) return;

    const targetPos = cube.userData.originalPosition.clone();

    if (isHoveringCenter) {
      targetPos.add(cube.userData.explodeDirection.clone().multiplyScalar(3));
    }

    cube.position.lerp(targetPos, 0.25);

    if (cube.userData.rotationSpeed) {
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

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
