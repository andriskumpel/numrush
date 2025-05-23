// Import necessary modules
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/SMAAPass.js';

// Add score variable
let score = 0;

// Initialize loading manager
const loadingManager = new THREE.LoadingManager();
// ... (resto do seu código JavaScript aqui, sem alterações) ...

// Exemplo de onde seu código continua:
const textureLoader = new THREE.TextureLoader(loadingManager);
const gltfLoader = new GLTFLoader(loadingManager);
let assetsLoaded = false;
// Load beer texture
const beerTexture = textureLoader.load('https://play.rosebud.ai/assets/Golden beer.png?4IL8');
// Load Red heart texture
const heartTexture = textureLoader.load('https://play.rosebud.ai/assets/Red heart.png?YP7E');
// Load grass texture
const grassTexture = textureLoader.load('https://play.rosebud.ai/assets/3D_playground_grass_diffuse.png?lwa9');
grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(5, 50); // Adjust repeat to match road length
grassTexture.encoding = THREE.sRGBEncoding;
// Load skybox texture
const skyboxTexture = textureLoader.load('https://play.rosebud.ai/assets/SvtPvKb.png?Da3n');
skyboxTexture.encoding = THREE.sRGBEncoding;
// Load Oak tree texture
const oakTreeTexture = textureLoader.load('https://play.rosebud.ai/assets/Oak tree.png?yYuT');
oakTreeTexture.encoding = THREE.sRGBEncoding;
// Load Traffic cone texture
const trafficConeTexture = textureLoader.load('https://play.rosebud.ai/assets/traffic cone.png?1a0j');
trafficConeTexture.encoding = THREE.sRGBEncoding;
// Load Rock texture
const rockTexture = textureLoader.load('https://play.rosebud.ai/assets/Rock.png?F4b2');
rockTexture.encoding = THREE.sRGBEncoding;

// Optionally, add URL remapping if needed
loadingManager.setURLModifier((url) => {
    if (url.includes('Textures/colormap.png')) {
        return 'https://play.rosebud.ai/assets/3D_playground_character_colormap.png?ZPHe';
    }
    return url;
});

const parentDiv = document.getElementById('renderDiv');
let canvas = document.getElementById('threeRenderCanvas');
if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'threeRenderCanvas';
    parentDiv.appendChild(canvas);
}

// Create loading screen
const loadingScreen = document.createElement('div');
loadingScreen.style.position = 'absolute';
loadingScreen.style.top = '0';
loadingScreen.style.left = '0';
loadingScreen.style.width = '100%';
loadingScreen.style.height = '100%';
loadingScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
loadingScreen.style.color = 'white';
loadingScreen.style.display = 'flex';
loadingScreen.style.justifyContent = 'center';
loadingScreen.style.alignItems = 'center';
loadingScreen.style.fontSize = '24px';
loadingScreen.innerHTML = 'Loading... 0%';
parentDiv.appendChild(loadingScreen);

// Loading manager events
loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    const progress = ((itemsLoaded / itemsTotal) * 100).toFixed(0);
    loadingScreen.innerHTML = `Loading... ${progress}%`;
};

loadingManager.onLoad = function() {
    assetsLoaded = true;
    loadingScreen.style.display = 'none';
};

loadingManager.onError = function(url) {
    console.error('Error loading:', url);
};
// Initialize the scene
const scene = new THREE.Scene();
const world = new CANNON.World(); // CANNON é global por causa do script separado
world.gravity.set(0, -20, 0);
world.defaultContactMaterial.friction = 0.01; // Reduced global friction
world.defaultContactMaterial.restitution = 0; // No bounce by default
world.solver.iterations = 10;
world.solver.tolerance = 0.001;
// Define physics materials
const groundPhysMaterial = new CANNON.Material('ground');
const clock = new THREE.Clock();
// Initialize the camera
const camera = new THREE.PerspectiveCamera(
    75,
    canvas.offsetWidth / canvas.offsetHeight,
    0.1,
    1000
);
// Camera configuration
const cameraConfig = {
    position: new THREE.Vector3(0, 15, 30),
    lookAt: new THREE.Vector3(0, 5, -20), // Adjust lookAt to match the new character position
    fov: 75,
    near: 0.1,
    far: 1000
};
// Set initial camera position and orientation
camera.position.copy(cameraConfig.position);
camera.lookAt(cameraConfig.lookAt);
camera.fov = cameraConfig.fov;
camera.near = cameraConfig.near;
camera.far = cameraConfig.far;
camera.updateProjectionMatrix();

// Initialize the renderer with HDR
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas,
    powerPreference: 'high-performance',
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding; // Use sRGBEncoding for output
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Initialize post-processing
const composer = new EffectComposer(renderer);

// Regular scene render pass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add subtle bloom effect
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.2, // bloom strength
    0.4, // radius
    0.9 // threshold
);
composer.addPass(bloomPass);

// Add anti-aliasing
const smaaPass = new SMAAPass(
    window.innerWidth * renderer.getPixelRatio(),
    window.innerHeight * renderer.getPixelRatio()
);
composer.addPass(smaaPass);

