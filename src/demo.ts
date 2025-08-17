import * as THREE from 'three';
import { ArcballControls } from 'three/addons/controls/ArcballControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';


let globalGameState: number = 0;
const gameAnswer: number = 5;

/**
 * A utility function to create a simple promise-based delay.
 * @param ms The number of milliseconds to sleep.
 * @returns A promise that resolves after the specified time.
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates a random number within a given range.
 * @param min The minimum value (inclusive).
 * @param max The maximum value (exclusive).
 * @returns A random number between min and max.
 */
function getRandomArbitrary(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * Creates a simple white circle texture for particles.
 * @returns The generated texture.
 */
function createParticleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return new THREE.CanvasTexture(canvas);
}

// Global window properties for debugging and cheats
declare global {
    interface Window {
        cheats: {
            textAndTime: (text: string) => void;
            skipTo: (state: number) => void;
        };
        camera?: THREE.Camera;
        THREE?: typeof THREE;
    }
}


function initGameClicker(): void {
    let score: number = 0;
    const container = document.querySelector('.container') as HTMLElement;
    const helloText = document.querySelector('.hello') as HTMLElement;
    const scoreDisplay = document.createElement('div');

    scoreDisplay.classList.add('score');
    container.appendChild(scoreDisplay);

    helloText.addEventListener('click', gameClick);

    function gameClick(): void {
        score++;
        scoreDisplay.innerText = score.toString();
        if (score >= gameAnswer) {
            globalGameState = 1;
            helloText.removeEventListener('click', gameClick);
            changeGameState(globalGameState);
            container.style.animation = 'fadeOut 5s linear forwards';
        }
    }
}

function initGameIdle(): void {
    const helloText = document.querySelector('.hello') as HTMLElement;
    const block = helloText;
    const scoreDisplay = document.querySelector('.score') as HTMLElement;

    let score: number = 0;
    let x: number = 100;
    let y: number = 100;
    let dx: number = 1;
    let dy: number = 1;

    const blockWidth: number = block.offsetWidth;
    const blockHeight: number = block.offsetHeight;
    const container = document.querySelector('.container') as HTMLElement;

    function gameLoop(): void {
        scoreDisplay.innerText = score.toString();
        const windowWidth: number = window.innerWidth;
        const windowHeight: number = window.innerHeight;

        if (x + blockWidth > windowWidth || x < 0) {
            dx = -dx;
            score++;
        }
        if (y + blockHeight > windowHeight || y < 0) {
            dy = -dy;
            score++;
        }

        x += dx;
        y += dy;

        block.style.left = `${x}px`;
        block.style.top = `${y}px`;

        if (score > gameAnswer) {
            globalGameState = 2;
            helloText.removeEventListener('click', idleGameClick);

            container.style.animation = 'fadeOut 5s linear forwards';

            sleep(5000).then(() => {
                helloText.remove();
                changeGameState(globalGameState);
            });
        } else {
            requestAnimationFrame(gameLoop);
        }
    }

    function idleGameClick(): void {
        dx *= 1.5;
        dy *= 1.5;
    }

    function rewindGame(): void {
        helloText.style.display = 'block';
        container.style.animation = 'fadeIn 5s linear forwards';
    }

    sleep(5000).then(() => {
        rewindGame();
        helloText.addEventListener('click', idleGameClick);
        requestAnimationFrame(gameLoop);
    });
}


