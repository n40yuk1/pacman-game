class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.maze = new Maze(this.canvas);
        this.pacman = new Pacman(this.canvas, this.maze);
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.frameCount = 0;
        this.dotCount = 0;

        // 4匹のゴーストを初期化
        this.ghosts = [
            new Blinky(this.canvas, this.maze),  // 赤:直接追跡
            new Pinky(this.canvas, this.maze),   // ピンク:先回り
            new Inky(this.canvas, this.maze),    // 青:Blinkyと連携
            new Clyde(this.canvas, this.maze)    // オレンジ:気まぐれ
        ];

        // ゴーストを開始
        this.ghosts.forEach(ghost => ghost.start());

        // スコア計算用の定数
        this.SCORES = {
            DOT: 10,
            POWER_PELLET: 50,
            GHOST: 200
        };

        // 初期ドット数のカウント
        this.countInitialDots();

        // イベントリスナーの設定
        this.setupInputHandlers();
        // ドットを食べた時のイベント
        document.addEventListener('dotEaten', () => {
            this.frameCount = 0;
            this.updateScore(this.SCORES.DOT);
            this.dotCount--;
            
            if (this.dotCount <= 0) {
                this.levelUp();
            }
        });

        // パワーエサを食べた時のイベント
        document.addEventListener('powerPelletEaten', () => {
            this.updateScore(this.SCORES.POWER_PELLET);
            this.ghosts.forEach(ghost => {
                if (!ghost.isEaten) {
                    ghost.makeVulnerable();
                }
            });
        });

        // FPS制御
        this.fps = 60;
        this.fpsInterval = 1000 / this.fps;
        this.then = performance.now();
        
        // ゲームループの開始
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    setupInputHandlers() {
        document.addEventListener('keydown', (event) => {
            if (this.isGameOver) {
                if (event.key === 'r' || event.key === 'R') {
                    this.resetGame();
                }
                return;
            }

            if (event.key === 'p' || event.key === 'P') {
                this.togglePause();
                return;
            }

            const keyMap = {
                'ArrowRight': 0,
                'ArrowUp': 1,
                'ArrowLeft': 2,
                'ArrowDown': 3
            };

            if (!this.isPaused && keyMap.hasOwnProperty(event.key)) {
                event.preventDefault();
                this.pacman.setDirection(keyMap[event.key]);
            }
        });
    }

    countInitialDots() {
        this.dotCount = 0;
        for (let row = 0; row < this.maze.layout.length; row++) {
            for (let col = 0; col < this.maze.layout[row].length; col++) {
                if (this.maze.layout[row][col] === 0) {
                    this.dotCount++;
                }
            }
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.then = performance.now();
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score.toString().padStart(6, '0');
    }

    checkCollisions() {
        for (const ghost of this.ghosts) {
            if (this.pacman.checkCollision(ghost)) {
                if (ghost.isVulnerable) {
                    ghost.isEaten = true;
                    this.updateScore(this.SCORES.GHOST);
                    setTimeout(() => {
                        ghost.reset(14, 11);
                    }, 500);
                } else if (!ghost.isEaten) {
                    this.loseLife();
                    break;
                }
            }
        }
    }

    loseLife() {
        this.lives--;
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetPositions();
        }
    }

    resetPositions() {
        this.pacman = new Pacman(this.canvas, this.maze);
        this.ghosts.forEach((ghost, index) => {
            const startX = 14 - 1 + index; // ゴーストの初期位置を少しずつずらす
            ghost.reset(startX, 11);
        });
        
        this.isPaused = true;
        setTimeout(() => {
            // ゴーストを開始
            this.ghosts.forEach(ghost => ghost.start());
            this.isPaused = false;
            this.then = performance.now();
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }, 1000);
    }

    levelUp() {
        this.level++;
        this.ghosts.forEach(ghost => ghost.speed *= 1.1);
        this.maze = new Maze(this.canvas);
        this.resetPositions();
        this.countInitialDots();
    }

    gameOver() {
        this.isGameOver = true;
        
        const highScore = localStorage.getItem('pacmanHighScore') || 0;
        if (this.score > highScore) {
            localStorage.setItem('pacmanHighScore', this.score);
        }

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ff0';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(
            `SCORE: ${this.score}`,
            this.canvas.width / 2,
            this.canvas.height / 2
        );
        this.ctx.fillText(
            `HIGH SCORE: ${Math.max(this.score, highScore)}`,
            this.canvas.width / 2,
            this.canvas.height / 2 + 30
        );
        this.ctx.fillText(
            'Press R to Restart',
            this.canvas.width / 2,
            this.canvas.height / 2 + 80
        );
    }

    resetGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        document.getElementById('score').textContent = '000000';
        
        this.isGameOver = false;
        this.isPaused = false;
        
        this.maze = new Maze(this.canvas);
        this.pacman = new Pacman(this.canvas, this.maze);
        this.ghosts = [
            new Blinky(this.canvas, this.maze),
            new Pinky(this.canvas, this.maze),
            new Inky(this.canvas, this.maze),
            new Clyde(this.canvas, this.maze)
        ];

        // ゴーストを開始
        this.ghosts.forEach(ghost => ghost.start());

        this.countInitialDots();
        
        this.then = performance.now();
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    update() {
        if (this.isGameOver || this.isPaused) return;

        this.pacman.update();

        const blinky = this.ghosts[0]; // Blinkyは常に最初のゴースト
        this.ghosts.forEach(ghost => {
            if (ghost instanceof Inky) {
                // Inkyの場合、Blinkyの位置も渡す
                ghost.update(
                    this.pacman.x,
                    this.pacman.y,
                    this.pacman.direction,
                    blinky.x,
                    blinky.y
                );
            } else {
                ghost.update(
                    this.pacman.x,
                    this.pacman.y,
                    this.pacman.direction
                );
            }
        });

        this.checkCollisions();
        this.frameCount++;
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.maze.draw();
        this.drawHUD();
        this.pacman.draw();
        this.ghosts.forEach(ghost => ghost.draw());

        if (this.isPaused) {
            this.drawPauseScreen();
        }
    }

    drawHUD() {
        this.ctx.fillStyle = '#ff0';
        for (let i = 0; i < this.lives; i++) {
            this.ctx.beginPath();
            this.ctx.arc(
                20 + i * 20,
                this.canvas.height - 20,
                8,
                0.2 * Math.PI,
                1.8 * Math.PI
            );
            this.ctx.lineTo(20 + i * 20, this.canvas.height - 20);
            this.ctx.fill();
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(
            `Level ${this.level}`,
            this.canvas.width - 10,
            this.canvas.height - 10
        );
    }

    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ff0';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'PAUSED',
            this.canvas.width / 2,
            this.canvas.height / 2
        );
    }

    gameLoop(timestamp) {
        if (this.isGameOver || this.isPaused) return;

        const elapsed = timestamp - this.then;

        if (elapsed > this.fpsInterval) {
            this.then = timestamp - (elapsed % this.fpsInterval);
            this.update();
            this.draw();
        }

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
}

window.onload = () => {
    new Game();
};