// Initialize composer size
composer.setSize(parentDiv.clientWidth, parentDiv.clientHeight);

// Create skybox
const skyboxSize = 1000; // Increased size to ensure full coverage
const skyboxGeometry = new THREE.BoxGeometry(skyboxSize, skyboxSize, skyboxSize);
const skyboxMaterial = new THREE.MeshBasicMaterial({
    map: skyboxTexture,
    side: THREE.BackSide,
});
// Set texture to repeat and adjust UV mapping
skyboxTexture.wrapS = THREE.RepeatWrapping;
skyboxTexture.wrapT = THREE.RepeatWrapping;
skyboxTexture.repeat.set(1, 1);
const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
scene.add(skybox);

// Modify OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minPolarAngle = Math.PI / 6; // 30 degrees
controls.maxPolarAngle = Math.PI / 2; // 90 degrees
controls.minDistance = 10;
controls.maxDistance = 50;
controls.target = new THREE.Vector3(0, 2, -15); // Adjusted to match cameraConfig.lookAt

// Create scrolling terrain with 3 lanes
const terrainSegments = [];
const laneWidth = 8; // Doubled the lane width
const terrainLength = 300; // Increased from 200 to 300
const numSegments = 4; // Increased from 3 to 4
const roadWidth = laneWidth * 3; // Total width for 3 lanes (now doubled)
const grassWidth = 100; // Increased width of grass on each side
const totalWidth = roadWidth + grassWidth * 2; // Total width including grass
function createRoadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    // Draw road surface
    ctx.fillStyle = '#404040';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw lane markings
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 8;
    ctx.setLineDash([40, 20]); // Dashed line
    // Left lane marking
    ctx.beginPath();
    ctx.moveTo(canvas.width / 3, 0);
    ctx.lineTo(canvas.width / 3, canvas.height);
    ctx.stroke();
    // Right lane marking
    ctx.beginPath();
    ctx.moveTo(canvas.width * 2 / 3, 0);
    ctx.lineTo(canvas.width * 2 / 3, canvas.height);
    ctx.stroke();
    return new THREE.CanvasTexture(canvas);
}

function createOakTree(x, z) {
    const treeMaterial = new THREE.SpriteMaterial({
        map: oakTreeTexture,
        transparent: true
    });
    const treeSprite = new THREE.Sprite(treeMaterial);
    const scale = 10 + Math.random() * 5; // Random scale between 10 and 15
    treeSprite.scale.set(scale, scale, 1);
    treeSprite.position.set(x, scale / 2, z);
    return treeSprite;
}

