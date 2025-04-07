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
			container.style.animation = 'fadeOut 25s linear forwards';
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

			container.style.animation = 'fadeOut 25s linear forwards';

			sleep(25000).then(() => {
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
		container.style.animation = 'fadeIn 25s linear forwards';
	}

	// Sleeps for 25 seconds and then rewinds the game
	sleep(25000).then(() => {
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
	console.log('WIP');

	// Creates a WebGLRenderer instance with anti-aliasing
	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.toneMapping = THREE.ReinhardToneMapping;
	renderer.toneMappingExposure = 3;
	renderer.domElement.style.background = 'radial-gradient(circle, rgba(173, 181, 189, 0.5) 50%, rgba(33, 37, 41, 0.5) 100%)';
	renderer.domElement.style.animation = 'fadeIn 25s linear forwards';
	document.body.appendChild(renderer.domElement);

	// Sets up the camera perspective
	const fov = 75;
	const aspect = window.innerWidth / window.innerHeight;
	const near = 0.1;
	const far = 5;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	// Positions the camera 2 units back from the scene
	camera.position.z = 2;

	// Creates a new scene
	const scene = new THREE.Scene();

	// Adds a directional light to the scene
	let directionalLight; // Объявляем переменную для хранения ссылки на свет
	{
		const color = 0xffffff;
		const intensity = 3;
		directionalLight = new THREE.DirectionalLight(color, intensity); // Присваиваем ссылку
		directionalLight.position.set(-1, 2, 4);
		// Не добавляем свет напрямую в сцену на этом этапе
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

	// Функция для создания нового экземпляра меша с указанной геометрией, цветом и позицией
	function makeInstance(geometry, color, x) {
		const material = new THREE.MeshPhongMaterial({
			color
		});
		const cube = new THREE.Mesh(geometry, material);
		scene.add(cube);
		cube.position.x = x;
		return cube;
	}

	// Создаем один экземпляр куба
	const cubes = [
		makeInstance(geometry, 0x000000, 0)
	];

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function randomizeRotation(cube) {
		let rot = getRandomArbitrary(-90, 90);
		cube.rotation.x = rot;
		cube.rotation.y = rot;
	}

	// Главная функция рендеринга
	function render(time) {
		time *= 0.001;

		// Вращаем куб (раскомментируйте, если хотите автоматическое вращение)
		// cubes.forEach((cube, ndx) => {
		//     const speed = 1 + ndx * 0.1;
		//     const rot = time * speed * getRandomArbitrary(-1, 1);
		//     cube.rotation.x = rot;
		//     cube.rotation.y = rot;
		// });

		// Обновляем контроллеры в цикле рендеринга
		controls.update();

		// Рендерим сцену
		renderer.render(scene, camera);

		// Просим браузер вызвать функцию рендеринга снова на следующем кадре анимации
		requestAnimationFrame(render);
	}

	window.addEventListener('resize', onWindowResize);
	const controls = new ArcballControls(camera, renderer.domElement, scene);
	// Мы хотим рендерить только когда контроллеры действительно меняются, а не на каждом кадре, если они не менялись
	controls.addEventListener('change', () => renderer.render(scene, camera));
	controls.setCamera(camera);
	controls.enablePan = false;
	controls.enableZoom = false;
	controls.setGizmosVisible(false);

	// Добавляем направленный свет к камере после инициализации камеры и света
	camera.add(directionalLight);
	scene.add(ambientLight);
	scene.add(camera); // Важно добавить камеру в сцену, если вы этого еще не сделали явно

	randomizeRotation(cubes[0]);

	const container = document.querySelector('.container');
	const scoreDisplay = document.querySelector('.score');
	scoreDisplay.innerText = '0';
	// document.body.appendChild(scoreDisplay);
	container.style.animation = 'fadeIn 25s linear forwards';

	if (window.innerWidth < window.innerHeight) {
		scoreDisplay.style.fontSize = '130vw';
		scoreDisplay.style.rotate = '90deg';
	} else {
		scoreDisplay.style.fontSize = '100vh';
	}
	// Запускаем цикл рендеринга
	requestAnimationFrame(render);
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

changeGameState(globalGameState);

const cheats = {
	textAndTime: placeholding,
	skipTo: changeGameState
};
  
window.cheats = cheats;