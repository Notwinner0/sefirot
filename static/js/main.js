import * as THREE from 'three';

var globalGameState = 0

function initGameClicker(gameState) {
    let score = 0;
    const container = document.querySelector('.container');
    const helloText = document.querySelector('.hello');
    const scoreDisplay = document.createElement('div');

    scoreDisplay.classList.add('score');
    container.appendChild(scoreDisplay);

    helloText.addEventListener('click', gameClick);

    function gameClick() {
        score = incrementScore(score, scoreDisplay);
        gameState = updateGameState(score, gameState);
    }

    function incrementScore(currentScore, scoreElement) {
        currentScore++;
        scoreElement.innerText = currentScore;
        return currentScore;
    }

    function updateGameState(currentScore, gameState) {
        if (currentScore >= 250) {
            gameState = 1;
            helloText.removeEventListener('click', gameClick)
            changeGameState(gameState)
        }
        return gameState;
    }

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
        color: 0x00ff00
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    let speen = -0.001

    function animate() {

        cube.rotation.x += speen
        cube.scale.z += speen / 5
        speen += 0.00001

        cube.rotation.y += 0.05;

        renderer.render(scene, camera);

    }
}


function placeholding(text) {
    console.log(text + " " + "Current time: " + Date.now())
}

function changeGameState(globalGameState) {
    switch (globalGameState) {
        case 0:
            initGameClicker(globalGameState);
            break;
        case 1:
            placeholding("stage 2")
            break;
        case 2:
            placeholding("stage 3")
        default:
            offline()
            break;
    }    
}

changeGameState(globalGameState)