import * as THREE from 'three';

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

let globalScore = 0; // Используем let вместо var для лучшего контроля области видимости
const container = document.querySelector('.container');
const helloWorld = document.querySelector('.hello');
const score = document.createElement('div');
score.classList.add('score');

function clickerGame() {
    globalScore += 1;
    score.innerText = globalScore; // Обновляем текст score внутри функции
}

score.innerText = globalScore; // Инициализируем текст score при загрузке страницы
helloWorld.addEventListener('click', clickerGame); // Передаем функцию clickerGame без вызова
container.appendChild(score);