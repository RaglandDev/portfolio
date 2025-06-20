import * as THREE from 'three';

let zoomedIn = false;
let targetZoom = 5;
let currentZoom = 5;

window.addEventListener('mousedown', () => {
  zoomedIn = !zoomedIn;
  targetZoom = zoomedIn ? 0.1 : 5;
});


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const group = new THREE.Group();
scene.add(group);

// create a cube geometry (size 2x2x2)
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0 });
const cube = new THREE.Mesh(geometry, material);
group.add(cube);

// edges from cube geometry
const edges = new THREE.EdgesGeometry(geometry);
const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
group.add(line);

// --- Use bounding box to get precise corner positions ---
// create bounding box from geometry
const boundingBox = new THREE.Box3().setFromBufferAttribute(geometry.attributes.position);

// extract min and max corners
const min = boundingBox.min;
const max = boundingBox.max;

// corners of the box (8 vertices)
const corners = [
  new THREE.Vector3(min.x, min.y, min.z),
  new THREE.Vector3(min.x, min.y, max.z),
  new THREE.Vector3(min.x, max.y, min.z),
  new THREE.Vector3(min.x, max.y, max.z),
  new THREE.Vector3(max.x, min.y, min.z),
  new THREE.Vector3(max.x, min.y, max.z),
  new THREE.Vector3(max.x, max.y, min.z),
  new THREE.Vector3(max.x, max.y, max.z),
];

// boxes at edge midpoints
const edgeBoxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const baseBox = new THREE.BoxGeometry(1, 0.1, 0.1);
const edgePositions = edges.attributes.position;

for (let i = 0; i < edgePositions.count; i += 2) {
  const start = new THREE.Vector3().fromBufferAttribute(edgePositions, i);
  const end = new THREE.Vector3().fromBufferAttribute(edgePositions, i + 1);
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  const dir = new THREE.Vector3().subVectors(end, start).normalize();
  const length = start.distanceTo(end);

  // create edge prism
  const box = new THREE.Mesh(baseBox, edgeBoxMaterial);
  box.scale.set(length, 0.9, 0.9); // stretch along X
  box.position.copy(midpoint);

  // rotation
  const xAxis = new THREE.Vector3(1, 0, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(xAxis, dir);
  box.setRotationFromQuaternion(quaternion);

  group.add(box);
}

// small corner boxes at each bounding box corner (flush with edges)
const cornerBoxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const cornerBoxGeometry = new THREE.BoxGeometry(0.09, 0.09, 0.09);

corners.forEach(cornerPos => {
  const cornerBox = new THREE.Mesh(cornerBoxGeometry, cornerBoxMaterial);
  cornerBox.position.copy(cornerPos);
  group.add(cornerBox);
});

// move camera outside cube
camera.position.z = 5;

// render loop
function animate() {
  group.rotation.x += 0.0075;
  group.rotation.y += 0.0075;

  // smooth zoom interpolation
  currentZoom += (targetZoom - currentZoom) * 0.1;
  camera.position.z = currentZoom;

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
