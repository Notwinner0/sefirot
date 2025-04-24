import * as THREE from 'three';
import { ArcballControls } from 'three/addons/controls/ArcballControls.js';

let globalGameState = 0;
const gameAnswer = 5; // Game rebalancing seed

function initGameClicker() {
    let score = 0;
    const container = document.querySelector('.container');
    const helloText = document.querySelector('.hello');
    const scoreDisplay = document.createElement('div');

    scoreDisplay.classList.add('score');
    container.appendChild(scoreDisplay);

    helloText.addEventListener('click', gameClick);

    function gameClick() {
        score++;
        scoreDisplay.innerText = score;
        if (score >= gameAnswer) {
            globalGameState = 1;
            helloText.removeEventListener('click', gameClick);
            changeGameState(globalGameState);
            container.style.animation = 'fadeOut 5s linear forwards';
            // Removed commented-out sleep logic
        }
    }
}

function initGameIdle() {
    // Selects the element with the class 'hello' and stores it in the 'helloText' variable
    const helloText = document.querySelector('.hello');
    // Assigns the 'helloText' element to the 'block' variable (seems redundant)
    const block = helloText;
    // Selects the element with the class 'score' and stores it in the 'scoreDisplay' variable
    const scoreDisplay = document.querySelector('.score');

    // Initializes the score to 0
    let score = 0;
    // Sets the initial x and y coordinates of the block
    let x = 100;
    let y = 100;
    // Sets the initial velocity in the x and y directions
    let dx = 1; // Slightly faster
    let dy = 1;

    // Gets the width and height of the block element
    const blockWidth = block.offsetWidth;
    const blockHeight = block.offsetHeight;
    // Selects the container element
    const container = document.querySelector('.container');

    // Defines the game loop function
    function gameLoop() {
        // Updates the score display
        scoreDisplay.innerText = score;
        // Gets the width and height of the window
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Collision detection: Reverses the direction of movement if the block hits a wall
        if (x + blockWidth > windowWidth || x < 0) {
            dx = -dx;
            score++;
        }
        if (y + blockHeight > windowHeight || y < 0) {
            dy = -dy;
            score++;
        }

        // Updates the position of the block
        x += dx; // Short notation for x = x + dx
        y += dy;

        // Updates the CSS styles of the block to reflect the new position
        block.style.left = `${x}px`;
        block.style.top = `${y}px`;

        // Checks if the score has exceeded a certain threshold (gameAnswer)
        if (score > gameAnswer) {
            // Sets the global game state to 2
            globalGameState = 2;
            // Removes the click event listener from the helloText element
            helloText.removeEventListener('click', idleGameClick);

            container.style.animation = 'fadeOut 5s linear forwards';

            sleep(5000).then(() => {
                helloText.remove();
                // container.remove();
                // scoreDisplay.remove();
                changeGameState(globalGameState); // Changes the game state
            })
        } else {
            // Requests the browser to call the gameLoop function again in the next animation frame
            requestAnimationFrame(gameLoop);
        }
    }

    // Defines a function to handle clicks on the helloText element
    function idleGameClick() {
        // Increases the velocity of the block
        dx *= 1.5;
        dy *= 1.5;
    }

    // Defines a function to rewind the game
    function rewindGame() {
        // Displays the helloText element
        helloText.style.display = 'block';
        // Applies a fade-in animation to the container element
        container.style.animation = 'fadeIn 5s linear forwards';
    }

    // Sleeps for 25 seconds and then rewinds the game
    sleep(5000).then(() => {
        rewindGame();
        // Adds the click event listener to the helloText element
        helloText.addEventListener('click', idleGameClick);
        // Starts the game loop
        requestAnimationFrame(gameLoop);
    });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function offline() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    let speed = -0.001;

    function animate() {
        cube.rotation.x += speed;
        cube.scale.z += speed / 5;
        speed += 0.00001;

        cube.rotation.y += 0.05;

        renderer.render(scene, camera);
    }
}

