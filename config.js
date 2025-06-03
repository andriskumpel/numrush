// config.js
export const cameraConfig = {
    position: { x: 0, y: 15, z: 30 },
    lookAt: { x: 0, y: 5, z: -20 },
    fov: 75,
    near: 0.1,
    far: 1000
};

export const terrainConfig = {
    laneWidth: 8,
    terrainLength: 300,
    numSegments: 4,
    roadWidthMultiplier: 3, // roadWidth will be laneWidth * roadWidthMultiplier
    grassWidth: 100,
};

export const characterSetup = { // Contains visual/initial setup rather than physics properties
    scale: 10,
    startHeight: 8, // Initial Y position for the character body
    modelRotationY: Math.PI, // Initial rotation for the character model
    modelOffsetY: 0, // If model pivot isn't at its feet, adjust this
    initialZ: -10 // Initial Z position for character and body
};

export const characterPhysicsConfig = {
    groundSpeed: 50,
    airSpeed: 40,
    groundDamping: 0.1, // This might not be directly used by Cannon-es in the current setup
    airDamping: 0.1,   // This might not be directly used
    acceleration: 30,
    turnSpeed: 8,      // Controls model's visual turn, not physics body directly
    jumpForce: 12,
    jumpCooldown: 0.1, // seconds
    maxJumps: 1,
    radius: 2.5,       // Collision shape radius
    height: 5,         // Collision shape height
    mass: 62,
    friction: 0.1,     // Material friction
    restitution: 0.0,  // Material restitution
    linearDamping: 0.02, // Body linear damping
    angularDamping: 0.9, // Body angular damping
    visualMaxRotation: Math.PI / 8, // Max visual rotation tilt
    visualRotationSpeed: 5,       // Speed of visual rotation lerp
};

export const collectiblesConfig = {
    beerSpawnDistance: 50,
    heartSpawnInterval: 20000, // ms
    obstacleSpawnDistance: 60,
    redHeartValue: 1, // How much health a heart gives
    beerScoreValue: 10
};

export const gameplayConfig = {
    initialPlayerHealth: 3,
    maxPlayerHealth: 5,
    invincibilityDuration: 2000 // ms
};
