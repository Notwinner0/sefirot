import * as THREE from 'three';

let globalGameState = 0;
const gameAnswer = 25; // Game rebalancing seed

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
        // Changes the game state
        changeGameState(globalGameState);
        // Removes the helloText, container, and scoreDisplay elements from the DOM
        helloText.remove();
        container.remove();
        scoreDisplay.remove();
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
    const renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    // Sets the size of the renderer to match the window size
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Appends the renderer's DOM element to the document body
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
    const scene = new THREE.DirectionalLight(color, intensity);
  
    // Adds a directional light to the scene
    {
      const color = 0xffffff;
      const intensity = 3;
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(-1, 2, 4);
      scene.add(light);
    }
  
    // Defines the dimensions of the box geometry
    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
  
    // Function to create a new mesh instance with specified geometry, color, and position
    function makeInstance(geometry, color, x) {
      const material = new THREE.MeshPhongMaterial({
        color
      });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      cube.position.x = x;
      return cube;
    }
  
    // Creates three cube instances with different colors and positions
    const cubes = [
      makeInstance(geometry, 0x44aa88, 0),
      makeInstance(geometry, 0x8844aa, -2),
      makeInstance(geometry, 0xaa8844, 2),
    ];
  
    // Function to resize the renderer to match the window size
    function resizeRendererToDisplaySize(renderer) {
      const canvas = renderer.domElement;
      const pixelRatio = window.devicePixelRatio;
      const width = Math.floor(canvas.clientWidth * pixelRatio);
      const height = Math.floor(canvas.clientHeight * pixelRatio);
      const needResize = canvas.width !== width || canvas.height !== height;
      if (needResize) {
        renderer.setSize(width, height, false);
      }
      return needResize;
    }
  
    // Main render function
    function render(time) {
      time *= 0.001;
  
      // Resizes the renderer if necessary
      if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      }
  
      // Rotates each cube based on time and its index
      cubes.forEach((cube, ndx) => {
        const speed = 1 + ndx * 0.1;
        const rot = time * speed;
        cube.rotation.x = rot;
        cube.rotation.y = rot;
      });
  
      // Renders the scene
      renderer.render(scene, camera);
  
      // Requests the browser to call the render function again in the next animation frame
      requestAnimationFrame(render);
    }
  
    // Starts the render loop
    requestAnimationFrame(render);
  }

function placeholding(text) {
    console.log(`${text} Current time: ${Date.now()}`);
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