function initGameReate() {
    console.log('Initializing Game Stage 3 (Reate)');

    // Creates a WebGLRenderer instance with anti-aliasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 3;
    renderer.domElement.style.background = 'radial-gradient(circle, rgba(173, 181, 189, 0.5) 50%, rgba(33, 37, 41, 0.5) 100%)';
    renderer.domElement.style.animation = 'fadeIn 5s linear forwards';
    document.body.appendChild(renderer.domElement);

    // Sets up the camera perspective
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 5; // Camera stays relatively close to the origin/cube
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    // Positions the camera 2 units back from the scene center initially
    const initialCameraDistance = 2;
    camera.position.z = initialCameraDistance;

    // Creates a new scene
    const scene = new THREE.Scene();

    // Adds a directional light to the scene
    let directionalLight;
    {
        const color = 0xffffff;
        const intensity = 3;
        directionalLight = new THREE.DirectionalLight(color, intensity);
        directionalLight.position.set(-1, 2, 4);
    }

    // Adds ambient light to the scene
    let ambientLight;
    {
        const color = 0xffffff;
        const intensity = 2;
        ambientLight = new THREE.AmbientLight(color, intensity);
    }

    // Определяем размеры геометрии куба
    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    // Declare array to store positions of spawned cubes for proximity check
    const spawnedCubePositions = [];
    // Declare array to store the actual spawned cube Mesh objects for cleanup
    const spawnedCubes = [];
    const spawnRadius = 0.08; // Minimum distance between spawned cubes (smaller for denser trail)

    // Variable to hold the target marker cube
    let targetMarkerCube = null;
    // FIX: Adjusted target marker size to be slightly larger than trail cubes
    const targetMarkerSize = 0.3; // Scale factor for the target marker cube

    // Raycaster for detecting intersection with the cube (used for spawning trail cubes)
    const trailRaycaster = new THREE.Raycaster();

    // Raycaster for placing the target marker (from camera to target point) - No longer needed for placement
    // const targetRaycaster = new THREE.Raycaster();


    // Function to create a new mesh instance
    // Modified to accept x, y, z coordinates and optional scale
    function makeInstance(geometry, color, x, y, z, scale = 1) {
        const material = new THREE.MeshPhongMaterial({
            color
        });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        cube.position.set(x, y, z); // Set position using set method
        cube.scale.set(scale, scale, scale); // Set scale
        return cube;
    }

    // Creates the main black cube
    const cubes = [
        makeInstance(geometry, 0x000000, 0, 0, 0) // Initial black cube at the origin
    ];
    // spawnedCubePositions.push(cubes[0].position.clone()); // Do not add the main cube to spawned positions

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Helper function to convert degrees to radians
    function degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    // Helper function to convert Lat/Lon to Cartesian coordinates on a sphere of given radius
    // Adjusted for THREE.js Y-up convention
    function latLonToCartesian(latitude, longitude, radius) {
        const latRad = degreesToRadians(latitude); // Angle from XZ plane towards Y
        const lonRad = degreesToRadians(longitude); // Angle in XZ plane from +X

        const x = radius * Math.cos(latRad) * Math.cos(lonRad);
        const y = radius * Math.sin(latRad); // Y is vertical based on latitude
        const z = radius * Math.cos(latRad) * Math.sin(lonRad);

        return new THREE.Vector3(x, y, z); // Return a Three.js Vector3
    }

    // Function to calculate the point on the surface of a 1x1x1 cube based on spherical coordinates
    function sphericalToCubeSurface(latitude, longitude) {
        const sphericalPoint = latLonToCartesian(latitude, longitude, 1); // Point on unit sphere

        let x = sphericalPoint.x;
        let y = sphericalPoint.y;
        let z = sphericalPoint.z;

        // Find the dominant axis
        const absX = Math.abs(x);
        const absY = Math.abs(y);
        const absZ = Math.abs(z);

        let face = '';
        let scale = 0;

        if (absX >= absY && absX >= absZ) {
            // Project onto X face
            face = (x > 0) ? '+x' : '-x';
            scale = 0.5 / absX; // Scale to make the dominant coordinate 0.5
        } else if (absY >= absX && absY >= absZ) {
            // Project onto Y face
            face = (y > 0) ? '+y' : '-y';
            scale = 0.5 / absY;
        } else {
            // Project onto Z face
            face = (z > 0) ? '+z' : '-z';
            scale = 0.5 / absZ;
        }

        // Scale the point to be on the surface of the 1x1x1 cube
        const cubeSurfacePoint = new THREE.Vector3(x * scale, y * scale, z * scale);

        // Determine the normal for orientation (based on the face)
        let normal = new THREE.Vector3();
        switch (face) {
            case '+x': normal.set(1, 0, 0); break;
            case '-x': normal.set(-1, 0, 0); break;
            case '+y': normal.set(0, 1, 0); break;
            case '-y': normal.set(0, -1, 0); break;
            case '+z': normal.set(0, 0, 1); break;
            case '-z': normal.set(0, 0, -1); break;
        }

        return { position: cubeSurfacePoint, normal: normal };
    }


    // Function to update or create the target marker cube
    function updateTargetMarker(targetLatitude, targetLongitude) {
        // Calculate the position directly on the cube surface
        const cubeSurfaceData = sphericalToCubeSurface(targetLatitude, targetLongitude);
        const intersectionPoint = cubeSurfaceData.position;
        const faceNormal = cubeSurfaceData.normal;

        if (targetMarkerCube) {
            // Update existing marker cube position and scale
            targetMarkerCube.position.copy(intersectionPoint);
            targetMarkerCube.scale.set(targetMarkerSize, targetMarkerSize, targetMarkerSize);
            targetMarkerCube.visible = true; // Ensure it's visible
        } else {
            // Create the marker cube if it doesn't exist
            targetMarkerCube = makeInstance(geometry, 0xffff00, // Yellow color
                intersectionPoint.x, intersectionPoint.y, intersectionPoint.z,
                targetMarkerSize // Apply larger scale
            );
        }

        // Orient the marker to face outwards from the cube surface at the calculated point
        const lookAtPosition = intersectionPoint.clone().add(faceNormal);
        targetMarkerCube.lookAt(lookAtPosition);
        // Adjust rotation if necessary to align the marker's 'up' direction
        // This might require more complex alignment depending on the marker's geometry and desired orientation.
        // For a simple cube marker, lookAt towards intersectionPoint + normal should be sufficient to face outwards.

        // console.log("Updated target marker position on cube surface:", intersectionPoint); // Keep this for debugging if needed
    }


    // Helper function to check if camera position (on sphere) is within a target circle (on sphere)
    function isCameraInsideCircleLatLon(cameraPosition, circleLatitude, circleLongitude, circleAngularRadius) {
        // Convert latitude and longitude of the circle center to Cartesian direction on a unit sphere
        const circleCenterDirection = latLonToCartesian(circleLatitude, circleLongitude, 1).normalize();

        // Get the normalized direction of the camera from the origin
        const cameraDirection = cameraPosition.clone().normalize();

        // Calculate the dot product (cosine of the angle) between the two normalized vectors
        const dotProduct = cameraDirection.dot(circleCenterDirection);

        // Calculate the angular distance (angle) between the camera direction and the circle center direction
        // Ensure dotProduct is within [-1, 1] due to floating-point inaccuracies.
        const angle = Math.acos(Math.min(Math.max(dotProduct, -1), 1));

        // Check if the angular distance is less than or equal to the circle angular radius
        return angle <= circleAngularRadius;
    }


    // Flag to track if the camera has already been randomized after entering the circle
    let cameraRandomized = false;

    // Main rendering loop
    function render(time) {
        time *= 0.001;

        // Обновляем контроллеры в цикле рендеринга
        controls.update();

        // Рендерим сцену
        renderer.render(scene, camera);

        // Просим браузер вызвать функцию рендеринга снова на следующем кадре анимации
        requestAnimationFrame(render);
    }

    window.addEventListener('resize', onWindowResize);
    const controls = new ArcballControls(camera, renderer.domElement, scene);
    controls.setCamera(camera); // Ensure controls are linked to the camera
    controls.target.set(0, 0, 0); // Set controls target to the center of the main cube
    controls.update(); // Update controls to apply the target

    let currentCircleLatitude = getRandomArbitrary(-90, 90); // Randomize initial target
    let currentCircleLongitude = getRandomArbitrary(-180, 180); // Randomize initial target

    // The radius for the *spherical* winning condition check
    const circleRadius = 0.5; // This seems like an angular radius in radians based on usage

    let s = 0; // Score variable

    const container = document.querySelector('.container');
    const scoreDisplay = document.querySelector('.score');
    scoreDisplay.innerText = '0';

    // Initial setup for score display size and rotation
    if (window.innerWidth < window.innerHeight) {
        scoreDisplay.style.fontSize = '130vw';
        scoreDisplay.style.rotate = '90deg';
    } else {
        scoreDisplay.style.fontSize = '100vh';
    }

    // Initial update of the target marker cube
    updateTargetMarker(currentCircleLatitude, currentCircleLongitude);


    controls.addEventListener('end', () => {
        // Renderer render is already called in the render loop

        const isInside = isCameraInsideCircleLatLon(
            camera.position,
            currentCircleLatitude,
            currentCircleLongitude,
            circleRadius
        );

        if (isInside && !cameraRandomized) {
            console.log("Camera is inside the circle - randomizing position and circle");
            s++; // Increment score
            scoreDisplay.innerText = s; // Update score display

            // --- Clean up spawned cubes from scene and memory ---
            for (const cube of spawnedCubes) {
                scene.remove(cube);
                // Dispose of geometry and material to free up GPU memory
                cube.geometry.dispose();
                cube.material.dispose();
            }
            spawnedCubes.length = 0; // Clear the array of Mesh objects
            spawnedCubePositions.length = 0; // Clear the array of position vectors
            console.log("Cleaned up spawned cubes.");
            // --- END Clean up ---

            cameraRandomized = true; // Set the flag

            // --- Randomize camera position while maintaining distance ---
            // Generate a new random position on a sphere around the origin with a fixed radius
            const newCameraDirection = new THREE.Vector3(
                getRandomArbitrary(-1, 1),
                getRandomArbitrary(-1, 1),
                getRandomArbitrary(-1, 1)
            ).normalize(); // Get a random direction on a unit sphere

            const newCameraPosition = newCameraDirection.multiplyScalar(initialCameraDistance); // Scale to the initial distance

            camera.position.copy(newCameraPosition); // Set the camera's position
            camera.lookAt(0, 0, 0); // Make the camera look at the origin (main cube)
            controls.update(); // Update controls to reflect the new camera position and target
            console.log("Camera position randomized to:", camera.position);
            // --- END Randomize camera ---


            // Reroll the target circle until the camera is NOT inside it
            let newLatitude, newLongitude;
            // Add a safeguard to prevent infinite loops in edge cases
            let attempts = 0;
            const maxAttempts = 100;
            do {
                newLatitude = getRandomArbitrary(-90, 90);
                newLongitude = getRandomArbitrary(-180, 180);
                attempts++;
                if (attempts > maxAttempts) {
                    console.warn("Could not find a new circle center outside the camera position after many attempts.");
                    break; // Exit loop if too many attempts
                }
            } while (isCameraInsideCircleLatLon(
                camera.position,
                newLatitude,
                newLongitude,
                circleRadius
            ));

            currentCircleLatitude = newLatitude;
            currentCircleLongitude = newLongitude;
            console.log("New circle center:", currentCircleLatitude, currentCircleLongitude);

            // Update the position of the target marker cube
            updateTargetMarker(currentCircleLatitude, currentCircleLongitude);

            // Check win condition (could potentially move this to a separate check if needed later)
            if (s >= gameAnswer) {
                console.log("Game Stage 3 Won!");
                globalGameState = 3; // Assuming stage 4 or offline is next
                // Clean up Three.js scene and renderer
                renderer.domElement.style.animation = 'fadeOut 5s linear forwards';
                sleep(5000).then(() => {
                    renderer.dispose(); // Dispose Three.js resources
                    renderer.domElement.remove(); // Remove canvas from DOM
                    // Remove other elements if necessary (container, scoreDisplay)
                    container.remove();
                    scoreDisplay.remove();
                    // Call the next game state initializer
                    changeGameState(globalGameState);
                });
            }


        } else if (!isInside && cameraRandomized) {
            // Reset the flag when the camera moves outside the circle
            cameraRandomized = false;
        }
    });

    controls.addEventListener('change', () => {
        // Renderer render is already called in the render loop

        // Update the picking ray with the camera and pointer position (pointer isn't used here, ray from camera center)
        // --- Using trailRaycaster for spawning trail cubes ---
        trailRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera); // Ray from the center of the screen

        // Calculate objects intersecting the picking ray
        const intersects = trailRaycaster.intersectObjects(cubes); // Intersect with the main cube

        if (intersects.length > 0) {
            // Get the first intersection point on the cube's surface
            const intersectionPoint = intersects[0].point;

            // Check if a cube already exists near this intersection point
            let cubeExists = false;
            for (const pos of spawnedCubePositions) {
                const distance = pos.distanceTo(intersectionPoint);
                if (distance < spawnRadius) {
                    cubeExists = true;
                    break;
                }
            }

            // If no cube exists, spawn a new red one
            if (!cubeExists) {
                // Use the intersection point as the position for the new cube
                const newCube = makeInstance(geometry, 0xff0000, // Red color
                    intersectionPoint.x, intersectionPoint.y, intersectionPoint.z,
                    0.2
                );
                spawnedCubes.push(newCube); // Store the Mesh object
                spawnedCubePositions.push(newCube.position.clone()); // Store a clone of the position vector
                // console.log("Spawned a new red cube at:", newCube.position); // Log the new cube's position
            }
        } else {
             // This else block is for the raycaster in the 'change' event listener,
             // which traces from the camera center to the cube.
             // This raycaster not finding an intersection is less critical
             // for the game logic, but could indicate the camera is positioned such that
             // the center of the screen doesn't point at the main cube.
             // console.warn("Ray from camera center did not intersect the main cube.");
        }
    });

    // Disable pan and zoom as per original request
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.setGizmosVisible(false); // Hide the ArcballControls gizmos

    // Add lights and camera to the scene
    camera.add(directionalLight); // Directional light attached to camera
    scene.add(ambientLight);
    scene.add(camera); // Add camera to the scene to make the attached light effective


    container.style.animation = 'fadeIn 5s linear forwards';

    // Check initial state (optional, but good for debugging)
    console.log("Is the camera inside the initial target circle?", isCameraInsideCircleLatLon(
        camera.position,
        currentCircleLatitude,
        currentCircleLongitude,
        circleRadius
    ));

    // Start the rendering loop
    requestAnimationFrame(render);

    // Expose camera for debugging in data display
    window.camera = camera;
}