function createTerrainSegment(zPosition) {
    const group = new THREE.Group();
    // Create road
    const roadGeometry = new THREE.PlaneGeometry(roadWidth, terrainLength);
    const roadTexture = createRoadTexture();
    roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.repeat.set(1, 10); // Adjust repeat to match road markings
    roadTexture.encoding = THREE.sRGBEncoding;
    const roadMaterial = new THREE.MeshStandardMaterial({
        map: roadTexture,
        roughness: 0.7,
        metalness: 0.2,
        envMapIntensity: 1.0,
    });
    const roadSegment = new THREE.Mesh(roadGeometry, roadMaterial);
    roadSegment.rotation.x = -Math.PI / 2;
    roadSegment.receiveShadow = true;
    group.add(roadSegment);
    // Create left grass
    const leftGrassGeometry = new THREE.PlaneGeometry(grassWidth, terrainLength);
    const leftGrassMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 0.8,
        metalness: 0.1,
        envMapIntensity: 1.0,
    });
    const leftGrassSegment = new THREE.Mesh(leftGrassGeometry, leftGrassMaterial);
    leftGrassSegment.rotation.x = -Math.PI / 2;
    leftGrassSegment.position.x = -(roadWidth / 2 + grassWidth / 2);
    leftGrassSegment.receiveShadow = true;
    group.add(leftGrassSegment);
    // Add Oak trees to left grass
    const numTreesLeft = 3 + Math.floor(Math.random() * 3); // 3 to 5 trees
    for (let i = 0; i < numTreesLeft; i++) {
        const x = -(roadWidth / 2 + Math.random() * grassWidth);
        const z = Math.random() * terrainLength - terrainLength / 2;
        const tree = createOakTree(x, z);
        group.add(tree);
    }

    // Add traffic cones to the left side of the road
    const leftConeX = -roadWidth / 2 + 1; // 1 unit from the edge of the road
    for (let z = -terrainLength / 2; z < terrainLength / 2; z += 20) {
        const cone = createTrafficCone(leftConeX, z);
        group.add(cone);
    }

    // Create right grass
    const rightGrassGeometry = new THREE.PlaneGeometry(grassWidth, terrainLength);
    const rightGrassMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 0.8,
        metalness: 0.1,
        envMapIntensity: 1.0,
    });
    const rightGrassSegment = new THREE.Mesh(rightGrassGeometry, rightGrassMaterial);
    rightGrassSegment.rotation.x = -Math.PI / 2;
    rightGrassSegment.position.x = roadWidth / 2 + grassWidth / 2;
    rightGrassSegment.receiveShadow = true;
    group.add(rightGrassSegment);
    // Add Oak trees to right grass
    const numTreesRight = 3 + Math.floor(Math.random() * 3); // 3 to 5 trees
    for (let i = 0; i < numTreesRight; i++) {
        const x = roadWidth / 2 + Math.random() * grassWidth;
        const z = Math.random() * terrainLength - terrainLength / 2;
        const tree = createOakTree(x, z);
        group.add(tree);

        // Add traffic cones to the right side of the road
        const rightConeX = roadWidth / 2 - 1; // 1 unit from the edge of the road
        for (let z_cone = -terrainLength / 2; z_cone < terrainLength / 2; z_cone += 20) { // Renamed z to z_cone to avoid conflict
            const cone = createTrafficCone(rightConeX, z_cone);
            group.add(cone);
        }
    }
    // Create left extension
    const leftExtensionGeometry = new THREE.PlaneGeometry(grassWidth, terrainLength);
    const leftExtensionSegment = new THREE.Mesh(leftExtensionGeometry, leftGrassMaterial); // Re-using leftGrassMaterial
    leftExtensionSegment.rotation.x = -Math.PI / 2;
    leftExtensionSegment.position.x = -(roadWidth / 2 + grassWidth * 1.5);
    leftExtensionSegment.receiveShadow = true;
    group.add(leftExtensionSegment);
    // Add rocks to left extension
    for (let z = -terrainLength / 2; z < terrainLength / 2; z += 20) { // Increased spacing
        const rockX = -(roadWidth / 2 + grassWidth * 1.5 + Math.random() * 20); // Increased random range
        const rock = createRock(rockX, z);
        group.add(rock);
    }
    // Create right extension
    const rightExtensionGeometry = new THREE.PlaneGeometry(grassWidth, terrainLength);
    const rightExtensionSegment = new THREE.Mesh(rightExtensionGeometry, rightGrassMaterial); // Re-using rightGrassMaterial
    rightExtensionSegment.rotation.x = -Math.PI / 2;
    rightExtensionSegment.position.x = roadWidth / 2 + grassWidth * 1.5;
    rightExtensionSegment.receiveShadow = true;
    group.add(rightExtensionSegment);
    // Add rocks to right extension
    for (let z = -terrainLength / 2; z < terrainLength / 2; z += 20) { // Increased spacing
        const rockX = roadWidth / 2 + grassWidth * 1.5 + Math.random() * 20; // Increased random range
        const rock = createRock(rockX, z);
        group.add(rock);
    }
    group.position.z = zPosition;
    scene.add(group);
    // Create physics body for the entire segment
    const groundShape = new CANNON.Box(new CANNON.Vec3(totalWidth / 2, 0.1, terrainLength / 2));
    const groundBody = new CANNON.Body({
        mass: 0,
        material: groundPhysMaterial,
    });
    groundBody.addShape(groundShape);
    groundBody.position.set(0, -0.1, zPosition);
    world.addBody(groundBody);
    return {
        mesh: group,
        body: groundBody
    };
}

function createTrafficCone(x, z) {
    const coneMaterial = new THREE.SpriteMaterial({
        map: trafficConeTexture,
        transparent: true
    });
    const coneSprite = new THREE.Sprite(coneMaterial);
    const scale = 3;
    coneSprite.scale.set(scale, scale, 1);
    coneSprite.position.set(x, scale / 2, z);
    return coneSprite;
}

function createRock(x, z) {
    const rockMaterial = new THREE.SpriteMaterial({
        map: rockTexture,
        transparent: true
    });
    const rockSprite = new THREE.Sprite(rockMaterial);
    const scale = (3 + Math.random() * 2) * 4; // Random scale between 12 and 20 (4 times larger)
    rockSprite.scale.set(scale, scale, 1);
    rockSprite.position.set(x, scale / 2, z);
    return rockSprite;
}

function createTerrain() {
    for (let i = 0; i < numSegments; i++) {
        addTerrainSegment();
    }
}

function addTerrainSegment() {
    const lastSegment = terrainSegments[terrainSegments.length - 1];
    const zPosition = lastSegment ? lastSegment.mesh.position.z - terrainLength : 0;
    const segment = createTerrainSegment(zPosition);
    terrainSegments.push(segment);
}

function updateTerrain(deltaTime) {
    const scrollSpeed = characterConfig.groundSpeed; // Match the character's speed
    const firstSegment = terrainSegments[0];
    const lastSegment = terrainSegments[terrainSegments.length - 1];
    for (let segment of terrainSegments) {
        segment.mesh.position.z += scrollSpeed * deltaTime;
        segment.body.position.z += scrollSpeed * deltaTime;

        // Update grass texture scroll
        segment.mesh.children.forEach(child => {
            if (child.material && child.material.map === grassTexture) { // Added check for child.material
                child.material.map.offset.y += scrollSpeed * deltaTime / terrainLength;
            }
        });
    }
    // Add new segment if needed
    if (lastSegment.mesh.position.z > -terrainLength * 2) {
        addTerrainSegment();
    }
    // Remove first segment if it's far behind
    if (firstSegment.mesh.position.z > terrainLength) {
        scene.remove(firstSegment.mesh);
        world.removeBody(firstSegment.body);
        terrainSegments.shift();
    }
}

