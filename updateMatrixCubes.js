import * as THREE from "three";

export function updateMatrixCubes(state, matricesGroup, camera) {
  const {
    EXPLODE_THRESHOLD = 0.07,
    MAX_EXPLODE_STRENGTH = 100,
    HOVER_EXPLODE_PUSH = 3,
    CENTER_HOVER_SCALE = 3,
    CENTER_NORMAL_SCALE = 1,
    SCALE_LERP_SPEED = 0.1,
    POSITION_LERP_SPEED = 0.07,
    IDLE_VELOCITY_MAGNITUDE = 40,
    DEFAULT_ROTATION_SPEED = 0.05,
  } = {};

  matricesGroup.children.forEach((matrix) => {
    matrix.children.forEach((cube) => {
      if (!cube.userData.originalPosition) return;
      const targetPos = cube.userData.originalPosition.clone();

      if (!state.idle) {
        const maxVel = Math.max(
          Math.abs(state.velocityX),
          Math.abs(state.velocityY)
        );
        if (maxVel > EXPLODE_THRESHOLD) {
          const strength = Math.min(maxVel * 100, MAX_EXPLODE_STRENGTH);
          targetPos.add(
            cube.userData.explodeDirection.clone().multiplyScalar(strength)
          );
        }

        if (matrix === state.hoveredMatrix) {
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

      if (cube.userData.rotationSpeed && !state.idle) {
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