function offline(): void {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1.5;
    bloomPass.radius = 0;
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 1
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    let cubeHue: number = 1 / 3;
    let cubeHueSpeed: number = 0.001;
    const cubeHueAcceleration: number = 0.001;
    let speed: number = -0.001;

    const particleCount: number = 1000;
    const particles = new THREE.BufferGeometry();
    const pMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
        map: createParticleTexture(),
        depthWrite: false,
        vertexColors: true
    });

    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pVelocities = new Float32Array(particleCount * 3);
    const pLifespans = new Float32Array(particleCount);

    let color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
        pPositions[i * 3] = 0;
        pPositions[i * 3 + 1] = 0;
        pPositions[i * 3 + 2] = 0;

        pVelocities[i * 3] = (Math.random() - 0.5) * 5;
        pVelocities[i * 3 + 1] = (Math.random() - 0.5) * 5;
        pVelocities[i * 3 + 2] = (Math.random() - 0.5) * 5;

        color.setHSL(Math.random(), 1.0, 0.5);
        pColors[i * 3] = color.r;
        pColors[i * 3 + 1] = color.g;
        pColors[i * 3 + 2] = color.b;

        pLifespans[i] = Math.random() * 2 + 1;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    particles.setAttribute('velocity', new THREE.BufferAttribute(pVelocities, 3));
    particles.setAttribute('lifespan', new THREE.BufferAttribute(pLifespans, 1));

    const particleSystem = new THREE.Points(particles, pMaterial);
    scene.add(particleSystem);

    camera.position.z = 5;

    const clock = new THREE.Clock();

    function animate(): void {
        const delta: number = clock.getDelta();

        cube.rotation.x += speed;
        cube.scale.z += speed / 5;
        speed += 0.00001;
        cube.rotation.y += 0.05;

        cubeHue += cubeHueSpeed * delta;
        if (cubeHue > 1) {
            cubeHue -= 1;
        }
        cubeHueSpeed += cubeHueAcceleration * delta;

        const newCubeColor = new THREE.Color().setHSL(cubeHue, 1.0, 0.5);
        cube.material.color.copy(newCubeColor);
        cube.material.emissive.copy(newCubeColor);

        const positions = particles.attributes.position.array as Float32Array;
        const colors = particles.attributes.color.array as Float32Array;
        const velocities = particles.attributes.velocity.array as Float32Array;
        const lifespans = particles.attributes.lifespan.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += velocities[i * 3] * delta;
            positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
            positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;

            velocities[i * 3 + 1] -= 1 * delta;
            lifespans[i] -= delta;

            if (lifespans[i] <= 0) {
                positions[i * 3] = 0;
                positions[i * 3 + 1] = 0;
                positions[i * 3 + 2] = 0;

                velocities[i * 3] = (Math.random() - 0.5) * 5;
                velocities[i * 3 + 1] = (Math.random() - 0.5) * 5;
                velocities[i * 3 + 2] = (Math.random() - 0.5) * 5;

                lifespans[i] = Math.random() * 2 + 1;

                color.setHSL(Math.random(), 1.0, 0.5);
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
            }
        }

        particles.attributes.position.needsUpdate = true;
        particles.attributes.color.needsUpdate = true;
        particles.attributes.lifespan.needsUpdate = true;

        composer.render();
    }

    renderer.setAnimationLoop(animate);

    window.addEventListener('resize', onWindowResize);

    function onWindowResize(): void {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        bloomPass.setSize(window.innerWidth, window.innerHeight);
    }
}