// Setup improved lighting system
const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(-50, 100, -50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 400;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
sunLight.shadow.bias = -0.001;
scene.add(sunLight);

// Add ambient light to simulate sky and ground bounce light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// =========================
// Character Integration
// =========================

// Variables for character
let character = null;
let characterBody = null;
let mixer = null;
let isGrounded = false;
let currentJumps = 0;
let lastJumpTime = 0;
let moveDirection = new THREE.Vector3();
let walkAction = null;
let idleAction = null;
let jumpAction = null;
let fallAction = null;
let contactNormal = new CANNON.Vec3();
let upAxis = new CANNON.Vec3(0, 1, 0);

const keysPressed = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    ArrowLeft: false,
    ArrowRight: false,
};

// Character configuration
const characterConfig = {
    // Movement settings
    groundSpeed: 50, // Increased from 30 to 50
    airSpeed: 40, // Increased from 25 to 40
    groundDamping: 0.1,
    airDamping: 0.1,
    acceleration: 30, // Increased from 20 to 30
    turnSpeed: 8,
    jumpForce: 12,
    jumpCooldown: 0.1,
    maxJumps: 1,

    // Physics settings
    radius: 2.5, // Collision shape radius
    height: 5, // Increased height to match model's visual height
    mass: 62,
    friction: 0.1,
    restitution: 0.0,
    linearDamping: 0.02,
    angularDamping: 0.9,

    // Visual and animation settings
    scale: 10,
    startHeight: 8,
};

// Define physics materials for character
const characterPhysMaterial = new CANNON.Material('character');

// Create contact material between character and ground
const characterGroundContact = new CANNON.ContactMaterial(
    characterPhysMaterial,
    groundPhysMaterial, {
        friction: 0.01,
        restitution: 0.0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
    }
);
world.addContactMaterial(characterGroundContact);
// Add keyboard event listeners
window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        keysPressed.space = true;
    } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        keysPressed[event.code] = true;
    } else if (keysPressed.hasOwnProperty(event.key.toLowerCase())) {
        keysPressed[event.key.toLowerCase()] = true;
    }
});
window.addEventListener('keyup', (event) => {
    if (event.code === 'Space') {
        keysPressed.space = false;
    } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        keysPressed[event.code] = false;
    } else if (keysPressed.hasOwnProperty(event.key.toLowerCase())) {
        keysPressed[event.key.toLowerCase()] = false;
    }
});

// Load the character model
const characterUrl = 'https://play.rosebud.ai/assets/3D_playground_character.glb?aDKK';
gltfLoader.load(characterUrl, (gltf) => {
    const model = gltf.scene;
    model.scale.set(
        characterConfig.scale,
        characterConfig.scale,
        characterConfig.scale
    );

    // Apply rotation correction if needed
    model.rotation.y = Math.PI; // Correcting the model's rotation

    // Adjust model's position so feet are on the ground
    model.position.set(0, 0, -10); // Move the model 10 units closer to the camera

    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) child.material.envMapIntensity = 1.0; // Added check for child.material
        }
    });

    // Create character physics body
    characterBody = new CANNON.Body({
        mass: characterConfig.mass,
        material: characterPhysMaterial,
        linearDamping: characterConfig.linearDamping,
        angularDamping: characterConfig.angularDamping,
        fixedRotation: true,
        type: CANNON.Body.DYNAMIC,
    });

    const characterShape = new CANNON.Cylinder(
        characterConfig.radius,
        characterConfig.radius,
        characterConfig.height,
        8
    );
    // Adjust shapeOffset to align collision shape with the character model
    const shapeOffset = new CANNON.Vec3(0, characterConfig.height / 2, 0);
    characterBody.addShape(characterShape, shapeOffset);
    characterBody.position.set(0, characterConfig.startHeight, -10); // Move the physics body 10 units closer to the camera
    world.addBody(characterBody);

    // Reset contact tracking
    isGrounded = false;
    let groundContactCount = 0;

    characterBody.addEventListener('collide', (event) => {
        const contact = event.contact;
        // let otherBody; // Not used, can be removed
        if (event.contact.bi === characterBody) {
            // otherBody = event.contact.bj; // Not used
            contact.ni.negate(contactNormal);
        } else {
            // otherBody = event.contact.bi; // Not used
            contactNormal.copy(contact.ni);
        }

        if (contactNormal.dot(upAxis) > 0.5) {
            groundContactCount++;
            isGrounded = true;
            currentJumps = 0;

            // Reset animations for ground state
            if (fallAction) {
                fallAction.stop();
                fallAction.setEffectiveWeight(0);
            }
            if (jumpAction) {
                jumpAction.stop();
                jumpAction.setEffectiveWeight(0);
            }
        }
    });

    characterBody.addEventListener('endContact', (event) => { // event.contact is not available on endContact directly
        // Re-evaluating ground contact more simply:
        // This part of cannon-es can be tricky. A common approach is to raycast downwards.
        // For simplicity here, we'll assume if no 'collide' event sets isGrounded, it might become false.
        // A more robust check would be needed for complex scenarios.
        // The previous logic for endContact with contactNormal might not be reliable as contact.ni is from the moment of collision.
        // For now, we'll rely on the 'collide' event to set isGrounded true.
        // The absence of 'collide' events that satisfy the ground condition will effectively make isGrounded false over time if the character is in the air.
        // A timeout or a check in the update loop could also manage isGrounded = false.
        // Let's tentatively set groundContactCount to 0 here, assuming if it's not actively colliding with ground, it's not grounded.
        // This is a simplification.
        groundContactCount = 0; // Simplified, might need a more robust solution
        isGrounded = false; // Assume not grounded unless a 'collide' event says otherwise

    });

    // Setup animations
    mixer = new THREE.AnimationMixer(model);

    const idleClip = gltf.animations.find((clip) => clip.name.toLowerCase().includes('idle'));
    const walkClip = gltf.animations.find((clip) => clip.name.toLowerCase().includes('walk'));
    const jumpClip = gltf.animations.find((clip) => clip.name.toLowerCase().includes('jump'));
    const fallClip = gltf.animations.find((clip) => clip.name.toLowerCase().includes('fall'));

    if (idleClip) {
        idleAction = mixer.clipAction(idleClip);
        idleAction.play();
        idleAction.setEffectiveWeight(1);
    }

    if (walkClip) {
        walkAction = mixer.clipAction(walkClip);
        walkAction.play();
        walkAction.setEffectiveWeight(0);
    }

    if (jumpClip) {
        jumpAction = mixer.clipAction(jumpClip);
        jumpAction.setLoop(THREE.LoopOnce);
        jumpAction.clampWhenFinished = true;
        jumpAction.setEffectiveWeight(0);
    }

    if (fallClip) {
        fallAction = mixer.clipAction(fallClip);
        fallAction.setLoop(THREE.LoopRepeat);
        fallAction.setEffectiveWeight(0);
    }

    character = model;
    scene.add(model);
});

