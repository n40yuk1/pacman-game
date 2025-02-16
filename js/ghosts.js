class Ghost {
    constructor(canvas, maze, startX, startY, color) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.maze = maze;
        this.tileSize = maze.tileSize;
        this.respawnTimer = null;
        this.x = startX * this.tileSize + this.tileSize / 2;
        this.y = startY * this.tileSize + this.tileSize / 2;
        this.startX = startX;
        this.startY = startY;
        this.color = color;
        this.direction = 1;
        this.speed = 1.33; // 2 * (2/3) ≈ 1.33
        this.isVulnerable = false;
        this.isActive = false;
        this.isBlinking = false;
        this.isEaten = false;
        this.targetX = this.x;
        this.targetY = this.y;
    }

    start() {
        this.isActive = true;
    }

    reset() {
        const wasEaten = this.isEaten; // リセット前の状態を保存

        // 既存のタイマーをクリア
        if (this.respawnTimer) {
            clearTimeout(this.respawnTimer);
        }
        if (this.blinkTimer) {
            clearTimeout(this.blinkTimer);
        }
        if (this.vulnerableTimer) {
            clearTimeout(this.vulnerableTimer);
        }

        this.x = this.startX * this.tileSize + this.tileSize / 2;
        this.y = this.startY * this.tileSize + this.tileSize / 2;
        this.targetX = this.x;
        this.targetY = this.y;
        this.direction = 1;
        this.isVulnerable = false;
        this.isBlinking = false;

        if (wasEaten) {
            // 食べられた後のリセット
            this.isActive = false;
            this.isEaten = true; // 状態を維持
            this.respawnTimer = setTimeout(() => {
                this.isEaten = false;
                this.isActive = true;
            }, 7000);
        } else {
            // 通常のリセット（ゲーム開始時など）
            this.isActive = true;
            this.isEaten = false;
        }
    }

    getEaten() {
        if (this.isEaten) return; // 既に食べられている場合は無視

        // 既存のタイマーをクリア
        if (this.respawnTimer) clearTimeout(this.respawnTimer);
        if (this.blinkTimer) clearTimeout(this.blinkTimer);
        if (this.vulnerableTimer) clearTimeout(this.vulnerableTimer);

        this.isEaten = true;
        this.isActive = false;
        this.isVulnerable = false;
        this.isBlinking = false;

        // 7秒後に復活
        this.respawnTimer = setTimeout(() => {
            this.reset();
        }, 7000);
    }

    canMove(tileX, tileY) {
        // トンネル領域での特別な処理
        if (tileY === 14) {
            // トンネルの左端
            if (tileX < 0) {
                return this.direction === 2; // 左方向への移動のみ許可
            }
            // トンネルの右端
            if (tileX >= this.maze.layout[0].length) {
                return this.direction === 0; // 右方向への移動のみ許可
            }
            // トンネル内
            return true;
        }

        // 通常の移動可能判定
        if (tileY < 0 || tileY >= this.maze.layout.length ||
            tileX < 0 || tileX >= this.maze.layout[0].length) {
            return false;
        }

        return this.maze.layout[tileY][tileX] !== 1;
    }

    update(pacmanX, pacmanY) {
        if (!this.isActive) return;

        // トンネル処理
        const tunnelY = 14 * this.tileSize + this.tileSize / 2;
        if (Math.abs(this.y - tunnelY) < this.speed) {
            // トンネルの高さにいる場合
            if (this.x < -this.tileSize / 2) {
                this.x = this.canvas.width + this.tileSize / 2;
                this.targetX = this.x - this.tileSize;
            } else if (this.x > this.canvas.width + this.tileSize / 2) {
                this.x = -this.tileSize / 2;
                this.targetX = this.x + this.tileSize;
            }
        }

        // 現在のタイル位置
        const currentTileX = Math.floor(this.x / this.tileSize);
        const currentTileY = Math.floor(this.y / this.tileSize);

        // 目標位置に到達したかチェック
        if (Math.abs(this.x - this.targetX) < this.speed && Math.abs(this.y - this.targetY) < this.speed) {
            this.x = this.targetX;
            this.y = this.targetY;

            // 可能な方向をチェック
            const possibleDirs = [];
            for (let i = 0; i < 4; i++) {
                if ((i + 2) % 4 !== this.direction) { // 180度回転を防ぐ
                    let nextX = currentTileX;
                    let nextY = currentTileY;
                    switch (i) {
                        case 0: nextX++; break;
                        case 1: nextY--; break;
                        case 2: nextX--; break;
                        case 3: nextY++; break;
                    }
                    if (this.canMove(nextX, nextY)) {
                        possibleDirs.push(i);
                    }
                }
            }

            // ランダムに新しい方向を選択
            if (possibleDirs.length > 0) {
                this.direction = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                // 次の目標位置を設定
                switch (this.direction) {
                    case 0: this.targetX = (currentTileX + 1) * this.tileSize + this.tileSize / 2; break;
                    case 1: this.targetY = (currentTileY - 1) * this.tileSize + this.tileSize / 2; break;
                    case 2: this.targetX = (currentTileX - 1) * this.tileSize + this.tileSize / 2; break;
                    case 3: this.targetY = (currentTileY + 1) * this.tileSize + this.tileSize / 2; break;
                }
            }
        } else {
            // 目標位置に向かって移動
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            if (Math.abs(dx) > 0) {
                this.x += Math.sign(dx) * this.speed;
            }
            if (Math.abs(dy) > 0) {
                this.y += Math.sign(dy) * this.speed;
            }
        }
    }

    draw() {
        this.ctx.save();
        
        let ghostColor = this.color;
        if (this.isVulnerable) {
            ghostColor = this.isBlinking ? '#fff' : '#00f';
        } else if (this.isEaten) {
            ghostColor = '#000';
        }

        // 本体の描画
        this.ctx.fillStyle = ghostColor;
        this.ctx.beginPath();
        this.ctx.arc(
            Math.round(this.x),
            Math.round(this.y),
            this.tileSize / 2,
            Math.PI,
            0
        );
        
        const bottomY = Math.round(this.y);
        this.ctx.lineTo(Math.round(this.x) + this.tileSize / 2, Math.round(this.y) + this.tileSize / 2);
        for (let i = 0; i < 3; i++) {
            const wave = (i % 2 === 0) ? this.tileSize / 4 : 0;
            this.ctx.lineTo(
                Math.round(this.x) + this.tileSize / 2 - (i * this.tileSize / 3),
                bottomY + this.tileSize / 2 - wave
            );
        }
        this.ctx.lineTo(Math.round(this.x) - this.tileSize / 2, Math.round(this.y) + this.tileSize / 2);
        this.ctx.closePath();
        this.ctx.fill();

        if (!this.isEaten) {
            // 目を描画
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(this.x - this.tileSize / 4, this.y - this.tileSize / 8, 3, 0, Math.PI * 2);
            this.ctx.arc(this.x + this.tileSize / 4, this.y - this.tileSize / 8, 3, 0, Math.PI * 2);
            this.ctx.fill();

            // 瞳を描画
            this.ctx.fillStyle = '#000';
            const pupilOffset = {
                x: [2, 0, -2, 0][this.direction],
                y: [0, -2, 0, 2][this.direction]
            };
            this.ctx.beginPath();
            this.ctx.arc(
                this.x - this.tileSize / 4 + pupilOffset.x,
                this.y - this.tileSize / 8 + pupilOffset.y,
                1.5,
                0,
                Math.PI * 2
            );
            this.ctx.arc(
                this.x + this.tileSize / 4 + pupilOffset.x,
                this.y - this.tileSize / 8 + pupilOffset.y,
                1.5,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    makeVulnerable() {
        if (this.isEaten) return; // 既に食べられている場合は無視
        
        this.isVulnerable = true;
        this.isBlinking = false;
        
        // 既存のタイマーをクリア
        if (this.blinkTimer) clearTimeout(this.blinkTimer);
        if (this.vulnerableTimer) clearTimeout(this.vulnerableTimer);
        
        // 新しいタイマーを設定
        this.blinkTimer = setTimeout(() => {
            if (!this.isEaten) {
                this.isBlinking = true;
            }
        }, 7000);
        
        this.vulnerableTimer = setTimeout(() => {
            if (!this.isEaten) {
                this.isVulnerable = false;
                this.isBlinking = false;
            }
        }, 10000);
    }
}

class Blinky extends Ghost {
    constructor(canvas, maze) {
        super(canvas, maze, 13, 11, '#ff0000');
    }
}

class Pinky extends Ghost {
    constructor(canvas, maze) {
        super(canvas, maze, 14, 11, '#ffb8ff');
    }
}

class Inky extends Ghost {
    constructor(canvas, maze) {
        super(canvas, maze, 15, 11, '#00ffff');
    }
}

class Clyde extends Ghost {
    constructor(canvas, maze) {
        super(canvas, maze, 16, 11, '#ffb851');
    }
}
