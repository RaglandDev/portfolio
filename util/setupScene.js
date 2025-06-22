import * as THREE from "three";
import { Matrix3D } from "../components/Matrix3D.js";

export function setupScene(config) {
  const {
    BACKGROUND_COLOR,
    FOV,
    NEAR,
    FAR,
    CAMERA_Z,
    CUBE_SPACING,
    CUBE_OUTLINE_COLOR,
    CUBE_COLOR,
    CUBE_EDGE_WIDTH,
    MATRIX_SPACING,
    MOBILE_BREAKPOINT,
  } = config;

  // Create scene
  const scene = new THREE.Scene();

  // Setup camera with initial aspect ratio
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(FOV, aspect, NEAR, FAR);
  camera.position.z = CAMERA_Z;

  // Setup renderer and append canvas to DOM
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(BACKGROUND_COLOR, 1);
  document.body.appendChild(renderer.domElement);

  // Create group to hold 3x3 matrix grids
  const matricesGroup = new THREE.Group();
  matricesGroup.rotation.z = -Math.PI / 4; // Initial rotation for diagonal view

  // Populate group with 3x3 Matrix3D objects spaced evenly
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const matrix = Matrix3D(
        CUBE_SPACING,
        CUBE_OUTLINE_COLOR,
        CUBE_COLOR,
        CUBE_EDGE_WIDTH
      );
      matrix.position.set(
        (i - 1) * MATRIX_SPACING,
        (j - 1) * MATRIX_SPACING,
        0
      );
      matricesGroup.add(matrix);
    }
  }
  scene.add(matricesGroup);

  // Handle window resizing to update camera and renderer settings
  window.addEventListener("resize", () => {
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

    // Adjust group rotation based on viewport size
    matricesGroup.targetRotationZ = isMobile ? 0 : -Math.PI / 4;

    // Adjust camera zoom based on mobile or desktop
    camera.position.z = isMobile ? CAMERA_Z * 1.3 : CAMERA_Z;
    camera.fov = FOV;

    // Update camera aspect and projection matrix
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Resize renderer to fill window
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Trigger resize handler initially to set correct layout
  window.dispatchEvent(new Event("resize"));

  return { scene, camera, renderer, matricesGroup };
}
