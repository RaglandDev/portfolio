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
    VIEW_HEIGHT,
  } = config;

  const scene = new THREE.Scene();
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(FOV, aspect, NEAR, FAR);
  camera.position.z = CAMERA_Z;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(BACKGROUND_COLOR, 1);
  document.body.appendChild(renderer.domElement);

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
      matrix.position.set(
        (i - 1) * MATRIX_SPACING,
        (j - 1) * MATRIX_SPACING,
        0
      );
      matricesGroup.add(matrix);
    }
  }
  scene.add(matricesGroup);

  window.addEventListener("resize", () => {
    const fovRadians = 2 * Math.atan(VIEW_HEIGHT / 2 / CAMERA_Z);
    camera.fov = THREE.MathUtils.radToDeg(fovRadians);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // un-rotate grid for mobile
    const shouldUnrotate = window.innerWidth < 600;
    matricesGroup.targetRotationZ = shouldUnrotate ? 0 : -Math.PI / 4;
  });

  window.dispatchEvent(new Event("resize")); // initial call

  return { scene, camera, renderer, matricesGroup };
}