function placeholding(text) {
    console.log(`${text} Current time: ${Date.now()}`);
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function changeGameState(gameState) {
    switch (gameState) {
        case 0:
            initGameClicker();
            placeholding('stage 1');
            break;
        case 1:
            initGameIdle();
            placeholding('stage 2');
            break;
        case 2:
            initGameReate();
            placeholding('stage 3');
            break;
        default:
            offline();
            break;
    }
}

// Initial game state setup
changeGameState(globalGameState);

// cheats

const cheats = {
    textAndTime: placeholding,
    skipTo: changeGameState
};

window.cheats = cheats;

// debug data display

const dataDisplay = document.createElement('div');
dataDisplay.classList.add('dataDisplay');
document.body.appendChild(dataDisplay);
dataDisplay.style.position = 'absolute';
dataDisplay.style.top = '10px';
dataDisplay.style.left = '10px';
dataDisplay.style.color = 'white';
dataDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
dataDisplay.style.padding = '10px';
dataDisplay.style.zIndex = '1000'; // Ensure it's above the canvas

function updateDataDisplay() {
    dataDisplay.innerHTML = `
        <div>Game state: ${globalGameState}</div>
        <div>Current time: ${Date.now()}</div>
        <div>Game answer: ${gameAnswer}</div>
        ${globalGameState === 2 && window.camera ? `<div>Camera Pos: ${window.camera.position.x.toFixed(2)}, ${window.camera.position.y.toFixed(2)}, ${window.camera.position.z.toFixed(2)}</div>` : ''}
        ${globalGameState === 2 && window.camera ? `<div>Camera Distance: ${window.camera.position.distanceTo(new THREE.Vector3(0,0,0)).toFixed(2)}</div>` : ''}
    `;
}

// Use a proper loop or setInterval for updating the display
setInterval(updateDataDisplay, 100); // Update every 100 milliseconds

// Expose THREE for debugging
window.THREE = THREE;
