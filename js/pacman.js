class Pacman {
    constructor(canvas, maze) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.maze = maze;
        this.tileSize = maze.tileSize;
        
        // パックマンの初期位置（14行目、14列目）
        this.x = 14 * this.tileSize;
        this.y = 23 * this.tileSize;
        this.direction = 0; // 0: 右, 1: 上, 2: 左, 3: 下
        this.nextDirection = 0;
        this.speed = 1.33; // ゴーストと同じ速度に調整
        this.mouthOpen = 0.2;
        this.mouthSpeed = 0.05;
        this.opening = true;
    }

    draw() {
        this.ctx.save();
        
        // 位置を整数に丸める
        const drawX = Math.round(this.x);
        const drawY = Math.round(this.y);
        
        this.ctx.translate(
            drawX + this.tileSize / 2,
            drawY + this.tileSize / 2
        );
        
        // 方向に応じた角度に回転（0: 右, 1: 上, 2: 左, 3: 下）
        let angle = 0;
        switch (this.direction) {
            case 0: angle = 0; break;
            case 1: angle = -90; break;
            case 2: angle = 180; break;
            case 3: angle = 90; break;
        }
        this.ctx.rotate(angle * Math.PI / 180);
        
        // パックマンの本体を描画
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.tileSize / 2, this.mouthOpen * Math.PI, (2 - this.mouthOpen) * Math.PI);
        this.ctx.lineTo(0, 0);
        this.ctx.fillStyle = '#ff0';
        this.ctx.fill();
        
        this.ctx.restore();
        
        // 移動中のみ口のアニメーション
        if (this.isMoving()) {
            this.animateMouth();
        }
    }

    isMoving() {
        return this.canMove(this.x, this.y, this.direction);
    }

    animateMouth() {
        if (this.opening) {
            this.mouthOpen += this.mouthSpeed;
            if (this.mouthOpen >= 0.3) {
                this.opening = false;
            }
        } else {
            this.mouthOpen -= this.mouthSpeed;
            if (this.mouthOpen <= 0) {
                this.opening = true;
            }
        }
    }

    setDirection(direction) {
        this.nextDirection = direction;
    }

    canMove(x, y, direction) {
        const nextPos = this.getNextPosition(x, y, direction, this.speed);
        const margin = 2; // より柔軟な移動のために余裕を減らす
        
        // 中心点をメインにチェック
        const centerPoint = {
            x: nextPos.x + this.tileSize / 2,
            y: nextPos.y + this.tileSize / 2
        };

        // 中心点が壁なら移動不可
        if (this.maze.isWall(centerPoint.x, centerPoint.y)) {
            return false;
        }

        // 進行方向の前方のみチェック
        const frontPoint = { ...centerPoint };
        switch (direction) {
            case 0: frontPoint.x += this.tileSize / 2 - margin; break; // 右
            case 1: frontPoint.y -= this.tileSize / 2 - margin; break; // 上
            case 2: frontPoint.x -= this.tileSize / 2 - margin; break; // 左
            case 3: frontPoint.y += this.tileSize / 2 - margin; break; // 下
        }

        return !this.maze.isWall(frontPoint.x, frontPoint.y);
    }

    getNextPosition(x, y, direction, speed) {
        const nextPos = { x, y };
        switch (direction) {
            case 0: // 右
                nextPos.x += speed;
                break;
            case 1: // 上
                nextPos.y -= speed;
                break;
            case 2: // 左
                nextPos.x -= speed;
                break;
            case 3: // 下
                nextPos.y += speed;
                break;
        }
        return nextPos;
    }

    update() {
        // トンネルの処理
        if (this.x < -this.tileSize) {
            this.x = this.canvas.width;
        } else if (this.x > this.canvas.width) {
            this.x = -this.tileSize;
        }

        // 次の方向が移動可能な場合、方向を変更
        if (this.nextDirection !== this.direction && 
            this.canMove(this.x, this.y, this.nextDirection)) {
            this.direction = this.nextDirection;
        }

        // 現在の方向に移動可能な場合、移動
        if (this.canMove(this.x, this.y, this.direction)) {
            const nextPos = this.getNextPosition(this.x, this.y, this.direction, this.speed);
            
            // タイル境界での位置補正
            if (this.direction === 0 || this.direction === 2) { // 左右移動
                this.x = nextPos.x;
                // Y座標を緩やかに補正
                const targetY = Math.round(this.y / this.tileSize) * this.tileSize;
                if (Math.abs(targetY - this.y) > 1) { // 閾値を設定
                    this.y += Math.sign(targetY - this.y) * this.speed * 0.25;
                }
            } else { // 上下移動
                this.y = nextPos.y;
                // X座標を緩やかに補正
                const targetX = Math.round(this.x / this.tileSize) * this.tileSize;
                if (Math.abs(targetX - this.x) > 1) { // 閾値を設定
                    this.x += Math.sign(targetX - this.x) * this.speed * 0.25;
                }
            }

            // パックマンの中心位置のタイル座標を計算
            const col = Math.floor((this.x + this.tileSize / 2) / this.tileSize);
            const row = Math.floor((this.y + this.tileSize / 2) / this.tileSize);
            
            // ドットの取得判定を常に行う
            if (this.maze.removeDot(col, row)) {
                const event = new CustomEvent('dotEaten');
                document.dispatchEvent(event);
            }
        }
    }

    checkCollision(ghost) {
        const distance = Math.hypot(
            (this.x + this.tileSize / 2) - (ghost.x + ghost.tileSize / 2),
            (this.y + this.tileSize / 2) - (ghost.y + ghost.tileSize / 2)
        );
        return distance < this.tileSize * 0.8;
    }
}