// Import necessary modules
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/SMAAPass.js';
import * as Config from './config.js';

// Add score variable
let score = 0;

// Health system variables
let playerHealth = Config.gameplayConfig.initialPlayerHealth;
const maxPlayerHealth = Config.gameplayConfig.maxPlayerHealth;
let isInvincible = false;
let invincibilityTimer = null;

// Obstacle system variables
let obstacles = [];
// obstacleSpawnDistance is now Config.collectiblesConfig.obstacleSpawnDistance
let lastObstaclePosition = -Config.collectiblesConfig.obstacleSpawnDistance;
let isGameOver = false;

// Game Over Display
const gameOverDisplay = document.createElement('div');


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

// Style and append Game Over display
gameOverDisplay.style.position = 'absolute';
gameOverDisplay.style.top = '50%';
gameOverDisplay.style.left = '50%';
gameOverDisplay.style.transform = 'translate(-50%, -50%)';
gameOverDisplay.style.color = 'white';
gameOverDisplay.style.fontSize = '48px';
gameOverDisplay.style.fontFamily = 'Arial, sans-serif';
gameOverDisplay.style.textShadow = '3px 3px 6px rgba(0,0,0,0.7)';
gameOverDisplay.style.display = 'none'; // Initially hidden
gameOverDisplay.style.textAlign = 'center';
if (parentDiv) parentDiv.appendChild(gameOverDisplay);


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
    Config.cameraConfig.fov,
    canvas.offsetWidth / canvas.offsetHeight,
    Config.cameraConfig.near,
    Config.cameraConfig.far
);
// Camera configuration (Original local object removed)
// Set initial camera position and orientation
camera.position.set(Config.cameraConfig.position.x, Config.cameraConfig.position.y, Config.cameraConfig.position.z);
camera.lookAt(new THREE.Vector3(Config.cameraConfig.lookAt.x, Config.cameraConfig.lookAt.y, Config.cameraConfig.lookAt.z));
camera.fov = Config.cameraConfig.fov; // Already set in constructor, but kept for explicitness
camera.near = Config.cameraConfig.near; // Already set in constructor
camera.far = Config.cameraConfig.far;   // Already set in constructor
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
controls.minDistance = 10; // These could be added to config if desired
controls.maxDistance = 50; // These could be added to config if desired
controls.target = new THREE.Vector3(Config.cameraConfig.lookAt.x, Config.cameraConfig.lookAt.y, Config.cameraConfig.lookAt.z); // Target the configured lookAt

// Create scrolling terrain with 3 lanes
const terrainSegments = [];
const laneWidth = Config.terrainConfig.laneWidth;
const terrainLength = Config.terrainConfig.terrainLength;
const numSegments = Config.terrainConfig.numSegments;
const roadWidth = laneWidth * Config.terrainConfig.roadWidthMultiplier;
const grassWidth = Config.terrainConfig.grassWidth;
const totalWidth = roadWidth + grassWidth * 2;
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
    const scrollSpeed = Config.characterPhysicsConfig.groundSpeed; // Match the character's speed
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

// Character configuration (Original local object 'characterConfig' removed)

// Define physics materials for character
const characterPhysMaterial = new CANNON.Material('character'); // Name 'character' can be kept or configured