let currentRotation = 0; // New variable to track current rotation
const rotationSpeed = 5; // Increased rotation speed for quicker response
const maxRotation = Math.PI / 8; // Reduced maximum rotation (22.5 degrees)
// Update character movement
function updateCharacterMovement(deltaTime) {
    if (!character || !characterBody) return;
    // Calculate move direction
    moveDirection.set(0, 0, 0);
    // Add movement input (only left and right)
    if (keysPressed.a || keysPressed.ArrowLeft) moveDirection.x = -1;
    if (keysPressed.d || keysPressed.ArrowRight) moveDirection.x = 1;
    // Ground movement
    if (isGrounded) {
        if (moveDirection.length() > 0) {
            // Apply full speed instantly
            characterBody.velocity.x = moveDirection.x * characterConfig.groundSpeed;
            // Calculate target rotation based on movement direction
            const targetRotation = moveDirection.x * maxRotation;
            // Smoothly interpolate current rotation towards target rotation
            currentRotation = THREE.MathUtils.lerp(currentRotation, targetRotation, deltaTime * rotationSpeed);
        } else {
            // Gradual deceleration when no keys are pressed
            characterBody.velocity.x *= 0.9; // Adjust this value for desired deceleration
            // Smoothly return to forward-facing rotation
            currentRotation = THREE.MathUtils.lerp(currentRotation, 0, deltaTime * rotationSpeed);
        }
        // Apply rotation to character model
        character.rotation.y = Math.PI + currentRotation; // Add Math.PI to keep the character facing forward
    } else {
        // Air movement (optional: you can add air control here if desired)
        characterBody.velocity.x += moveDirection.x * characterConfig.airSpeed * deltaTime;
        characterBody.velocity.x = THREE.MathUtils.clamp(characterBody.velocity.x, -characterConfig.groundSpeed, characterConfig.groundSpeed);
    }
    // Clamp character position to stay within the road
    const minX = -roadWidth / 2 + characterConfig.radius;
    const maxX = roadWidth / 2 - characterConfig.radius;
    if (characterBody.position.x < minX) {
        characterBody.position.x = minX;
        characterBody.velocity.x = 0; // Stop horizontal movement at the road boundary
    } else if (characterBody.position.x > maxX) {
        characterBody.position.x = maxX;
        characterBody.velocity.x = 0; // Stop horizontal movement at the road boundary
    }
    // Prevent movement onto grass (this logic seems redundant with the clamping above, but keeping it for now)
    if (Math.abs(characterBody.position.x) > (roadWidth / 2 - characterConfig.radius)) {
        // Push the character back onto the road
        const direction = characterBody.position.x > 0 ? -1 : 1; // This should be direction = characterBody.position.x > 0 ? 1 : -1; to correct
        characterBody.position.x = (roadWidth / 2 - characterConfig.radius) * (characterBody.position.x > 0 ? 1 : -1); // Corrected logic
        characterBody.velocity.x = 0;
    }
    // Keep the character's z position constant
    characterBody.position.z = 0;
    // Set the forward velocity to 0 (the ground will move instead)
    characterBody.velocity.z = 0;
    // Apply speed (always using road speed as character can't be on grass)
    // This seems redundant with the ground movement section.
    // if (isGrounded && moveDirection.length() > 0) {
    //     characterBody.velocity.x = moveDirection.x * characterConfig.groundSpeed;
    // }

    // Handle jumping
    if (keysPressed.space && isGrounded && currentJumps < characterConfig.maxJumps) {
        const now = performance.now();
        if (now - lastJumpTime > characterConfig.jumpCooldown * 1000) {
            characterBody.velocity.y = characterConfig.jumpForce;
            currentJumps++;
            lastJumpTime = now;
            isGrounded = false; // Character is no longer grounded after jumping

            if (jumpAction) {
                jumpAction.reset();
                jumpAction.setEffectiveWeight(1);
                jumpAction.play();
            }
             if (walkAction) walkAction.setEffectiveWeight(0); // Stop walk animation during jump
             if (idleAction) idleAction.setEffectiveWeight(0); // Stop idle animation during jump
        }
    }

    // Update animations
    if (mixer && idleAction && walkAction && jumpAction && fallAction) {
        const verticalVelocity = characterBody.velocity.y;
        // const horizontalSpeed = new THREE.Vector2(characterBody.velocity.x, characterBody.velocity.z).length(); // Not directly used for animation transitions here

        if (!isGrounded) {
            // Air state
            idleAction.setEffectiveWeight(0);
            walkAction.setEffectiveWeight(0);
            if (verticalVelocity > 0.1) { // Threshold for rising
                // Rising
                fallAction.setEffectiveWeight(0);
                jumpAction.setEffectiveWeight(1);
                if (!jumpAction.isRunning()) jumpAction.play();
            } else if (verticalVelocity < -0.1) { // Threshold for falling
                // Falling
                jumpAction.setEffectiveWeight(0);
                fallAction.setEffectiveWeight(1);
                 if (!fallAction.isRunning()) fallAction.play();
            } else {
                // Could be at apex or very slight vertical movement
                // Keep current jump/fall or transition to a brief apex animation if available
                // For simplicity, if neither significantly rising nor falling, maintain a falling or jump-loop animation
                if (jumpAction.getEffectiveWeight() > 0) {
                    // still in jump up phase or apex
                } else {
                    fallAction.setEffectiveWeight(1);
                    if (!fallAction.isRunning()) fallAction.play();
                }
            }
        } else {
            // Ground state (always running/walking)
            jumpAction.setEffectiveWeight(0);
            fallAction.setEffectiveWeight(0);
            idleAction.setEffectiveWeight(0); // Assuming always moving forward
            walkAction.setEffectiveWeight(1);
            if (!walkAction.isRunning()) walkAction.play();
            walkAction.setEffectiveTimeScale(1.0);
        }
    }
    // Update animation mixer
    if (mixer) {
        mixer.update(deltaTime);
    }
}

