import * as THREE from "three";

export function updateMatrixCubes(state, matricesGroup, camera, isMobile) {
  // Configuration constants
  const EXPLODE_THRESHOLD = 0.07;
  const MAX_EXPLODE_STRENGTH = 100;
  const HOVER_EXPLODE_PUSH = 3;
  const CENTER_HOVER_SCALE = 3;
  const CENTER_NORMAL_SCALE = 1;
  const SCALE_LERP_SPEED = 0.1;
  const POSITION_LERP_SPEED = 0.07;
  const IDLE_VELOCITY_MAGNITUDE = 40;
  const DEFAULT_ROTATION_SPEED = 0.05;
  const MOBILE_SHRINK_SCALE = 0.2;

  matricesGroup.children.forEach((matrix) => {
    matrix.children.forEach((cube) => {
      // Skip cubes without originalPosition metadata
      if (!cube.userData.originalPosition) return;

      // Clone original position as target
      let targetPos = cube.userData.originalPosition.clone();

      if (isMobile) {
        // === Mobile view: merge cubes to center ===
        targetPos.set(0, 0, 0);

        // Smoothly shrink cubes when merging
        cube.scale.lerp(
          new THREE.Vector3(
            MOBILE_SHRINK_SCALE,
            MOBILE_SHRINK_SCALE,
            MOBILE_SHRINK_SCALE
          ),
          SCALE_LERP_SPEED
        );

        // Slow down cube rotation as they merge
        cube.rotation.x *= 0.9;
        cube.rotation.y *= 0.9;
      } else {
        // === Desktop view: restore scale and apply explode effects ===
        cube.scale.lerp(new THREE.Vector3(1, 1, 1), SCALE_LERP_SPEED);

        if (!state.idle) {
          const maxVel = Math.max(
            Math.abs(state.velocityX),
            Math.abs(state.velocityY)
          );

          // Explode cubes outward when velocity threshold exceeded
          if (maxVel > EXPLODE_THRESHOLD) {
            const strength = Math.min(maxVel * 100, MAX_EXPLODE_STRENGTH);
            targetPos.add(
              cube.userData.explodeDirection.clone().multiplyScalar(strength)
            );
          }

          // Additional explode effect when hovering a matrix
          if (matrix === state.hoveredMatrix) {
            targetPos.add(
              cube.userData.explodeDirection
                .clone()
                .multiplyScalar(HOVER_EXPLODE_PUSH)
            );

            // Scale and orient center cubes toward camera on hover
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
            // Return center cubes to normal scale when not hovered
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
          // === Idle behavior: gentle wiggle and rotation ===
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
      }

      // Smoothly move cube towards target position
      cube.position.lerp(targetPos, POSITION_LERP_SPEED);

      // Continue rotating cubes if applicable
      if (cube.userData.rotationSpeed && !state.idle && !isMobile) {
        cube.rotation.x += cube.userData.rotationSpeed.x;
        cube.rotation.y += cube.userData.rotationSpeed.y;
      }

      // Update lineMaterial resolution for wireframe edges
      if (cube.userData.lineMaterial) {
        cube.userData.lineMaterial.resolution.set(
          window.innerWidth,
          window.innerHeight
        );
      }
    });
  });
}