function initGameReate(): void {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 3;
    renderer.domElement.style.background = 'radial-gradient(circle, rgba(173, 181, 189, 0.5) 50%, rgba(33, 37, 41, 0.5) 100%)';
    renderer.domElement.style.animation = 'fadeIn 5s linear forwards';
    document.body.appendChild(renderer.domElement);

    const fov: number = 75;
    const aspect: number = window.innerWidth / window.innerHeight;
    const near: number = 0.1;
    const far: number = 5;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    const initialCameraDistance: number = 2;
    camera.position.z = initialCameraDistance;

    const scene = new THREE.Scene();

    let directionalLight: THREE.DirectionalLight;
    {
        const color: number = 0xffffff;
        const intensity: number = 3;
        directionalLight = new THREE.DirectionalLight(color, intensity);
        directionalLight.position.set(-1, 2, 4);
    }

    let ambientLight: THREE.AmbientLight;
    {
        const color: number = 0xffffff;
        const intensity: number = 2;
        ambientLight = new THREE.AmbientLight(color, intensity);
    }

    const boxWidth: number = 1;
    const boxHeight: number = 1;
    const boxDepth: number = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    const spawnedCubePositions: THREE.Vector3[] = [];
    const spawnedCubes: THREE.Mesh[] = [];
    const spawnRadius: number = 0.08;

    let targetMarkerCube: THREE.Mesh | null = null;
    const targetMarkerSize: number = 0.3;

    const trailRaycaster = new THREE.Raycaster();

    function makeInstance(geometry: THREE.BufferGeometry, color: number, x: number, y: number, z: number, scale: number = 1): THREE.Mesh {
        const material = new THREE.MeshPhongMaterial({ color });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        cube.position.set(x, y, z);
        cube.scale.set(scale, scale, scale);
        return cube;
    }

    const cubes: THREE.Mesh[] = [
        makeInstance(geometry, 0x000000, 0, 0, 0)
    ];

    function onWindowResize(): void {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function degreesToRadians(degrees: number): number {
        return degrees * Math.PI / 180;
    }

    function latLonToCartesian(latitude: number, longitude: number, radius: number): THREE.Vector3 {
        const latRad: number = degreesToRadians(latitude);
        const lonRad: number = degreesToRadians(longitude);

        const x: number = radius * Math.cos(latRad) * Math.cos(lonRad);
        const y: number = radius * Math.sin(latRad);
        const z: number = radius * Math.cos(latRad) * Math.sin(lonRad);

        return new THREE.Vector3(x, y, z);
    }

    function sphericalToCubeSurface(latitude: number, longitude: number): { position: THREE.Vector3, normal: THREE.Vector3 } {
        const sphericalPoint = latLonToCartesian(latitude, longitude, 1);

        let x = sphericalPoint.x;
        let y = sphericalPoint.y;
        let z = sphericalPoint.z;

        const absX: number = Math.abs(x);
        const absY: number = Math.abs(y);
        const absZ: number = Math.abs(z);

        let face: string = '';
        let scale: number = 0;

        if (absX >= absY && absX >= absZ) {
            face = (x > 0) ? '+x' : '-x';
            scale = 0.5 / absX;
        } else if (absY >= absX && absY >= absZ) {
            face = (y > 0) ? '+y' : '-y';
            scale = 0.5 / absY;
        } else {
            face = (z > 0) ? '+z' : '-z';
            scale = 0.5 / absZ;
        }

        const cubeSurfacePoint = new THREE.Vector3(x * scale, y * scale, z * scale);

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

    function updateTargetMarker(targetLatitude: number, targetLongitude: number): void {
        const cubeSurfaceData = sphericalToCubeSurface(targetLatitude, targetLongitude);
        const intersectionPoint = cubeSurfaceData.position;
        const faceNormal = cubeSurfaceData.normal;

        if (targetMarkerCube) {
            targetMarkerCube.position.copy(intersectionPoint);
            targetMarkerCube.scale.set(targetMarkerSize, targetMarkerSize, targetMarkerSize);
            targetMarkerCube.visible = true;
        } else {
            targetMarkerCube = makeInstance(geometry, 0xffff00,
                intersectionPoint.x, intersectionPoint.y, intersectionPoint.z,
                targetMarkerSize
            );
        }

        const lookAtPosition = intersectionPoint.clone().add(faceNormal);
        targetMarkerCube.lookAt(lookAtPosition);
    }

    function isCameraInsideCircleLatLon(cameraPosition: THREE.Vector3, circleLatitude: number, circleLongitude: number, circleAngularRadius: number): boolean {
        const circleCenterDirection = latLonToCartesian(circleLatitude, circleLongitude, 1).normalize();
        const cameraDirection = cameraPosition.clone().normalize();
        const dotProduct: number = cameraDirection.dot(circleCenterDirection);
        const angle: number = Math.acos(Math.min(Math.max(dotProduct, -1), 1));
        return angle <= circleAngularRadius;
    }

    let cameraRandomized: boolean = false;

    function render(time: number): void {
        time *= 0.001;

        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    window.addEventListener('resize', onWindowResize);
    const controls = new ArcballControls(camera, renderer.domElement, scene);
    controls.setCamera(camera);
    (controls as any).target.set(0, 0, 0);
    controls.update();

    let currentCircleLatitude: number = getRandomArbitrary(-90, 90);
    let currentCircleLongitude: number = getRandomArbitrary(-180, 180);

    const circleRadius: number = 0.5;
    let s: number = 0;

    const container = document.querySelector('.container') as HTMLElement;
    const scoreDisplay = document.querySelector('.score') as HTMLElement;
    scoreDisplay.innerText = '0';

    if (window.innerWidth < window.innerHeight) {
        scoreDisplay.style.fontSize = '130vw';
        scoreDisplay.style.rotate = '90deg';
    } else {
        scoreDisplay.style.fontSize = '100vh';
    }

    updateTargetMarker(currentCircleLatitude, currentCircleLongitude);

    controls.addEventListener('end', () => {
        const isInside: boolean = isCameraInsideCircleLatLon(
            camera.position,
            currentCircleLatitude,
            currentCircleLongitude,
            circleRadius
        );

        if (isInside && !cameraRandomized) {
            s++;
            scoreDisplay.innerText = s.toString();

            for (const cube of spawnedCubes) {
                scene.remove(cube);
                cube.geometry.dispose();
                (cube.material as THREE.Material).dispose();
            }
            spawnedCubes.length = 0;
            spawnedCubePositions.length = 0;

            cameraRandomized = true;

            const newCameraDirection: THREE.Vector3 = new THREE.Vector3(
                getRandomArbitrary(-1, 1),
                getRandomArbitrary(-1, 1),
                getRandomArbitrary(-1, 1)
            ).normalize();

            const newCameraPosition = newCameraDirection.multiplyScalar(initialCameraDistance);
            camera.position.copy(newCameraPosition);
            camera.lookAt(0, 0, 0);
            controls.update();

            let newLatitude: number, newLongitude: number;
            let attempts: number = 0;
            const maxAttempts: number = 100;
            do {
                newLatitude = getRandomArbitrary(-90, 90);
                newLongitude = getRandomArbitrary(-180, 180);
                attempts++;
                if (attempts > maxAttempts) {
                    break;
                }
            } while (isCameraInsideCircleLatLon(
                camera.position,
                newLatitude,
                newLongitude,
                circleRadius
            ));

            currentCircleLatitude = newLatitude;
            currentCircleLongitude = newLongitude;

            updateTargetMarker(currentCircleLatitude, currentCircleLongitude);

            if (s >= gameAnswer) {
                globalGameState = 3;
                renderer.domElement.style.animation = 'fadeOut 5s linear forwards';
                sleep(5000).then(() => {
                    renderer.dispose();
                    renderer.domElement.remove();
                    container.remove();
                    scoreDisplay.remove();
                    changeGameState(globalGameState);
                });
            }
        } else if (!isInside && cameraRandomized) {
            cameraRandomized = false;
        }
    });

    controls.addEventListener('change', () => {
        trailRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects: THREE.Intersection[] = trailRaycaster.intersectObjects(cubes);

        if (intersects.length > 0) {
            const intersectionPoint: THREE.Vector3 = intersects[0].point;
            let cubeExists: boolean = false;
            for (const pos of spawnedCubePositions) {
                const distance: number = pos.distanceTo(intersectionPoint);
                if (distance < spawnRadius) {
                    cubeExists = true;
                    break;
                }
            }

            if (!cubeExists) {
                const newCube: THREE.Mesh = makeInstance(geometry, 0xff0000,
                    intersectionPoint.x, intersectionPoint.y, intersectionPoint.z,
                    0.2
                );
                spawnedCubes.push(newCube);
                spawnedCubePositions.push(newCube.position.clone());
            }
        }
    });

    controls.enablePan = false;
    controls.enableZoom = false;
    controls.setGizmosVisible(false);

    camera.add(directionalLight);
    scene.add(ambientLight);
    scene.add(camera);

    container.style.animation = 'fadeIn 5s linear forwards';
    requestAnimationFrame(render);
    window.camera = camera;
}

function placeholding(text: string): void {
    console.log(`${text} Current time: ${Date.now()}`);
}

function changeGameState(gameState: number): void {
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

changeGameState(globalGameState);

const cheats = {
    textAndTime: placeholding,
    skipTo: changeGameState
};

window.cheats = cheats;

const dataDisplay = document.createElement('div');
dataDisplay.classList.add('dataDisplay');
document.body.appendChild(dataDisplay);
dataDisplay.style.position = 'absolute';
dataDisplay.style.top = '10px';
dataDisplay.style.left = '10px';
dataDisplay.style.color = 'white';
dataDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
dataDisplay.style.padding = '10px';
dataDisplay.style.zIndex = '1000';

function updateDataDisplay(): void {
    dataDisplay.innerHTML = `
        <div>Game state: ${globalGameState}</div>
        <div>Current time: ${Date.now()}</div>
        <div>Game answer: ${gameAnswer}</div>
        ${globalGameState === 2 && window.camera ? `<div>Camera Pos: ${window.camera.position.x.toFixed(2)}, ${window.camera.position.y.toFixed(2)}, ${window.camera.position.z.toFixed(2)}</div>` : ''}
        ${globalGameState === 2 && window.camera ? `<div>Camera Distance: ${window.camera.position.distanceTo(new THREE.Vector3(0,0,0)).toFixed(2)}</div>` : ''}
    `;
}

setInterval(updateDataDisplay, 100);

window.THREE = THREE;