// Update camera (now using fixed position)
function updateCamera() {
    // Ensure camera is in the fixed position
    camera.position.copy(cameraConfig.position);
    if (character && characterBody) {
        // Look at the character's horizontal position, but keep the same y-level as before for lookAt
        camera.lookAt(new THREE.Vector3(characterBody.position.x, cameraConfig.lookAt.y, characterBody.position.z + cameraConfig.lookAt.z)); // Added characterBody.position.z
    } else {
        camera.lookAt(cameraConfig.lookAt);
    }
    // OrbitControls update if needed (though target is now dynamic)
    if (controls && characterBody) {
         controls.target.set(characterBody.position.x, cameraConfig.lookAt.y, characterBody.position.z + cameraConfig.lookAt.z);
         controls.update();
    }
}

// =========================
// End of Character Integration
// =========================

// Create initial scene
createTerrain(); // Renamed variable 'terrain' to avoid conflict with function name
// Create horizon line
function createHorizonLine() {
    const material = new THREE.LineBasicMaterial({
        color: 0xff0000
    });
    const points = [];
    points.push(new THREE.Vector3(-1000, 40, 0));
    points.push(new THREE.Vector3(1000, 40, 0));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const horizonLine = new THREE.Line(geometry, material);
    scene.add(horizonLine);
}
// Call the function to create the horizon line
// createHorizonLine(); // This might be too close or interfere with the skybox, optional

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = Math.min(clock.getDelta(), 0.1);
    const currentTime = performance.now();
    if (assetsLoaded) {
        world.step(deltaTime);
        updateCharacterMovement(deltaTime); // Update character movement
        updateCamera(); // Update camera (now fixed position)
        updateTerrain(deltaTime); // Update scrolling terrain
        updateBeerCollectibles(deltaTime); // Update beer collectibles
        updateBeerOrientation(); // Update beer sprite orientation

        // Handle Red heart spawning and movement
        if (!redHeart && currentTime - lastHeartSpawnTime > heartSpawnInterval) {
            createRedHeart();
            lastHeartSpawnTime = currentTime;
        }
        if (redHeart) {
            redHeart.mesh.position.z += characterConfig.groundSpeed * deltaTime;
            // Check for collection
            if (!redHeart.collected && character && characterBody) {
                const characterPosition = new THREE.Vector3(characterBody.position.x, characterBody.position.y + characterConfig.height / 2, characterBody.position.z); // Use center of character
                const heartPosition = redHeart.mesh.position;
                const distanceX = Math.abs(characterPosition.x - heartPosition.x);
                const distanceY = Math.abs(characterPosition.y - heartPosition.y);
                const distanceZ = Math.abs(characterPosition.z - (heartPosition.z)); // Z is relative to character's fixed Z

                // Adjust these values based on your character's size and the heart sprite size
                const collisionThresholdX = characterConfig.radius + 1; // Character radius + half heart width
                const collisionThresholdY = characterConfig.height / 2 + 1; // Half character height + half heart height
                const collisionThresholdZ = 2;
                if (distanceX < collisionThresholdX && distanceY < collisionThresholdY && distanceZ < collisionThresholdZ) {
                    redHeart.collected = true;
                    scene.remove(redHeart.mesh);
                    console.log("Red heart collected!");
                    // Add your collection logic here (e.g., increase health)
                    createRedFlash();
                    redHeart = null;
                }
            }
            // Remove heart if it's behind the camera
            if (redHeart && redHeart.mesh.position.z > camera.position.z) { // Check against camera's actual Z
                scene.remove(redHeart.mesh);
                redHeart = null;
            }
        }
        if (character && characterBody) {
            // Adjust the character model's position based on the physics body
            character.position.copy(characterBody.position);
            character.position.y -= characterConfig.height / 2; // Adjust for cylinder offset
        }
    }
    composer.render();
}

