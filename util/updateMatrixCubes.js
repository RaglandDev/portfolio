import * as THREE from "three";
import { isMobile } from "../main.js";

export function updateMatrixCubes(state, matricesGroup, camera, isMobile) {
  const CONFIG = {
    EXPLODE_THRESHOLD: 0.07,
    MAX_EXPLODE_STRENGTH: 100,
    HOVER_EXPLODE_PUSH: 3,
    CENTER_HOVER_SCALE: 10,
    CENTER_NORMAL_SCALE: 5,
    SCALE_LERP_SPEED: 0.1,
    POSITION_LERP_SPEED: 0.07,
    IDLE_VELOCITY_MAGNITUDE: 40,
    DEFAULT_ROTATION_SPEED: 0.05,
  };

  matricesGroup.children.forEach((matrix) => {
    matrix.children.forEach((cube) => {
      if (!cube.userData.originalPosition) return;

      const isCenter = cube.userData.isCenter;
      const targetPos = getTargetPosition(
        cube,
        matrix,
        state,
        isMobile,
        CONFIG
      );

      handleDesktopCube(cube, matrix, state, camera, CONFIG);
      // Move toward target position
      cube.position.lerp(targetPos, CONFIG.POSITION_LERP_SPEED);

      // Continue rotating if not idle and not on mobile
      if (cube.userData.rotationSpeed && !state.idle && !isMobile) {
        cube.rotation.x += cube.userData.rotationSpeed.x;
        cube.rotation.y += cube.userData.rotationSpeed.y;
      }

      // Update wireframe material resolution
      if (cube.userData.lineMaterial) {
        cube.userData.lineMaterial.resolution.set(
          window.innerWidth,
          window.innerHeight
        );
      }
    });
  });
}

// === Helpers ===

function getTargetPosition(cube, matrix, state, isMobile, CONFIG) {
  const { EXPLODE_THRESHOLD, MAX_EXPLODE_STRENGTH, HOVER_EXPLODE_PUSH } =
    CONFIG;
  const basePos = cube.userData.originalPosition.clone();

  if (isMobile) {
    return new THREE.Vector3(0, 0, 0);
  }

  let target = basePos;

  if (!state.idle) {
    const maxVel = Math.max(
      Math.abs(state.velocityX),
      Math.abs(state.velocityY)
    );

    if (maxVel > EXPLODE_THRESHOLD) {
      const strength = Math.min(maxVel * 100, MAX_EXPLODE_STRENGTH);
      target.add(
        cube.userData.explodeDirection.clone().multiplyScalar(strength)
      );
    }

    if (matrix === state.hoveredMatrix) {
      target.add(
        cube.userData.explodeDirection
          .clone()
          .multiplyScalar(HOVER_EXPLODE_PUSH)
      );
    }
  }

  return target;
}

function handleDesktopCube(cube, matrix, state, camera, CONFIG) {
  const {
    SCALE_LERP_SPEED,
    CENTER_HOVER_SCALE,
    CENTER_NORMAL_SCALE,
    IDLE_VELOCITY_MAGNITUDE,
    DEFAULT_ROTATION_SPEED,
  } = CONFIG;

  cube.scale.lerp(new THREE.Vector3(1, 1, 1), SCALE_LERP_SPEED);

  const isCenter = cube.userData.isCenter;

  if (!state.idle) {
    if (matrix === state.hoveredMatrix && isCenter) {
      cube.rotation.z = Math.PI / 4; // Rotate 45 degrees around Y axis
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
    } else if (isCenter) {
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
    // Idle behavior: gentle wiggle and idle rotation
    if (!cube.userData.idleVelocity) {
      cube.userData.idleVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * IDLE_VELOCITY_MAGNITUDE,
        (Math.random() - 0.5) * IDLE_VELOCITY_MAGNITUDE,
        (Math.random() - 0.5) * IDLE_VELOCITY_MAGNITUDE
      );
    }

    cube.position.add(cube.userData.idleVelocity);

    cube.rotation.x += cube.userData.rotationSpeed?.x ?? DEFAULT_ROTATION_SPEED;
    cube.rotation.y += cube.userData.rotationSpeed?.y ?? DEFAULT_ROTATION_SPEED;
  }
}

export function updateMatrixRotation(matricesGroup, state) {
  const target = isMobile() ? 0 : -Math.PI / 4;
  matricesGroup.userData.targetRotationZ = target;
  state.rotated = !isMobile();
}

// === Red Center Cube Scaling ===
export function scaleCenterCubes(CONFIG, matricesGroup, isOnMobile, camera) {
  matricesGroup.children.forEach((matrix) => {
    matrix.children.forEach((cubeGroup) => {
      if (!cubeGroup.userData.isCenter) return;

      const mesh = cubeGroup.children.find((c) => c instanceof THREE.Mesh);
      if (!mesh) return;

      const isRed = mesh.userData.color?.equals(new THREE.Color("red"));

      const targetScale =
        isRed && isOnMobile
          ? CONFIG.CENTER_SCALE_MOBILE
          : CONFIG.CENTER_SCALE_NORMAL;

      cubeGroup.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        CONFIG.SCALE_LERP_SPEED
      );

      if (isRed && isOnMobile) {
        // Make red center cube face the camera
        const temp = new THREE.Object3D();
        temp.position.copy(cubeGroup.position);
        temp.lookAt(camera.position);
        cubeGroup.quaternion.slerp(temp.quaternion, CONFIG.SCALE_LERP_SPEED);
      }
    });
  });
}
