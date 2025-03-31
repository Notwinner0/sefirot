import * as THREE from 'three';

var globalGameState = 0
var answer = 25

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
        // score = incrementScore(score, scoreDisplay);
        scoreDisplay.innerText = score;
        if (score >= answer) {
            globalGameState = 1;
            helloText.removeEventListener('click', gameClick)
            changeGameState(globalGameState);
            container.style.animation = "fadeOut 25s linear forwards";
            // sleep(25000)
            //     .then(() => {
            //         container.style.display = "none";
            //     })
        }
    }
}

function initGameIdle() {

    const block = document.querySelector('.hello');
    const helloText = document.querySelector('.hello');
    const scoreDisplay = document.querySelector('.score');

    let score = 0;



    let x = 100;
    let y = 100;
    let dx = 3; // Чуть быстрее
    let dy = 3;

    const blockWidth = block.offsetWidth;
    const blockHeight = block.offsetHeight;

    const container = document.querySelector('.container');

    function gameLoop() {
        scoreDisplay.innerText = score;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Проверка столкновений
        if (x + blockWidth > windowWidth || x < 0) {
            dx = -dx;
            score++
            dx *= 1.001
        }
        if (y + blockHeight > windowHeight || y < 0) {
            dy = -dy;
            score++
            dy *= 1.001
        }

        // Движение
        x += dx; // Короткая запись для x = x + dx
        y += dy;

        // Обновление стилей
        block.style.left = x + 'px';
        block.style.top = y + 'px';

        // Просим браузер вызвать gameLoop снова, когда он будет готов

        if (score > answer) {
            globalGameState = 2;
            helloText.removeEventListener('click', gameClick)
            changeGameState(globalGameState);
        }
        else {
            requestAnimationFrame(gameLoop);
        }
    }


    function gameClick() {
        dx *= 1.5;
        dy *= 1.5;
    }

    function rewindGame() {
        helloText.style.display = "block";
        container.style.animation = "fadeIn 25s linear forwards";
    }
    // Запускаем цикл анимации в первый раз
    sleep(25000).then(() => {
        rewindGame()
        helloText.addEventListener('click', gameClick);
        requestAnimationFrame(gameLoop);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
            initGameClicker();
            placeholding("stage 1")
            break;
        case 1:
            initGameIdle();
            placeholding("stage 2")
            break;
        case 2:
            placeholding("stage 3")
            break;
        default:
            offline()
            break;
    }
}

changeGameState(globalGameState)