// Handle window resize
function onWindowResize() {
    const width = parentDiv.clientWidth;
    const height = parentDiv.clientHeight;
    // Update camera
    camera.aspect = width / height;
    // camera.fov = cameraConfig.fov; // FOV usually doesn't change on resize unless intended
    // camera.near = cameraConfig.near;
    // camera.far = cameraConfig.far;
    camera.updateProjectionMatrix();
    // Update renderer and composer
    renderer.setSize(width, height);
    composer.setSize(width, height);
    // Update post-processing passes
    if (bloomPass) bloomPass.resolution.set(width, height);
    if (smaaPass) smaaPass.setSize(width, height);
}

// Add event listeners
window.addEventListener('resize', onWindowResize);
const resizeObserver = new ResizeObserver(onWindowResize); // Keep if parentDiv can resize dynamically
if (parentDiv) resizeObserver.observe(parentDiv);

// Create score display
const scoreDisplay = document.createElement('div');
scoreDisplay.style.position = 'absolute';
scoreDisplay.style.top = '10px';
scoreDisplay.style.left = '10px';
scoreDisplay.style.color = 'white';
scoreDisplay.style.fontSize = '24px';
scoreDisplay.style.fontFamily = 'Arial, sans-serif';
scoreDisplay.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
if (parentDiv) parentDiv.appendChild(scoreDisplay);
// Function to update score display
function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score}`;
}
// Initial score display
updateScoreDisplay();
// Start animation
animate();
// Beer collectible system
const beerCollectibles = [];
const beerSpawnDistance = 50; // Increased from 30 to 50
const lanePositions = [-laneWidth, 0, laneWidth]; // Ensure laneWidth is defined
let lastBeerPosition = -beerSpawnDistance; // Initialize to spawn first beer correctly

// Red heart variables
let redHeart = null;
let lastHeartSpawnTime = 0;
const heartSpawnInterval = 20000; // Decreased from 30000 to 20000 (20 seconds)
function createRedHeart() {
    const heartMaterial = new THREE.SpriteMaterial({
        map: heartTexture,
        transparent: true
    });
    const heartSprite = new THREE.Sprite(heartMaterial);
    heartSprite.scale.set(2, 2, 1);
    const randomLaneIndex = Math.floor(Math.random() * lanePositions.length);
    heartSprite.position.set(lanePositions[randomLaneIndex], 2.5, -50); // Spawn 50 units ahead in a random lane
    scene.add(heartSprite);
    redHeart = {
        mesh: heartSprite,
        collected: false
    };
}

function createBeerCollectible(zPosition) {
    const beerMaterial = new THREE.SpriteMaterial({
        map: beerTexture,
        transparent: true
    });
    const beerSprite = new THREE.Sprite(beerMaterial);
    beerSprite.scale.set(2, 2, 1);
    const laneIndex = Math.floor(Math.random() * 3);
    beerSprite.position.set(lanePositions[laneIndex], 2.5, zPosition);
    scene.add(beerSprite);
    beerCollectibles.push({
        mesh: beerSprite,
        collected: false
    });
}

function updateBeerOrientation() {
    beerCollectibles.forEach(beer => {
        if (!beer.collected && beer.mesh.material) { // Added check for beer.mesh.material
            beer.mesh.material.rotation = 0; // Sprites face camera by default, rotation here is for texture within sprite if needed
        }
    });
}

function updateBeerCollectibles(deltaTime) {
    const scrollSpeed = characterConfig.groundSpeed;
    let i = beerCollectibles.length;
    while (i--) { // Iterate backwards for safe removal
        const beer = beerCollectibles[i];
        beer.mesh.position.z += scrollSpeed * deltaTime;

        // Remove beers that are behind the camera
        if (beer.mesh.position.z > camera.position.z) { // Check against camera's actual Z
            scene.remove(beer.mesh);
            beerCollectibles.splice(i, 1);
            continue; // Continue to next iteration
        }

        // Check for collection with improved collision detection
        if (!beer.collected && character && characterBody) {
            const characterPosition = new THREE.Vector3(characterBody.position.x, characterBody.position.y + characterConfig.height / 2, characterBody.position.z);
            const beerPosition = beer.mesh.position;
            const distanceX = Math.abs(characterPosition.x - beerPosition.x);
            const distanceY = Math.abs(characterPosition.y - beerPosition.y);
            const distanceZ = Math.abs(characterPosition.z - (beerPosition.z)); // Z is relative

            const collisionThresholdX = characterConfig.radius + 1;
            const collisionThresholdY = characterConfig.height / 2 + 1;
            const collisionThresholdZ = 2;

            if (distanceX < collisionThresholdX && distanceY < collisionThresholdY && distanceZ < collisionThresholdZ) {
                beer.collected = true;
                scene.remove(beer.mesh);
                beerCollectibles.splice(i, 1);
                console.log("Beer collected!");
                // Increment score and update display
                score += 10;
                updateScoreDisplay();
                // No need to continue here, as the item is removed
            }
        }
    }


    // Spawn new beers
    // Check the z-position of the furthest spawned beer, or initialize if no beers exist
    let furthestBeerZ = -Infinity; // Start with a very small number
    if (beerCollectibles.length > 0) {
        // Find the beer that is furthest away (most negative z)
        furthestBeerZ = beerCollectibles.reduce((minZ, beer) => Math.min(minZ, beer.mesh.position.z), 0);
    } else {
        // If no beers, we can consider the "last beer position" to be where the next one should start
        furthestBeerZ = lastBeerPosition; // Use the tracked lastBeerPosition
    }

    // If the furthest beer has scrolled forward enough, or if there are no beers, spawn a new one.
    // The condition `furthestBeerZ > lastBeerPosition - beerSpawnDistance` means:
    // if the "most negative Z" beer is now greater (further down the track, towards positive Z)
    // than the point where we last decided to spawn a beer (`lastBeerPosition`) minus the spawn distance.
    // This logic tries to maintain a certain density of beer.
    if (beerCollectibles.length === 0 || furthestBeerZ > (lastBeerPosition + beerSpawnDistance)) { // Corrected logic for spawning
        // Spawn the new beer ahead of the character
        // `lastBeerPosition` should track the Z where the *next* beer should be placed.
        // When spawning a new beer, it should be at some negative Z value far from the player.
        // Let's adjust `lastBeerPosition` to be the position of the newly created beer.
        const newBeerZ = -50 - Math.random() * 50; // Spawn between -50 and -100 units away
        createBeerCollectible(newBeerZ);
        lastBeerPosition = newBeerZ; // Update where the "last" one was spawned for the next check
    }
}
// Function to create red flash effect
function createRedFlash() {
    // Calculate the size of the plane to cover the entire viewport
    const distance = camera.near + 0.01; // Place it just in front of the near plane
    const vFov = camera.fov * Math.PI / 180; // Convert vertical fov to radians
    const height = 2 * Math.tan(vFov / 2) * distance; // Visible height at flash plane
    const width = height * camera.aspect; // Visible width at flash plane
    const flashGeometry = new THREE.PlaneGeometry(width, height);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.5,
        depthTest: false, // Ensure the flash is always visible
        depthWrite: false // Don't write to the depth buffer
    });
    const flashMesh = new THREE.Mesh(flashGeometry, flashMaterial);

    // Position the flash plane relative to the camera
    camera.add(flashMesh); // Add as a child of the camera
    flashMesh.position.set(0, 0, -distance); // Position in front of camera

    // Animate the flash
    const flashDuration = 0.5; // Duration of the flash in seconds
    const startTime = performance.now();

    function animateFlash() {
        const elapsedTime = (performance.now() - startTime) / 1000;
        if (elapsedTime < flashDuration) {
            const opacity = 0.5 * (1 - elapsedTime / flashDuration);
            flashMaterial.opacity = opacity;
            requestAnimationFrame(animateFlash);
        } else {
            camera.remove(flashMesh); // Remove from camera
            if (flashMaterial) flashMaterial.dispose();
            if (flashGeometry) flashGeometry.dispose();
        }
    }
    animateFlash();
}

// Call onWindowResize once to set initial sizes
onWindowResize();