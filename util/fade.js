import { pages } from "../main.js";
const fadeOverlay = document.getElementById("fadeOverlay");

export function fadeOverlayIn() {
  return new Promise((resolve) => {
    fadeOverlay.style.opacity = "1";
    fadeOverlay.style.pointerEvents = "auto";
    fadeOverlay.addEventListener("transitionend", resolve, { once: true });
  });
}

export function fadeOverlayOut() {
  return new Promise((resolve) => {
    fadeOverlay.style.opacity = "0";
    fadeOverlay.style.pointerEvents = "none";
    fadeOverlay.addEventListener("transitionend", resolve, { once: true });
  });
}

export function hideAllPages() {
  document.getElementById("threejs-container").style.display = "block";
  pages.forEach((p) => p.classList.remove("visible"));
}

export async function hidePagesAndShowThreeJS() {
  fadeOverlay.classList.add("fast-fade");
  await fadeOverlayIn(fadeOverlay);

  hideAllPages(document, pages);
  await fadeOverlayOut(fadeOverlay);

  fadeOverlay.classList.remove("fast-fade");
  document.body.classList.remove("page-visible");
}