// Create contact material between character and ground
const characterGroundContact = new CANNON.ContactMaterial(
    characterPhysMaterial,
    groundPhysMaterial, {
        friction: Config.characterPhysicsConfig.friction,
        restitution: Config.characterPhysicsConfig.restitution,
        contactEquationStiffness: 1e8, // Default value, can be configured
        contactEquationRelaxation: 3,    // Default value, can be configured
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
        Config.characterSetup.scale,
        Config.characterSetup.scale,
        Config.characterSetup.scale
    );

    model.rotation.y = Config.characterSetup.modelRotationY;
    model.position.set(0, Config.characterSetup.modelOffsetY, Config.characterSetup.initialZ);

    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) child.material.envMapIntensity = 1.0; // Added check for child.material
        }
    });

    // Create character physics body
    characterBody = new CANNON.Body({
        mass: Config.characterPhysicsConfig.mass,
        material: characterPhysMaterial,
        linearDamping: Config.characterPhysicsConfig.linearDamping,
        angularDamping: Config.characterPhysicsConfig.angularDamping,
        fixedRotation: true,
        type: CANNON.Body.DYNAMIC,
    });

    const characterShape = new CANNON.Cylinder(
        Config.characterPhysicsConfig.radius,
        Config.characterPhysicsConfig.radius,
        Config.characterPhysicsConfig.height,
        8 // Segments for cylinder, can be configured
    );
    const shapeOffset = new CANNON.Vec3(0, Config.characterPhysicsConfig.height / 2, 0); // CANNON.Vec3 for offset
    characterBody.addShape(characterShape, shapeOffset);
    characterBody.position.set(0, Config.characterSetup.startHeight, Config.characterSetup.initialZ);
    world.addBody(characterBody);

    // Reset contact tracking
    isGrounded = false;
    let groundContactCount = 0; // This can likely be removed if not used elsewhere

    characterBody.addEventListener('collide', (event) => {
        // const contact = event.contact; // Keep if needed for other collision logic
        // // let otherBody; // Not used, can be removed
        // if (event.contact.bi === characterBody) {
        //     // otherBody = event.contact.bj; // Not used
        //     contact.ni.negate(contactNormal); // contactNormal also likely removable
        // } else {
        //     // otherBody = event.contact.bi; // Not used
        //     contactNormal.copy(contact.ni); // contactNormal also likely removable
        // }

        // if (contactNormal.dot(upAxis) > 0.5) { // upAxis also likely removable
            // groundContactCount++; // Not needed for raycast grounding
            // isGrounded = true; // Handled by raycast
            // currentJumps = 0; // Handled by raycast

            // Reset animations for ground state - This might still be relevant depending on how animations are triggered
            // For now, let's assume raycast handles ground state for animation triggers too via isGrounded.
            // If specific impact-based animation resets are needed, this part could be kept/modified.
            if (isGrounded) { // Check if raycast confirmed ground
                 if (fallAction) {
                    fallAction.stop();
                    fallAction.setEffectiveWeight(0);
                }
                if (jumpAction) {
                    jumpAction.stop();
                    jumpAction.setEffectiveWeight(0);
                }
            }
        // } // End of original contactNormal.dot(upAxis) check
    });

    // Removing 'endContact' listener as raycasting handles continuous ground check
    // characterBody.addEventListener('endContact', (event) => {
    //     groundContactCount = 0;
    //     isGrounded = false;
    // });

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
// const rotationSpeed = 5; // Now from Config.characterPhysicsConfig.visualRotationSpeed
// const maxRotation = Math.PI / 8; // Now from Config.characterPhysicsConfig.visualMaxRotation
// Update character movement
function updateCharacterMovement(deltaTime) {
    if (!character || !characterBody || isGameOver) return; // Added isGameOver check

    // Raycast ground detection
    const raycasterFeetOffset = 0.1; // Small offset to start ray slightly above very bottom
    const rayFrom = new CANNON.Vec3(
        characterBody.position.x,
        characterBody.position.y - Config.characterPhysicsConfig.height / 2 + raycasterFeetOffset,
        characterBody.position.z
    );
    const rayTo = new CANNON.Vec3(
        characterBody.position.x,
        characterBody.position.y - Config.characterPhysicsConfig.height / 2 - 0.2, // Ray extends 0.2 units below cylinder
        characterBody.position.z
    );
    const raycastResult = new CANNON.RaycastResult();
    world.raycastClosest(rayFrom, rayTo, { collisionFilterMask: -1 }, raycastResult);

    if (raycastResult.hasHit && raycastResult.body !== characterBody) {
        const groundNormal = raycastResult.hitNormalWorld;
        const upDirection = new CANNON.Vec3(0, 1, 0); // Assuming world up is Y
        if (groundNormal.dot(upDirection) > 0.7) { // Check if the surface is flat enough
            isGrounded = true;
            currentJumps = 0;
        } else {
            isGrounded = false; // Hit a steep slope or non-walkable surface
        }
    } else {
        isGrounded = false; // No hit or hit self
    }

    // Calculate move direction
    moveDirection.set(0, 0, 0);
    // Add movement input (only left and right)
    if (keysPressed.a || keysPressed.ArrowLeft) moveDirection.x = -1;
    if (keysPressed.d || keysPressed.ArrowRight) moveDirection.x = 1;

    const currentVisualMaxRotation = Config.characterPhysicsConfig.visualMaxRotation;
    const currentVisualRotationSpeed = Config.characterPhysicsConfig.visualRotationSpeed;

    // Ground movement
    if (isGrounded) {
        if (moveDirection.x !== 0) { // Check x component directly
            characterBody.velocity.x = moveDirection.x * Config.characterPhysicsConfig.groundSpeed;
            const targetRotation = moveDirection.x * currentVisualMaxRotation;
            currentRotation = THREE.MathUtils.lerp(currentRotation, targetRotation, deltaTime * currentVisualRotationSpeed);
        } else {
            // Gradual deceleration
            characterBody.velocity.x *= (1 - Config.characterPhysicsConfig.groundDamping); // Apply damping factor
            currentRotation = THREE.MathUtils.lerp(currentRotation, 0, deltaTime * currentVisualRotationSpeed);
        }
        character.rotation.y = Config.characterSetup.modelRotationY + currentRotation;
    } else {
        // Air movement
        characterBody.velocity.x += moveDirection.x * Config.characterPhysicsConfig.airSpeed * Config.characterPhysicsConfig.acceleration * deltaTime;
        characterBody.velocity.x = THREE.MathUtils.clamp(characterBody.velocity.x, -Config.characterPhysicsConfig.groundSpeed, Config.characterPhysicsConfig.groundSpeed);
        // Optional: Air rotation
        const targetRotation = moveDirection.x * currentVisualMaxRotation;
        currentRotation = THREE.MathUtils.lerp(currentRotation, targetRotation, deltaTime * currentVisualRotationSpeed * 0.5); // Slower air rotation
        character.rotation.y = Config.characterSetup.modelRotationY + currentRotation;
    }

    // 3. Clamp Horizontal Position
    const minX = -roadWidth / 2 + Config.characterPhysicsConfig.radius;
    const maxX = roadWidth / 2 - Config.characterPhysicsConfig.radius;
    if (characterBody.position.x < minX) {
        characterBody.position.x = minX;
        characterBody.velocity.x = 0;
    } else if (characterBody.position.x > maxX) {
        characterBody.position.x = maxX;
        characterBody.velocity.x = 0;
    }

    // 4. Manage Z-Position (Character stays fixed, world moves)
    characterBody.position.z = Config.characterSetup.initialZ;
    characterBody.velocity.z = 0;

    // 5. Handle Jumping
    if (keysPressed.space && isGrounded && currentJumps < Config.characterPhysicsConfig.maxJumps) {
        const now = performance.now();
        if (now - lastJumpTime > Config.characterPhysicsConfig.jumpCooldown * 1000) {
            characterBody.velocity.y = Config.characterPhysicsConfig.jumpForce;
            currentJumps++;
            lastJumpTime = now;
            isGrounded = false; // Character is no longer grounded after jumping

            if (jumpAction) {
                jumpAction.reset();
                jumpAction.setEffectiveWeight(1);
                jumpAction.play();
            }
            if (walkAction) walkAction.setEffectiveWeight(0);
            if (idleAction) idleAction.setEffectiveWeight(0);
        }
    }

    // 6. Update Animations (based on isGrounded, velocity.y)
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
    // Ensure camera is in the fixed position (already set, but if dynamic changes were allowed, this would re-assert)
    camera.position.set(Config.cameraConfig.position.x, Config.cameraConfig.position.y, Config.cameraConfig.position.z);
    if (character && characterBody) {
        // Look at a point slightly in front of the character, adjusted by initialZ and lookAt Z offset
        controls.target.set(characterBody.position.x, Config.cameraConfig.lookAt.y, characterBody.position.z + Config.cameraConfig.lookAt.z - Config.characterSetup.initialZ);
        camera.lookAt(controls.target);
    } else {
        // Default lookAt if character not loaded
        const defaultLookAt = new THREE.Vector3(Config.cameraConfig.lookAt.x, Config.cameraConfig.lookAt.y, Config.cameraConfig.lookAt.z);
        controls.target.copy(defaultLookAt);
        camera.lookAt(defaultLookAt);
    }
    controls.update(); // Update controls in all cases
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

    if (assetsLoaded && !isGameOver) { // Check !isGameOver here
        world.step(deltaTime);
        updateCharacterMovement(deltaTime); // Update character movement
        updateTerrain(deltaTime); // Update scrolling terrain
        updateBeerCollectibles(deltaTime); // Update beer collectibles
        updateBeerOrientation(); // Update beer sprite orientation
        updateObstacles(deltaTime); // Add call to update obstacles

        // Handle Red heart spawning and movement
        if (!redHeart && currentTime - lastHeartSpawnTime > Config.collectiblesConfig.heartSpawnInterval) {
            createRedHeart();
            lastHeartSpawnTime = currentTime;
        }
        if (redHeart) {
            redHeart.mesh.position.z += Config.characterPhysicsConfig.groundSpeed * deltaTime;
            // Check for collection
            if (!redHeart.collected && character && characterBody) {
                const charPos = new THREE.Vector3(characterBody.position.x, characterBody.position.y + Config.characterPhysicsConfig.height / 2, characterBody.position.z);
                const heartPos = redHeart.mesh.position;
                const distCheckX = Math.abs(charPos.x - heartPos.x);
                const distCheckY = Math.abs(charPos.y - heartPos.y);
                const distCheckZ = Math.abs(charPos.z - heartPos.z);

                const heartCollisionThresholdX = Config.characterPhysicsConfig.radius + redHeart.mesh.scale.x / 2; // Assuming heart scale is 1 or 2
                const heartCollisionThresholdY = Config.characterPhysicsConfig.height / 2 + redHeart.mesh.scale.y / 2;
                const heartCollisionThresholdZ = 2; // Can be configured

                if (distCheckX < heartCollisionThresholdX && distCheckY < heartCollisionThresholdY && distCheckZ < heartCollisionThresholdZ) {
                    console.log("Red heart collected!");
                    if (playerHealth < maxPlayerHealth) { // maxPlayerHealth is already from Config
                        playerHealth += Config.collectiblesConfig.redHeartValue;
                        if (playerHealth > maxPlayerHealth) playerHealth = maxPlayerHealth; // Cap health
                    }
                    updateHealthDisplay();
                    createRedFlash();
                    // Original logic to remove heart
                    redHeart.collected = true;
                    scene.remove(redHeart.mesh);
                    redHeart = null;
                }
            }
            // Remove heart if it's behind the camera
            if (redHeart && redHeart.mesh.position.z > camera.position.z) { // Check against camera's actual Z
                scene.remove(redHeart.mesh);
                redHeart = null;
            }
        }
    } // End of if (assetsLoaded && !isGameOver)

    // These should still run even if game is over to update camera and character model position
    if (assetsLoaded) {
      updateCamera();
      if (character && characterBody) {
          // Adjust the character model's position based on the physics body
          character.position.copy(characterBody.position);
          character.position.y -= Config.characterPhysicsConfig.height / 2; // Adjust for cylinder offset
          character.position.y += Config.characterSetup.modelOffsetY; // Apply model specific Y offset
      }
    }

    composer.render(); // Render pass should always happen to show game over screen
}

