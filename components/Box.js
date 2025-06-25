import * as THREE from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";

/**
 * @param {[string, number]} customText – [text, fontSize]
 * @param {string} boxColor
 * @param {string} edgeColor
 * @param {number} edgeWidth
 */
export function Box(
  customText = ["", 0],
  boxColor = "black",
  edgeColor = "black",
  edgeWidth = 2
) {
  const group = new THREE.Group();
  const size = 2;
  const half = size / 2;

  // --- make single shared label texture (with border) ---
  function makeLabelTexture([text, fontSize], bg, color) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // fill background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);

    // draw border
    const borderWidth = 8;
    ctx.strokeStyle = "black";
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(
      borderWidth / 2,
      borderWidth / 2,
      256 - borderWidth,
      256 - borderWidth
    );

    // draw text
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }
  const labelTex = makeLabelTexture(customText, boxColor, "black");

  // --- cube faces (with built-in label) ---
  const faceMatOpts = {
    map: labelTex,
    polygonOffset: true,
  };
  const faceMaterials = Array(6)
    .fill()
    .map(() => new THREE.MeshBasicMaterial(faceMatOpts));

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    faceMaterials
  );
  cube.userData.color = new THREE.Color(boxColor);
  group.add(cube);

  // --- floating label planes (just in case) ---
  const planeMat = new THREE.MeshBasicMaterial({
    map: labelTex,
    transparent: true,
    depthTest: false, // always render on top of faces
  });
  const labelPositions = [
    [half + 0.0, 0, 0],
    [-half - 0.0, 0, 0],
    [0, half + 0.0, 0],
    [0, -half - 0.0, 0],
    [0, 0, half + 0.0],
    [0, 0, -half - 0.0],
  ];
  const labelRotations = [
    [0, Math.PI / 2, 0],
    [0, -Math.PI / 2, 0],
    [-Math.PI / 2, 0, 0],
    [Math.PI / 2, 0, 0],
    [0, 0, 0],
    [0, Math.PI, 0],
  ];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), planeMat);
    m.position.set(...labelPositions[i]);
    m.rotation.set(...labelRotations[i]);
    m.renderOrder = 500; // draw after the cube itself
    group.add(m);
  }

  // --- wireframe outline (always on top) ---
  const verts = [
    [-half, -half, -half],
    [half, -half, -half],
    [half, half, -half],
    [-half, half, -half],
    [-half, -half, half],
    [half, -half, half],
    [half, half, half],
    [-half, half, half],
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  const pos = edges.flatMap(([a, b]) => [...verts[a], ...verts[b]]);
  const lineGeo = new LineGeometry();
  lineGeo.setPositions(pos);

  const lineMat = new LineMaterial({
    color: edgeColor,
    linewidth: edgeWidth,
    depthTest: false, // always visible
    depthWrite: false,
  });
  lineMat.resolution.set(window.innerWidth, window.innerHeight);

  const outline = new LineSegments2(lineGeo, lineMat);
  outline.renderOrder = 999; // last thing
  group.add(outline);

  // --- rotation speeds ---
  group.userData.rotationSpeed = {
    x: (Math.random() - 0.5) * 0.004,
    y: (Math.random() - 0.5) * 0.004,
  };

  return group;
}
