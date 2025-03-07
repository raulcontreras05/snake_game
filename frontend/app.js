document.addEventListener('DOMContentLoaded', () => {
    // --- Precarga de imágenes ---
    const fruitIcon = new Image();
    fruitIcon.src = "assets/images/fruit.png";

    const powerUpIcons = {
        speed: new Image(),
        slow: new Image(),
        score: new Image(),
        shrink: new Image()
    };
    powerUpIcons.speed.src = "assets/images/lightning.png";
    powerUpIcons.slow.src = "assets/images/snail.png";
    powerUpIcons.score.src = "assets/images/star.png";
    powerUpIcons.shrink.src = "assets/images/minus.png";

    // --- Elementos del DOM ---
    const menuPrincipal = document.getElementById('menuPrincipal');
    const authSection = document.getElementById('authSection');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const gameSection = document.getElementById('gameSection');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const rankingDiv = document.getElementById('ranking');
    const rankingList = document.getElementById('rankingList');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const finalScoreDisplay = document.getElementById('finalScore');
    const activePowerUpDisplay = document.getElementById('activePowerUp');
    const leyendaSidebar = document.getElementById('leyendaSidebar');
    const startGameButton = document.getElementById('startGameButton');

    // --- Variables del Juego ---
    const gridSize = 20;
    const canvasSize = canvas.width;
    let snake = [];
    let direction = 'RIGHT';
    let food = {};
    let obstacles = [];
    let powerUps = [];
    let score = 0;
    let gameInterval;
    const baseGameInterval = 150;
    let gameIntervalTime = baseGameInterval;
    let scoreMultiplier = 1;
    let speedTimeout, slowTimeout, scoreTimeout;
    const obstacleSpawnRate = 0.5;
const powerUpSpawnRate = 0.05;

    // --- Funciones de Autenticación ---
    window.mostrarRegistro = function() {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    };

    window.mostrarLogin = function() {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    };

    window.mostrarAuth = function() {
        menuPrincipal.style.display = 'none';
        authSection.style.display = 'block';
    };

    window.registrarUsuario = function() {
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        
        fetch('../backend/registro.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.status === 'success') mostrarLogin();
        })
        .catch(error => console.error('Error:', error));
    };

    window.iniciarSesion = function() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        fetch('../backend/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.status === 'success') {
                authSection.style.display = 'none';
                gameSection.style.display = 'block';
                startGameButton.style.display = 'block';
            }
        })
        .catch(error => console.error('Error:', error));
    };

    window.cerrarSesion = function() {
        fetch('../backend/logout.php')
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            window.location.reload();
        })
        .catch(error => console.error('Error:', error));
    };

    // --- Funciones del Ranking ---
    window.obtenerRanking = function() {
        fetch('../backend/ranking.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                rankingList.innerHTML = '';
                data.data.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = `${item.username}: ${item.score} puntos (${item.fecha})`;
                    rankingList.appendChild(li);
                });
                rankingDiv.classList.remove('hidden');
            }
        })
        .catch(error => console.error('Error:', error));
    };

    window.cerrarRanking = function() {
        rankingDiv.classList.add('hidden');
    };

    // --- Funciones principales del juego ---
    function iniciarJuego() {
        snake = [{ x: canvasSize / 2, y: canvasSize / 2 }];
        direction = 'RIGHT';
        food = generarComida();
        obstacles = [];
        powerUps = [];
        score = 0;
        scoreMultiplier = 1;
        scoreDisplay.textContent = "Puntuación: " + score;
        activePowerUpDisplay.textContent = "Power Up activo: Ninguno";
        restartGameInterval();
    }

    function restartGameInterval() {
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameIntervalTime);
    }

    function generarComida() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize,
                y: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize
            };
        } while (checkColision(newFood));
        return newFood;
    }

    function checkColision(pos) {
        return snake.some(segment => segment.x === pos.x && segment.y === pos.y) ||
               obstacles.some(obstaculo => obstaculo.x === pos.x && obstaculo.y === pos.y) ||
               (food.x === pos.x && food.y === pos.y);
    }

    function generarObstaculo() {
        let newObstacle;
        do {
            newObstacle = {
                x: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize,
                y: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize
            };
        } while (checkColision(newObstacle));
        return newObstacle;
    }

    function generarPowerUp() {
        const tipos = ['speed', 'slow', 'score', 'shrink'];
        return {
            x: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize,
            y: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize,
            tipo: tipos[Math.floor(Math.random() * tipos.length)],
            expireTime: Date.now() + 10000
        };
    }

    function gameLoop() {
        const head = { ...snake[0] };
        switch (direction) {
            case 'RIGHT': head.x += gridSize; break;
            case 'LEFT': head.x -= gridSize; break;
            case 'UP': head.y -= gridSize; break;
            case 'DOWN': head.y += gridSize; break;
        }

        if (head.x < 0 || head.x >= canvasSize || head.y < 0 || head.y >= canvasSize) {
            terminarJuego();
            return;
        }

        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            terminarJuego();
            return;
        }

        if (obstacles.some(obstaculo => obstaculo.x === head.x && obstaculo.y === head.y)) {
            terminarJuego();
            return;
        }

        const powerUpIndex = powerUps.findIndex(pu => pu.x === head.x && pu.y === head.y);
        if (powerUpIndex !== -1) {
            activarPowerUp(powerUps[powerUpIndex]);
            powerUps.splice(powerUpIndex, 1);
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += 10 * scoreMultiplier;
            scoreDisplay.textContent = "Puntuación: " + score;
            food = generarComida();
            if (Math.random() < obstacleSpawnRate) obstacles.push(generarObstaculo());
        } else {
            snake.pop();
        }

        if (Math.random() < powerUpSpawnRate) powerUps.push(generarPowerUp());
        powerUps = powerUps.filter(pu => Date.now() < pu.expireTime);
        dibujar();
    }

    function dibujar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar comida
        ctx.drawImage(fruitIcon, food.x, food.y, gridSize, gridSize);
        
        // Dibujar obstáculos
        ctx.fillStyle = 'gray';
        obstacles.forEach(obstaculo => {
            ctx.fillRect(obstaculo.x, obstaculo.y, gridSize, gridSize);
        });
        
        // Dibujar power-ups
        powerUps.forEach(pu => {
            const img = powerUpIcons[pu.tipo];
            ctx.drawImage(img, pu.x, pu.y, gridSize, gridSize);
        });
        
        // Dibujar serpiente
        ctx.fillStyle = 'green';
        snake.forEach(segment => {
            ctx.fillRect(segment.x, segment.y, gridSize, gridSize);
        });
    }

    function activarPowerUp(pu) {
        switch(pu.tipo) {
            case 'speed':
                clearTimeout(speedTimeout);
gameIntervalTime = Math.max(30, baseGameInterval - 70);
                restartGameInterval();
                activePowerUpDisplay.textContent = "Power Up activo: Speed Boost";
                speedTimeout = setTimeout(() => {
                    gameIntervalTime = baseGameInterval;
                    restartGameInterval();
                    activePowerUpDisplay.textContent = "Power Up activo: Ninguno";
                }, 10000);
                break;
                
            case 'slow':
                clearTimeout(slowTimeout);
gameIntervalTime = baseGameInterval + 80;
                restartGameInterval();
                activePowerUpDisplay.textContent = "Power Up activo: Slow Down";
                slowTimeout = setTimeout(() => {
                    gameIntervalTime = baseGameInterval;
                    restartGameInterval();
                    activePowerUpDisplay.textContent = "Power Up activo: Ninguno";
                }, 10000);
                break;
                
            case 'score':
                clearTimeout(scoreTimeout);
                scoreMultiplier = 2;
                activePowerUpDisplay.textContent = "Power Up activo: Score Multiplier";
                scoreTimeout = setTimeout(() => {
                    scoreMultiplier = 1;
                    activePowerUpDisplay.textContent = "Power Up activo: Ninguno";
                }, 10000);
                break;
                
            case 'shrink':
                if (snake.length > 3) {
                    snake = snake.slice(0, Math.max(3, Math.floor(snake.length / 2)));
                    activePowerUpDisplay.textContent = "Power Up activo: Shrink";
                    setTimeout(() => {
                        activePowerUpDisplay.textContent = "Power Up activo: Ninguno";
                    }, 2000);
                }
                break;
        }
    }

    function terminarJuego() {
        clearInterval(gameInterval);
        enviarPuntuacion(score);
        mostrarGameOver();
    }

    function enviarPuntuacion(finalScore) {
        fetch('../backend/guardar_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: finalScore })
        })
        .catch(error => console.error('Error:', error));
    }

    function mostrarGameOver() {
        gameSection.style.display = 'none';
        gameOverScreen.style.display = 'block';
        finalScoreDisplay.textContent = "Puntuación final: " + score;
    }

    // --- Funciones de control ---
    window.reiniciarJuego = function() {
        gameOverScreen.style.display = 'none';
        gameSection.style.display = 'block';
        iniciarJuego();
    };

    window.mostrarMenuPrincipal = function() {
        gameOverScreen.style.display = 'none';
        gameSection.style.display = 'none';
        authSection.style.display = 'none';
        menuPrincipal.style.display = 'block';
    };

    window.toggleLeyenda = function() {
        leyendaSidebar.style.display = leyendaSidebar.style.display === 'none' ? 'block' : 'none';
    };

    // --- Event Listeners ---
    document.addEventListener('keydown', (event) => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
            event.preventDefault();
            switch(event.key) {
                case 'ArrowRight': if (direction !== 'LEFT') direction = 'RIGHT'; break;
                case 'ArrowLeft': if (direction !== 'RIGHT') direction = 'LEFT'; break;
                case 'ArrowUp': if (direction !== 'DOWN') direction = 'UP'; break;
                case 'ArrowDown': if (direction !== 'UP') direction = 'DOWN'; break;
            }
        }
    });

    startGameButton.addEventListener('click', () => {
        iniciarJuego();
        startGameButton.style.display = 'none';
    });

    // --- Inicialización ---
    leyendaSidebar.style.display = 'none';
});