import * as THREE from "three";

export function updateMatrixCubes(state, matricesGroup, camera, isMobile) {
  const CONFIG = {
    EXPLODE_THRESHOLD: 0.07,
    MAX_EXPLODE_STRENGTH: 100,
    HOVER_EXPLODE_PUSH: 3,
    CENTER_HOVER_SCALE: 3,
    CENTER_NORMAL_SCALE: 1,
    SCALE_LERP_SPEED: 0.1,
    POSITION_LERP_SPEED: 0.07,
    IDLE_VELOCITY_MAGNITUDE: 40,
    DEFAULT_ROTATION_SPEED: 0.05,
    MOBILE_SHRINK_SCALE: 0.2,
  };

  matricesGroup.children.forEach((matrix) => {
    const isHovered = matrix === state.hoveredMatrix;

    matrix.children.forEach((cube) => {
      if (!cube.userData.originalPosition) return;

      const { isCenter, explodeDirection, lineMaterial } = cube.userData;

      // === Target values ===
      let targetPos = cube.userData.originalPosition.clone();
      let targetScale = new THREE.Vector3(1, 1, 1);

      if (isMobile) {
        // === Mobile mode: merge inward and shrink ===
        targetPos.set(0, 0, 0);
        targetScale.setScalar(CONFIG.MOBILE_SHRINK_SCALE);

        cube.scale.lerp(targetScale, CONFIG.SCALE_LERP_SPEED);
        cube.rotation.x *= 0.9;
        cube.rotation.y *= 0.9;
      } else {
        // === Desktop mode ===

        // Velocity-based explode
        if (!state.idle) {
          const maxVel = Math.max(
            Math.abs(state.velocityX),
            Math.abs(state.velocityY)
          );

          if (maxVel > CONFIG.EXPLODE_THRESHOLD) {
            const strength = Math.min(
              maxVel * 100,
              CONFIG.MAX_EXPLODE_STRENGTH
            );
            targetPos.add(explodeDirection.clone().multiplyScalar(strength));
          }

          // Hover explode
          if (isHovered) {
            targetPos.add(
              explodeDirection.clone().multiplyScalar(CONFIG.HOVER_EXPLODE_PUSH)
            );

            if (isCenter) {
              targetScale.setScalar(CONFIG.CENTER_HOVER_SCALE);

              const lookTarget = new THREE.Object3D();
              lookTarget.position.copy(cube.position);
              lookTarget.lookAt(camera.position);
              cube.quaternion.slerp(
                lookTarget.quaternion,
                CONFIG.SCALE_LERP_SPEED
              );
            }
          } else if (isCenter) {
            targetScale.setScalar(CONFIG.CENTER_NORMAL_SCALE);
          }
        } else {
          // === Idle behavior: random motion and spin ===
          if (!cube.userData.idleVelocity) {
            cube.userData.idleVelocity = new THREE.Vector3(
              (Math.random() - 0.5) * CONFIG.IDLE_VELOCITY_MAGNITUDE,
              (Math.random() - 0.5) * CONFIG.IDLE_VELOCITY_MAGNITUDE,
              (Math.random() - 0.5) * CONFIG.IDLE_VELOCITY_MAGNITUDE
            );
          }

          cube.position.add(cube.userData.idleVelocity);

          cube.rotation.x +=
            cube.userData.rotationSpeed?.x ?? CONFIG.DEFAULT_ROTATION_SPEED;
          cube.rotation.y +=
            cube.userData.rotationSpeed?.y ?? CONFIG.DEFAULT_ROTATION_SPEED;
        }

        cube.scale.lerp(targetScale, CONFIG.SCALE_LERP_SPEED);
      }

      // === Apply position + continuous rotation ===
      cube.position.lerp(targetPos, CONFIG.POSITION_LERP_SPEED);

      if (cube.userData.rotationSpeed && !state.idle && !isMobile) {
        cube.rotation.x += cube.userData.rotationSpeed.x;
        cube.rotation.y += cube.userData.rotationSpeed.y;
      }

      // === Update line resolution for crisp wireframes ===
      if (lineMaterial) {
        lineMaterial.resolution.set(window.innerWidth, window.innerHeight);
      }
    });
  });
}
