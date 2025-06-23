import * as THREE from "three";
import { Matrix3D } from "../components/Matrix3D.js";

export function setupScene(config) {
  const scene = new THREE.Scene();
  const camera = createCamera(config);
  const renderer = createRenderer(config);
  const matricesGroup = createMatricesGroup(config);

  scene.add(matricesGroup);

  // Setup responsive behavior
  setupResizeHandler(camera, renderer, matricesGroup, config);

  return { scene, camera, renderer, matricesGroup };
}

// === Helper: Create camera ===
function createCamera({ FOV, NEAR, FAR, CAMERA_Z }) {
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(FOV, aspect, NEAR, FAR);
  camera.position.z = CAMERA_Z;
  return camera;
}

// === Helper: Create renderer ===
function createRenderer({ BACKGROUND_COLOR }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(BACKGROUND_COLOR, 1);
  return renderer;
}

// === Helper: Create grid of 3x3 matrices ===
function createMatricesGroup(config) {
  const group = new THREE.Group();
  group.rotation.z = -Math.PI / 4;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const matrix = Matrix3D(
        config.CUBE_SPACING,
        config.CUBE_OUTLINE_COLOR,
        config.CUBE_COLOR,
        config.CUBE_EDGE_WIDTH
      );
      matrix.position.set(
        (i - 1) * config.MATRIX_SPACING,
        (j - 1) * config.MATRIX_SPACING,
        0
      );
      group.add(matrix);
    }
  }

  return group;
}

// === Helper: Handle window resizing ===
function setupResizeHandler(camera, renderer, matricesGroup, config) {
  const { MOBILE_BREAKPOINT, CAMERA_Z, FOV } = config;

  const resize = () => {
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

    // Update matrix rotation
    matricesGroup.targetRotationZ = isMobile ? 0 : -Math.PI / 4;

    // Adjust camera zoom
    camera.position.z = isMobile ? CAMERA_Z * 1.3 : CAMERA_Z;
    camera.fov = FOV;

    // Update camera projection
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Resize renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener("resize", resize);
  resize(); // Initial run
}
