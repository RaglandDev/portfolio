export function fadeOverlayIn(fadeOverlay) {
  return new Promise((resolve) => {
    fadeOverlay.style.opacity = "1";
    fadeOverlay.style.pointerEvents = "auto";
    fadeOverlay.addEventListener("transitionend", resolve, { once: true });
  });
}

export function fadeOverlayOut(fadeOverlay) {
  return new Promise((resolve) => {
    fadeOverlay.style.opacity = "0";
    fadeOverlay.style.pointerEvents = "none";
    fadeOverlay.addEventListener("transitionend", resolve, { once: true });
  });
}
