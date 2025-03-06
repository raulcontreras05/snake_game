document.addEventListener('DOMContentLoaded', () => {
    // --- Pre-carga de imágenes ---
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

    function preloadAllImages(callback) {
        const images = [fruitIcon, powerUpIcons.speed, powerUpIcons.slow, powerUpIcons.score, powerUpIcons.shrink];
        let loadedCount = 0;
        images.forEach(img => {
            img.onload = () => {
                loadedCount++;
                if (loadedCount === images.length) {
                    callback();
                }
            };
            img.onerror = () => {
                console.error("Error al cargar la imagen:", img.src);
                loadedCount++;
                if (loadedCount === images.length) {
                    callback();
                }
            };
        });
    }

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
    leyendaSidebar.style.display = 'none';
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
    let gameIntervalTime = 200;
    let scoreMultiplier = 1;
    let speedTimeout, slowTimeout, scoreTimeout;

    /* =============================
       Funciones de Autenticación
       ============================= */
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
            if (data.status === 'success') {
                mostrarLogin();
            }
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
                // Mostrar el botón "Iniciar Juego" para que el jugador decida cuándo empezar
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

    /* =============================
       Funciones del Ranking
       ============================= */
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
            } else {
                alert('Error al obtener el ranking');
            }
        })
        .catch(error => console.error('Error:', error));
    };

    window.cerrarRanking = function() {
        rankingDiv.classList.add('hidden');
    };

    /* =============================
       Funciones del Juego
       ============================= */
    function iniciarJuego() {
        snake = [{ x: canvasSize / 2, y: canvasSize / 2 }];
        direction = 'RIGHT';
        food = generarComida();
        obstacles = [];
        powerUps = [];
        score = 0;
        scoreMultiplier = 1;
        gameIntervalTime = 200;
        scoreDisplay.textContent = "Puntuación: " + score;
        activePowerUpDisplay.textContent = "Power Up activo: Ninguno";
        restartGameInterval();
    }

    function restartGameInterval() {
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameIntervalTime);
    }

    function generarComida() {
        let newFood, valid = false;
        while (!valid) {
            newFood = {
                x: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize,
                y: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize
            };
            valid = true;
            for (let segment of snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    valid = false;
                    break;
                }
            }
            if (valid) {
                for (let obstaculo of obstacles) {
                    if (obstaculo.x === newFood.x && obstaculo.y === newFood.y) {
                        valid = false;
                        break;
                    }
                }
            }
            if (valid) {
                for (let pu of powerUps) {
                    if (pu.x === newFood.x && pu.y === newFood.y) {
                        valid = false;
                        break;
                    }
                }
            }
        }
        return newFood;
    }

    function generarObstaculo() {
        return {
            x: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize,
            y: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize
        };
    }

    function generarPowerUp() {
        const tipos = ['speed', 'slow', 'score', 'shrink'];
        const tipo = tipos[Math.floor(Math.random() * tipos.length)];
        const duration = 10000;
        let newPU, valid = false;
        while (!valid) {
            newPU = {
                x: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize,
                y: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize,
                tipo: tipo,
                expireTime: Date.now() + duration
            };
            valid = true;
            for (let segment of snake) {
                if (segment.x === newPU.x && segment.y === newPU.y) {
                    valid = false;
                    break;
                }
            }
            if (valid) {
                for (let obstaculo of obstacles) {
                    if (obstaculo.x === newPU.x && obstaculo.y === newPU.y) {
                        valid = false;
                        break;
                    }
                }
            }
            if (valid && food.x === newPU.x && food.y === newPU.y) {
                valid = false;
            }
        }
        return newPU;
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
        for (let part of snake) {
            if (head.x === part.x && head.y === part.y) {
                terminarJuego();
                return;
            }
        }
        for (let obstaculo of obstacles) {
            if (head.x === obstaculo.x && head.y === obstaculo.y) {
                terminarJuego();
                return;
            }
        }
        for (let i = 0; i < powerUps.length; i++) {
            let pu = powerUps[i];
            if (head.x === pu.x && head.y === pu.y) {
                activarPowerUp(pu);
                powerUps.splice(i, 1);
                break;
            }
        }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score += 10 * scoreMultiplier;
            scoreDisplay.textContent = "Puntuación: " + score;
            food = generarComida();
            if (Math.random() < 0.3) {
                obstacles.push(generarObstaculo());
            }
        } else {
            snake.pop();
        }
        if (Math.random() < 0.02) {
            powerUps.push(generarPowerUp());
        }
        powerUps = powerUps.filter(pu => Date.now() < pu.expireTime);
        dibujar();
    }

    function dibujar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (fruitIcon.complete && fruitIcon.naturalWidth !== 0) {
            ctx.drawImage(fruitIcon, food.x, food.y, gridSize, gridSize);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(food.x, food.y, gridSize, gridSize);
        }
        ctx.fillStyle = 'gray';
        obstacles.forEach(obstaculo => {
            ctx.fillRect(obstaculo.x, obstaculo.y, gridSize, gridSize);
        });
        powerUps.forEach(pu => {
            const icon = powerUpIcons[pu.tipo];
            if (icon && icon.complete && icon.naturalWidth !== 0) {
                ctx.drawImage(icon, pu.x, pu.y, gridSize, gridSize);
            } else {
                switch (pu.tipo) {
                    case 'speed': ctx.fillStyle = 'orange'; break;
                    case 'slow': ctx.fillStyle = 'blue'; break;
                    case 'score': ctx.fillStyle = 'purple'; break;
                    case 'shrink': ctx.fillStyle = 'pink'; break;
                    default: ctx.fillStyle = 'white'; break;
                }
                ctx.fillRect(pu.x, pu.y, gridSize, gridSize);
            }
        });
        ctx.fillStyle = 'green';
        snake.forEach(part => {
            ctx.fillRect(part.x, part.y, gridSize, gridSize);
        });
    }

    document.addEventListener('keydown', (event) => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
            event.preventDefault();
        }
        switch (event.key) {
            case 'ArrowRight': if (direction !== 'LEFT') direction = 'RIGHT'; break;
            case 'ArrowLeft': if (direction !== 'RIGHT') direction = 'LEFT'; break;
            case 'ArrowUp': if (direction !== 'DOWN') direction = 'UP'; break;
            case 'ArrowDown': if (direction !== 'UP') direction = 'DOWN'; break;
        }
    });

    function activarPowerUp(pu) {
        switch (pu.tipo) {
            case 'speed':
                clearTimeout(speedTimeout);
                gameIntervalTime = 100;
                restartGameInterval();
                activePowerUpDisplay.textContent = "Power Up activo: Speed Boost";
                speedTimeout = setTimeout(() => {
                    gameIntervalTime = 200;
                    restartGameInterval();
                    activePowerUpDisplay.textContent = "Power Up activo: Ninguno";
                }, 10000);
                break;
            case 'slow':
                clearTimeout(slowTimeout);
                gameIntervalTime = 300;
                restartGameInterval();
                activePowerUpDisplay.textContent = "Power Up activo: Slow Down";
                slowTimeout = setTimeout(() => {
                    gameIntervalTime = 200;
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
                    activePowerUpDisplay.textContent = "Power Up activo: Shrink (efecto inmediato)";
                    setTimeout(() => {
                        activePowerUpDisplay.textContent = "Power Up activo: Ninguno";
                    }, 2000);
                }
                break;
        }
    }

    function terminarJuego() {
        clearInterval(gameInterval);
        enviarPuntuacion(score, 1);
        mostrarGameOver();
    }

    function mostrarGameOver() {
        gameSection.style.display = 'none';
        gameOverScreen.style.display = 'block';
        finalScoreDisplay.textContent = "Tu puntuación fue: " + score;
    }

    function enviarPuntuacion(finalScore, elemento_id) {
        fetch('../backend/guardar_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: finalScore, elemento_id: elemento_id })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Respuesta al enviar puntuación:', data);
        })
        .catch(error => console.error('Error al enviar puntuación:', error));
    }

    window.reiniciarJuego = function() {
        clearInterval(gameInterval);
        gameOverScreen.style.display = 'none';
        gameSection.style.display = 'block';
        startGameButton.style.display = 'block';
    };

    window.mostrarMenuPrincipal = function() {
        clearInterval(gameInterval);
        gameOverScreen.style.display = 'none';
        gameSection.style.display = 'none';
        authSection.style.display = 'none';
        menuPrincipal.style.display = 'block';
    };

    window.toggleLeyenda = function() {
        if (leyendaSidebar.style.display === 'none' || leyendaSidebar.style.display === '') {
            leyendaSidebar.style.display = 'block';
        } else {
            leyendaSidebar.style.display = 'none';
        }
    };

    startGameButton.addEventListener('click', () => {
        iniciarJuego();
        startGameButton.style.display = 'none';
    });

    preloadAllImages(() => {
        console.log("Imágenes precargadas.");
    });
});