// Handle window resize
function onWindowResize() {
    const width = parentDiv.clientWidth;
    const height = parentDiv.clientHeight;
    // Update camera
    camera.aspect = width / height;
    // camera.fov = Config.cameraConfig.fov; // FOV usually doesn't change on resize unless intended
    // camera.near = Config.cameraConfig.near;
    // camera.far = Config.cameraConfig.far;
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

// Create health display
const healthDisplay = document.createElement('div');
healthDisplay.style.position = 'absolute';
healthDisplay.style.top = '10px';
healthDisplay.style.right = '10px';
healthDisplay.style.color = 'white';
healthDisplay.style.fontSize = '24px';
healthDisplay.style.fontFamily = 'Arial, sans-serif';
healthDisplay.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
if (parentDiv) parentDiv.appendChild(healthDisplay);

// Function to update health display
function updateHealthDisplay() {
    healthDisplay.textContent = 'Health: ' + '❤️'.repeat(playerHealth);
}

// Initial score and health display
updateScoreDisplay();
updateHealthDisplay();

// Start animation
animate();

// Obstacle System
function createObstacle(zPosition) {
    const obstacleMaterial = new THREE.SpriteMaterial({ map: rockTexture, transparent: true });
    const obstacleSprite = new THREE.Sprite(obstacleMaterial);
    obstacleSprite.scale.set(4, 4, 1); // Adjust scale as needed
    const laneIndex = Math.floor(Math.random() * 3);
    obstacleSprite.position.set(lanePositions[laneIndex], obstacleSprite.scale.y / 2, zPosition); // Position on ground
    scene.add(obstacleSprite);
    obstacles.push({ mesh: obstacleSprite, collected: false }); // 'collected' means 'hit' here
}

function updateObstacles(deltaTime) {
    if (isGameOver) return;

    const scrollSpeed = Config.characterPhysicsConfig.groundSpeed;
    let i = obstacles.length;
    while (i--) { // Iterate backwards for safe removal
        const obstacle = obstacles[i];
        obstacle.mesh.position.z += scrollSpeed * deltaTime;

        // Remove obstacles that are behind the camera
        if (obstacle.mesh.position.z > camera.position.z + 20) { // Add some buffer
            scene.remove(obstacle.mesh);
            obstacles.splice(i, 1);
            continue;
        }

        // Collision Detection
        if (!obstacle.collected && character && characterBody) {
            const charPos = new THREE.Vector3(characterBody.position.x, characterBody.position.y + Config.characterPhysicsConfig.height / 2, characterBody.position.z);
            const obsPos = obstacle.mesh.position;
            const obsScale = obstacle.mesh.scale;

            const distCheckX = Math.abs(charPos.x - obsPos.x);
            const distCheckY = Math.abs(charPos.y - obsPos.y);
            const distCheckZ = Math.abs(charPos.z - obsPos.z);

            const obsCollisionThresholdX = Config.characterPhysicsConfig.radius + obsScale.x / 2 * 0.8; // Leniency factor can be configured
            const obsCollisionThresholdY = Config.characterPhysicsConfig.height / 2 + obsScale.y / 2 * 0.8;
            const obsCollisionThresholdZ = 1.5; // Can be configured

            if (distCheckX < obsCollisionThresholdX && distCheckY < obsCollisionThresholdY && distCheckZ < obsCollisionThresholdZ) {
                console.log("Obstacle hit!");
                if (isInvincible) return;

                obstacle.collected = true; // Mark as hit
                scene.remove(obstacle.mesh);
                obstacles.splice(i, 1); // Remove from array (since iterating backwards, this is safe)

                playerHealth--;
                updateHealthDisplay();
                createRedFlash(); // Visual feedback for hit

                if (playerHealth <= 0) {
                    if (!isGameOver) { // Prevent multiple game over triggers
                        isGameOver = true;
                        gameOverDisplay.innerHTML = `Game Over!<br>Score: ${score}<br><small>(Refresh to play again)</small>`;
                        gameOverDisplay.style.display = 'flex';
                        console.log("Health depleted. Game Over.");
                    }
                    return; // Exit, game is over
                } else { // Hit, but not game over
                    isInvincible = true;
                    if (invincibilityTimer) clearTimeout(invincibilityTimer); // Clear existing timer
                    invincibilityTimer = setTimeout(() => {
                        isInvincible = false;
                        console.log("Invincibility ended");
                    }, Config.gameplayConfig.invincibilityDuration);
                }
                // Do not return here if game is not over, allow other obstacles to be processed if necessary
                // (though typically one collision per frame is enough to handle)
                // The splice already adjusted the loop, so 'continue' might be good if we want to ensure only one hit per frame fully processes.
                // For now, this is fine as player becomes invincible.
            }
        }
    }

    // Spawn new obstacles
    let furthestObstacleZ = -Infinity;
    if (obstacles.length > 0) {
        furthestObstacleZ = obstacles.reduce((minZ, obs) => Math.min(minZ, obs.mesh.position.z), 0);
    } else {
        furthestObstacleZ = lastObstaclePosition; // Use the tracked lastObstaclePosition if no obstacles exist
    }

    if (obstacles.length < 10 && (obstacles.length === 0 || furthestObstacleZ > (lastObstaclePosition + Config.collectiblesConfig.obstacleSpawnDistance))) { // Limit total obstacles on screen (10 can be configured)
        const newObstacleZ = -Config.collectiblesConfig.obstacleSpawnDistance - Math.random() * Config.collectiblesConfig.obstacleSpawnDistance; // Spawn further ahead
        createObstacle(newObstacleZ);
        lastObstaclePosition = newObstacleZ;
    }
}

// Beer collectible system
const beerCollectibles = [];
// beerSpawnDistance is from Config.collectiblesConfig.beerSpawnDistance
const lanePositions = [-Config.terrainConfig.laneWidth, 0, Config.terrainConfig.laneWidth];
let lastBeerPosition = -Config.collectiblesConfig.beerSpawnDistance;

// Red heart variables
let redHeart = null;
let lastHeartSpawnTime = 0;
// heartSpawnInterval is from Config.collectiblesConfig.heartSpawnInterval
function createRedHeart() {
    const heartMaterial = new THREE.SpriteMaterial({
        map: heartTexture,
        transparent: true
    });
    const heartSprite = new THREE.Sprite(heartMaterial);
    heartSprite.scale.set(2, 2, 1); // Scale can be configured
    const randomLaneIndex = Math.floor(Math.random() * lanePositions.length);
    // Spawn consistently ahead, like beers/obstacles. Using beerSpawnDistance as a generic "collectible spawn distance from player"
    heartSprite.position.set(lanePositions[randomLaneIndex], 2.5, -Config.collectiblesConfig.beerSpawnDistance);
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
    const scrollSpeed = Config.characterPhysicsConfig.groundSpeed;
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
            const charPos = new THREE.Vector3(characterBody.position.x, characterBody.position.y + Config.characterPhysicsConfig.height / 2, characterBody.position.z);
            const beerPos = beer.mesh.position;
            const distCheckX = Math.abs(charPos.x - beerPos.x);
            const distCheckY = Math.abs(charPos.y - beerPos.y);
            const distCheckZ = Math.abs(charPos.z - beerPos.z);

            const beerCollisionThresholdX = Config.characterPhysicsConfig.radius + beer.mesh.scale.x / 2; // Assuming beer scale 1 or 2
            const beerCollisionThresholdY = Config.characterPhysicsConfig.height / 2 + beer.mesh.scale.y / 2;
            const beerCollisionThresholdZ = 2; // Can be configured

            if (distCheckX < beerCollisionThresholdX && distCheckY < beerCollisionThresholdY && distCheckZ < beerCollisionThresholdZ) {
                beer.collected = true;
                scene.remove(beer.mesh);
                beerCollectibles.splice(i, 1);
                console.log("Beer collected!");
                score += Config.collectiblesConfig.beerScoreValue;
                updateScoreDisplay();
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
    // Ensure game is not over before spawning new beer
    if (!isGameOver &&
        (beerCollectibles.length === 0 || furthestBeerZ > (lastBeerPosition + Config.collectiblesConfig.beerSpawnDistance))) {
        const newBeerZ = -Config.collectiblesConfig.beerSpawnDistance - Math.random() * Config.collectiblesConfig.beerSpawnDistance; // Spawn further ahead
        createBeerCollectible(newBeerZ);
        lastBeerPosition = newBeerZ;
    }
}
// Function to create red flash effect
function createRedFlash() {
    // Calculate the size of the plane to cover the entire viewport
    const distance = Config.cameraConfig.near + 0.01;
    const vFov = Config.cameraConfig.fov * Math.PI / 180;
    const height = 2 * Math.tan(vFov / 2) * distance;
    const width = height * camera.aspect;
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