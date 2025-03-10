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
    const baseGameInterval = 130; // Velocidad base del juego (modo normal)
    let gameIntervalTime = baseGameInterval;
    let scoreMultiplier = 1;
    let speedTimeout, slowTimeout, scoreTimeout;
    
    // Configuraciones de dificultad
    let currentDifficulty = 'normal';
    const difficultySettings = {
        easy: {
            baseInterval: 150, // Más lento en modo fácil
            obstacleSpawnRate: 0.4, // Menos obstáculos
            powerUpSpawnRate: 0.05, // Más power-ups
            speedBoostReduction: 40, // Menor boost de velocidad
            slowBoostIncrease: 50, // Mayor ralentización
            scoreMultiplierValue: 3, // Mayor multiplicador de puntuación
            powerUpDuration: 10000 // Mayor duración de power-ups
        },
        normal: {
            baseInterval: 130, // Velocidad normal (como está actualmente)
            obstacleSpawnRate: 0.7,
            powerUpSpawnRate: 0.03,
            speedBoostReduction: 60,
            slowBoostIncrease: 30,
            scoreMultiplierValue: 2.5,
            powerUpDuration: 8000
        },
        hard: {
            baseInterval: 110, // Más rápido en modo difícil
            obstacleSpawnRate: 0.9, // Más obstáculos
            powerUpSpawnRate: 0.02, // Menos power-ups
            speedBoostReduction: 80, // Mayor boost de velocidad
            slowBoostIncrease: 20, // Menor ralentización
            scoreMultiplierValue: 2, // Menor multiplicador de puntuación
            powerUpDuration: 6000 // Menor duración de power-ups
        }
    };
    
    // Establecer valores según dificultad actual
    let obstacleSpawnRate = difficultySettings[currentDifficulty].obstacleSpawnRate;
    let powerUpSpawnRate = difficultySettings[currentDifficulty].powerUpSpawnRate;
    let isPaused = false; // Variable para controlar el estado de pausa


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
    // --- Funciones principales del juego ---
    function iniciarJuego() {
        // Aplicar configuración según la dificultad seleccionada
        const config = difficultySettings[currentDifficulty];
        gameIntervalTime = config.baseInterval;
        obstacleSpawnRate = config.obstacleSpawnRate;
        powerUpSpawnRate = config.powerUpSpawnRate;
        
        snake = [{ x: canvasSize / 2, y: canvasSize / 2 }];
        direction = 'RIGHT';
        food = generarComida();
        obstacles = [];
        powerUps = [];
        score = 0;
        scoreMultiplier = 1;
        scoreDisplay.textContent = "Puntuación: " + score;
        activePowerUpDisplay.textContent = "Power Up activo: Ninguno";
        isPaused = false;
        startGameButton.textContent = "Pausar";
        startGameButton.style.display = 'block';
        restartGameInterval();
    }
    function restartGameInterval() {
        // Siempre limpiamos el intervalo anterior y creamos uno nuevo con la velocidad actualizada
        if (gameInterval) clearInterval(gameInterval);
        // Crear un nuevo intervalo con la velocidad actualizada
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
        // Si el juego está pausado, no procesamos la lógica del juego
        if (isPaused) {
            // Solo dibujamos el mensaje de pausa sin modificar el estado del juego
            drawPauseMessage();
            return;
        }
        
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
ctx.beginPath();
        ctx.arc(food.x + gridSize/2, food.y + gridSize/2, gridSize/2, 0, Math.PI * 2);
        ctx.fillStyle = '#E74C3C'; // Rojo brillante más atractivo para la fruta
        ctx.fill();
        ctx.closePath();
        
        // Si el juego está pausado, mostrar mensaje de pausa
        if (isPaused) {
            drawPauseMessage();
        }


        
        // Dibujar obstáculos
        ctx.fillStyle = 'gray';
        obstacles.forEach(obstaculo => {
            ctx.fillRect(obstaculo.x, obstaculo.y, gridSize, gridSize);
        });
        
        // Dibujar power-ups
        powerUps.forEach(pu => {
            ctx.fillStyle = getPowerUpColor(pu.tipo);
            ctx.beginPath();
            ctx.moveTo(pu.x + gridSize/2, pu.y); // Top vertex
            ctx.lineTo(pu.x + gridSize, pu.y + gridSize); // Bottom right vertex
            ctx.lineTo(pu.x, pu.y + gridSize); // Bottom left vertex
            ctx.closePath();
            ctx.fill();
        });
        
        // Dibujar serpiente
        ctx.fillStyle = 'green';
        snake.forEach(segment => {
            ctx.fillRect(segment.x, segment.y, gridSize, gridSize);
        });
    }
function getPowerUpColor(tipo) {
    switch(tipo) {
        case 'speed':
            return '#FFA500'; // Naranja brillante - energía y velocidad
        case 'slow':
            return '#4169E1'; // Azul real - calma y control
        case 'score':
            return '#FFD700'; // Dorado - valor y recompensa
        case 'shrink':
            return '#9932CC'; // Púrpura - transformación y cambio
        default:
            return '#FFFFFF'; // Blanco por defecto
    }
}
function activarPowerUp(powerUp) {
    const config = difficultySettings[currentDifficulty];
    const wasPaused = isPaused; // Guardamos el estado de pausa actual
    
    switch (powerUp.tipo) {
        case 'speed':
            clearTimeout(speedTimeout);
            gameIntervalTime = config.baseInterval - config.speedBoostReduction;
            // Solo reiniciamos el intervalo si el juego está en marcha
            if (!wasPaused) {
                restartGameInterval();
            }
            activePowerUpDisplay.textContent = "Power Up activo: Speed Boost";
            speedTimeout = setTimeout(() => {
                gameIntervalTime = config.baseInterval;
                // Solo reiniciamos el intervalo si el juego está en marcha
                if (!isPaused) {
                    restartGameInterval();
                }
                activePowerUpDisplay.textContent = "Power Up activo: Ninguno";
            }, config.powerUpDuration);
            break;
            
        case 'slow':
            clearTimeout(slowTimeout);
            gameIntervalTime = config.baseInterval + config.slowBoostIncrease;
            // Solo reiniciamos el intervalo si el juego está en marcha
            if (!wasPaused) {
                restartGameInterval();
            }
            activePowerUpDisplay.textContent = "Power Up activo: Slow Down";
            slowTimeout = setTimeout(() => {
                gameIntervalTime = config.baseInterval;
                // Solo reiniciamos el intervalo si el juego está en marcha
                if (!isPaused) {
                    restartGameInterval();
                }
                activePowerUpDisplay.textContent = "Power Up activo: Ninguno";
            }, config.powerUpDuration);
            break;
            
        case 'score':
            clearTimeout(scoreTimeout);
            scoreMultiplier = config.scoreMultiplierValue;
            activePowerUpDisplay.textContent = "Power Up activo: Score Multiplier";
            scoreTimeout = setTimeout(() => {
                scoreMultiplier = 1;
                activePowerUpDisplay.textContent = "Power Up activo: Ninguno";
            }, config.powerUpDuration);
            break;
        case 'shrink':
            if (snake.length > 3) {
                snake = snake.slice(0, Math.max(3, Math.floor(snake.length * 0.6))); // Reducción menos drástica
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
        isPaused = false;
        startGameButton.textContent = "Iniciar Juego";
        enviarPuntuacion(score);
        mostrarGameOver();
    }

    function enviarPuntuacion(finalScore) {
        fetch('../backend/guardar_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: finalScore })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "error") {
                console.error('Error al guardar puntuación:', data.message);
            }
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
    
    // Event listeners para los botones de dificultad
    document.querySelectorAll('.difficulty-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Quitar la clase 'active' de todos los botones
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Añadir la clase 'active' al botón seleccionado
            this.classList.add('active');
            
            // Actualizar la dificultad actual
            currentDifficulty = this.getAttribute('data-difficulty');
            
            // Si hay un juego en curso, preguntar si quiere reiniciar con la nueva dificultad
            if (gameInterval && !isPaused) {
                if (confirm('¿Quieres reiniciar el juego con la nueva dificultad?')) {
                    iniciarJuego();
                }
            }
        });
    });

    startGameButton.addEventListener('click', () => {
        if (gameInterval || isPaused) {
            // Si ya hay un juego en curso, alternar entre pausar y reanudar
            if (!isPaused) {
                // Pausar el juego
                clearInterval(gameInterval);
                // Guardamos el intervalo pero no lo establecemos a null para mantener el estado
                isPaused = true;
                startGameButton.textContent = "Reanudar";
                drawPauseMessage();
            } else {
                // Reanudar el juego
                isPaused = false;
                startGameButton.textContent = "Pausar";
                // Crear un nuevo intervalo para continuar el juego
                gameInterval = setInterval(gameLoop, gameIntervalTime);
            }
        } else {
            // Iniciar un nuevo juego
            iniciarJuego();
        }
    });

    // --- Inicialización ---
    // Función para dibujar mensaje de pausa
    function drawPauseMessage() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSA', canvas.width / 2, canvas.height / 2);
    }
    
    // --- Inicialización ---
    leyendaSidebar.style.display = 'none';
    const legendItems = leyendaSidebar.querySelectorAll('li');
    legendItems.forEach(item => {
        const powerUpType = item.querySelector('img')?.alt.toLowerCase();
        if (powerUpType && ['speed', 'slow', 'score', 'shrink'].includes(powerUpType)) {
            const color = getPowerUpColor(powerUpType);
            const triangleContainer = document.createElement('div');
            triangleContainer.style.width = '0';
            triangleContainer.style.height = '0';
            triangleContainer.style.borderLeft = '12px solid transparent';
            triangleContainer.style.borderRight = '12px solid transparent';
            triangleContainer.style.borderBottom = `24px solid ${color}`;
            triangleContainer.style.display = 'inline-block';
            triangleContainer.style.marginRight = '8px';
            triangleContainer.style.verticalAlign = 'middle';
        
            const existingIcon = item.querySelector('img');
            if (existingIcon) {
                existingIcon.parentNode.replaceChild(triangleContainer, existingIcon);
            }
        }
    });
});