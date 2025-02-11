class Ghost {
    constructor(canvas, maze, startX, startY, color) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.maze = maze;
        this.tileSize = maze.tileSize;
        this.startX = startX;
        this.startY = startY;
        
        // 基本設定
        this.color = color;
        this.direction = 1;  // 0:右, 1:上, 2:左, 3:下
        this.speed = 1.5;  // 初期速度を1.5に変更
        
        // 状態管理
        this.isVulnerable = false;
        this.isEaten = false;
        this.isBlinking = false;
        this.scatterMode = true;
        this.scatterTimer = 0;
        this.scatterDuration = 7000;
        this.chaseDuration = 20000;
        this.isActive = false;  // ゴーストがアクティブかどうか
        
        // 移動優先順位(上、左、下、右)
        this.priorityOrder = [1, 2, 3, 0];

        // 初期位置に配置
        this.reset(startX, startY);
    }

    start() {
        this.isActive = true;
        this.scatterTimer = 0;
        this.scatterMode = true;
        this.direction = 1;  // 上向きで開始
        this.speed = this.baseSpeed || 1.5;  // 速度を初期化
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
        
        this.ctx.fillStyle = ghostColor;
        this.ctx.fill();

        if (!this.isEaten) {
            this.drawEyes();
        }
        
        this.ctx.restore();
    }

    drawEyes() {
        const eyeX1 = Math.round(this.x) - this.tileSize / 6;
        const eyeX2 = Math.round(this.x) + this.tileSize / 6;
        const eyeY = Math.round(this.y);

        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(eyeX1, eyeY, 3, 0, Math.PI * 2);
        this.ctx.arc(eyeX2, eyeY, 3, 0, Math.PI * 2);
        this.ctx.fill();

        const pupilOffset = this.getPupilOffset();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(
            eyeX1 + pupilOffset.x,
            eyeY + pupilOffset.y,
            1.5,
            0,
            Math.PI * 2
        );
        this.ctx.arc(
            eyeX2 + pupilOffset.x,
            eyeY + pupilOffset.y,
            1.5,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    getPupilOffset() {
        switch (this.direction) {
            case 0: return { x: 1, y: 0 };
            case 1: return { x: 0, y: -1 };
            case 2: return { x: -1, y: 0 };
            case 3: return { x: 0, y: 1 };
            default: return { x: 0, y: 0 };
        }
    }

    canMove(tileX, tileY, direction) {
        // トンネルの特別処理
        if (tileY === 14 && (tileX < 0 || tileX >= this.maze.layout[0].length)) {
            return true;
        }

        // 次のタイル位置を計算
        let nextTileX = tileX;
        let nextTileY = tileY;

        switch (direction) {
            case 0: nextTileX += 1; break; // 右
            case 1: nextTileY -= 1; break; // 上
            case 2: nextTileX -= 1; break; // 左
            case 3: nextTileY += 1; break; // 下
        }

        // 迷路の範囲外チェック(トンネル以外)
        if (nextTileY < 0 || nextTileY >= this.maze.layout.length ||
            nextTileX < 0 || nextTileX >= this.maze.layout[0].length) {
            return false;
        }

        // 移動先のタイルが壁かどうかをチェック
        return this.maze.layout[nextTileY][nextTileX] !== 1;
    }

    getAvailableDirections() {
        // 上、左、下、右の優先順位
        const directionPriority = [1, 2, 3, 0];
        const oppositeDir = (this.direction + 2) % 4;
        const result = [];

        // タイル座標を取得
        const tileX = Math.floor(this.x / this.tileSize);
        const tileY = Math.floor(this.y / this.tileSize);

        // タイル中心からの距離を計算
        const offsetX = Math.abs(this.x - (tileX * this.tileSize + this.tileSize / 2));
        const offsetY = Math.abs(this.y - (tileY * this.tileSize + this.tileSize / 2));

        // タイル中心から離れている場合は現在の方向を維持
        if (offsetX > this.speed || offsetY > this.speed) {
            return this.canMove(tileX, tileY, this.direction) ? [this.direction] : [];
        }

        let availableCount = 0;
        // まず利用可能な方向の数を数える
        for (const dir of directionPriority) {
            if (this.canMove(tileX, tileY, dir)) {
                availableCount++;
            }
        }

        // 各方向をチェック
        for (const dir of directionPriority) {
            // 後ろ向きは、行き止まりか交差点(3方向以上移動可能)の場合のみ許可
            if (dir === oppositeDir && availableCount !== 1 && availableCount < 3) {
                continue;
            }

            if (this.canMove(tileX, tileY, dir)) {
                result.push(dir);
            }
        }

        return result;
    }

    isDeadEnd(tileX, tileY) {
        let availableMoves = 0;
        const directions = [0, 1, 2, 3];
        for (const dir of directions) {
            if (this.canMove(tileX, tileY, dir)) {
                availableMoves++;
            }
        }
        return availableMoves === 1;
    }

    isAtCrossroad() {
        // 現在のタイル位置を取得
        const currentTileX = Math.floor(this.x / this.tileSize);
        const currentTileY = Math.floor(this.y / this.tileSize);
        
        // タイルの中心にいるかチェック
        const isCentered =
            Math.abs((this.x % this.tileSize) - this.tileSize / 2) < 1 &&
            Math.abs((this.y % this.tileSize) - this.tileSize / 2) < 1;
            
        if (!isCentered) {
            return false;
        }

        // 利用可能な方向の数をカウント
        let availableCount = 0;
        for (let i = 0; i < 4; i++) {
            if (this.canMove(currentTileX * this.tileSize, currentTileY * this.tileSize, i)) {
                availableCount++;
            }
        }

        // 2つ以上の方向に進める場合は交差点と判定
        return availableCount >= 2;
    }

    isDeadEnd() {
        let availableCount = 0;
        for (let i = 0; i < 4; i++) {
            if (this.canMove(this.x, this.y, i)) {
                availableCount++;
            }
        }
        return availableCount === 1;
    }

    update(pacmanX, pacmanY, pacmanDirection) {
        if (!this.isActive) return;  // アクティブでない場合は更新しない

        this.updateMode();

        // トンネル処理
        if (this.x < -this.tileSize) {
            this.x = this.canvas.width;
        } else if (this.x > this.canvas.width) {
            this.x = -this.tileSize;
        }

        // 現在のタイル位置を取得
        const tileX = Math.floor(this.x / this.tileSize);
        const tileY = Math.floor(this.y / this.tileSize);

        // タイル中心からのオフセットを計算
        const offsetX = this.x - (tileX * this.tileSize + this.tileSize / 2);
        const offsetY = this.y - (tileY * this.tileSize + this.tileSize / 2);

        // タイル中心に近い場合は方向を決定
        if (Math.abs(offsetX) <= this.speed && Math.abs(offsetY) <= this.speed) {
            // 位置を正確にタイル中心に補正
            this.x = tileX * this.tileSize + this.tileSize / 2;
            this.y = tileY * this.tileSize + this.tileSize / 2;

            // 利用可能な方向を取得
            const availableDirections = this.getAvailableDirections();

            if (availableDirections.length > 0) {
                // モード変更直後は必ず方向転換
                if (this.modeJustChanged) {
                    this.direction = availableDirections[0];
                    this.modeJustChanged = false;
                }
                // 現在の方向が使えない場合は新しい方向を決定
                else if (!availableDirections.includes(this.direction)) {
                    const nextDir = this.decideNextDirection(pacmanX, pacmanY, pacmanDirection);
                    this.direction = availableDirections.includes(nextDir) ? nextDir : availableDirections[0];
                }
            }
        }

        // 移動処理
        const moveSpeed = this.speed;
        let nextX = this.x;
        let nextY = this.y;

        // 次の位置を計算
        switch (this.direction) {
            case 0: nextX += moveSpeed; break;
            case 1: nextY -= moveSpeed; break;
            case 2: nextX -= moveSpeed; break;
            case 3: nextY += moveSpeed; break;
        }

        // 次の位置のタイル座標を計算
        const nextTileX = Math.floor(nextX / this.tileSize);
        const nextTileY = Math.floor(nextY / this.tileSize);

        // 移動可能な場合のみ位置を更新
        if (this.canMove(nextTileX, nextTileY, this.direction)) {
            this.x = nextX;
            this.y = nextY;
        } else {
            // 移動できない場合は、新しい方向を即座に探す
            const availableDirections = this.getAvailableDirections();
            if (availableDirections.length > 0) {
                this.direction = availableDirections[0];
            }
        }
    }

    updateMode() {
        this.scatterTimer += 16;
        const wasScatterMode = this.scatterMode;
        
        // ゲーム開始からの経過時間(ミリ秒)
        const totalTime = this.scatterTimer;
        
        // オリジナルのパックマンに近いモード切替パターン
        const patterns = [
            { end: 7000, mode: true },    // 7秒: スキャター
            { end: 27000, mode: false },  // 20秒: チェイス
            { end: 34000, mode: true },   // 7秒: スキャター
            { end: 54000, mode: false },  // 20秒: チェイス
            { end: 59000, mode: true },   // 5秒: スキャター
            { end: 79000, mode: false },  // 20秒: チェイス
            { end: 84000, mode: true },   // 5秒: スキャター
        ];
        
        // 現在のモードを決定
        let newScatterMode = false;
        for (const pattern of patterns) {
            if (totalTime < pattern.end) {
                newScatterMode = pattern.mode;
                break;
            }
        }
        
        // モードが変更された場合
        if (wasScatterMode !== newScatterMode) {
            this.scatterMode = newScatterMode;
            this.modeJustChanged = true;
            
            // 方向転換を強制
            this.direction = (this.direction + 2) % 4;
            
            // 位置を調整して壁にめり込まないようにする
            const currentTileX = Math.floor(this.x / this.tileSize);
            const currentTileY = Math.floor(this.y / this.tileSize);
            this.x = currentTileX * this.tileSize + this.tileSize / 2;
            this.y = currentTileY * this.tileSize + this.tileSize / 2;
        }
    }

    countRemainingDots() {
        let count = 0;
        for (let row = 0; row < this.maze.layout.length; row++) {
            for (let col = 0; col < this.maze.layout[row].length; col++) {
                if (this.maze.layout[row][col] === 0) {
                    count++;
                }
            }
        }
        return count;
    }

    getCornerTarget() {
        return { x: 0, y: 0 };
    }

    decideNextDirection(pacmanX, pacmanY) {
        const availableDirections = this.getAvailableDirections();
        if (availableDirections.length === 0) return this.direction;

        let targetX, targetY;
        if (this.scatterMode) {
            const corner = this.getCornerTarget();
            targetX = corner.x;
            targetY = corner.y;
        } else {
            targetX = pacmanX;
            targetY = pacmanY;
        }

        return this.findBestDirection(availableDirections, targetX, targetY);
    }

    findBestDirection(availableDirections, targetX, targetY) {
        // ターゲットまでの方向を決定
        const dx = targetX - this.x;
        const dy = targetY - this.y;

        // 優先順位を計算(ターゲットに近づく方向を優先)
        const directions = [...availableDirections].sort((a, b) => {
            const moveA = this.getMoveForDirection(a, dx, dy);
            const moveB = this.getMoveForDirection(b, dx, dy);
            return moveB.priority - moveA.priority;
        });

        // モード切り替え時は必ず方向転換
        if (this.modeJustChanged) {
            this.modeJustChanged = false;
            // 現在の方向の反対を除外
            const opposite = (this.direction + 2) % 4;
            return directions.find(d => d !== opposite) || directions[0];
        }

        return directions[0];
    }

    getMoveForDirection(direction, dx, dy) {
        let priority = 0;
        const inBottomHalf = this.y > this.canvas.height / 2;

        // 上下方向の優先度を調整
        switch (direction) {
            case 0: // 右
                priority = dx > 0 ? 2 : 0;
                break;
            case 1: // 上
                // 下半分にいる場合、上方向の優先度を大幅に上げる
                priority = dy < 0 ? (inBottomHalf ? 5 : 3) : 0;
                break;
            case 2: // 左
                priority = dx < 0 ? 2 : 0;
                break;
            case 3: // 下
                // 上半分にいる場合のみ下方向を許可
                priority = (!inBottomHalf && dy > 0) ? 2 : 0;
                break;
        }

        // 現在の方向を維持するボーナス
        if (direction === this.direction) {
            priority += 1;
        }

        // 交差点での優先度調整
        if (this.isAtCrossroad()) {
            // 上下方向の移動をより優先
            if (direction === 1 || direction === 3) {
                priority += 2;
            }
        }

        return { direction, priority };
    }

    makeVulnerable() {
        this.isVulnerable = true;
        this.speed = 1;
        this.blinkStart = 0;
        this.isBlinking = false;
        
        clearTimeout(this.vulnerableTimeout);
        clearInterval(this.blinkInterval);
        
        // 7秒後に点滅開始
        this.vulnerableTimeout = setTimeout(() => {
            this.blinkStart = Date.now();
            this.blinkInterval = setInterval(() => {
                this.isBlinking = !this.isBlinking;
            }, 200);
            
            // 3秒間点滅した後、通常状態に戻る
            setTimeout(() => {
                this.isVulnerable = false;
                this.speed = 1.5;
                clearInterval(this.blinkInterval);
                this.isBlinking = false;
            }, 3000);
        }, 7000);
    }

    reset(startX, startY) {
        // 位置をタイルの中心に設定
        this.x = startX * this.tileSize + this.tileSize / 2;
        this.y = startY * this.tileSize + this.tileSize / 2;
        
        // 基本状態のリセット
        this.direction = 1;  // 上向きで開始
        this.lastDirection = -1;
        this.isVulnerable = false;
        this.isEaten = false;
        this.speed = this.baseSpeed || 1.5;
        this.scatterMode = true;
        this.scatterTimer = 0;
        this.isActive = true;  // アクティブ状態で開始
        this.modeJustChanged = false;
        
        // 点滅状態をリセット
        clearTimeout(this.vulnerableTimeout);
        clearInterval(this.blinkInterval);
        this.isBlinking = false;
        this.blinkStart = 0;
    }
}

class Blinky extends Ghost {
    constructor(canvas, maze) {
        super(canvas, maze, 13, 11, '#ff0000');
        this.baseSpeed = 2;
        this.speed = this.baseSpeed;
        this.elroy = false;  // イライラモード(ドットが少なくなると加速)
        this.elroyThreshold = 20;  // イライラモードに入るドット残り数
    }

    getCornerTarget() {
        return { x: this.maze.tileSize * 25, y: 0 };
    }

    decideNextDirection(pacmanX, pacmanY) {
        if (this.isVulnerable) {
            return super.decideNextDirection(pacmanX, pacmanY);
        }

        const availableDirections = this.getAvailableDirections();
        
        // ドット数が少なくなったらイライラモードに
        const remainingDots = this.countRemainingDots();
        this.elroy = remainingDots <= this.elroyThreshold;
        
        // イライラモード中は加速
        if (this.elroy && !this.isVulnerable) {
            this.speed = this.baseSpeed * 1.25;
        } else {
            // 通常時はパックマンとの距離に応じて速度調整
            const distance = Math.hypot(this.x - pacmanX, this.y - pacmanY);
            this.speed = this.baseSpeed + Math.min(distance / (this.tileSize * 15), 0.3);
        }

        // イライラモード中は常にパックマンを追いかける
        if (this.elroy) {
            return this.findBestDirection(availableDirections, pacmanX, pacmanY);
        }

        // スキャターモード中は右上のコーナーを目指す
        if (this.scatterMode) {
            const corner = this.getCornerTarget();
            return this.findBestDirection(availableDirections, corner.x, corner.y);
        }

        // 通常時はパックマンを直接追いかける
        return this.findBestDirection(availableDirections, pacmanX, pacmanY);
    }
}

class Pinky extends Ghost {
    constructor(canvas, maze) {
        super(canvas, maze, 14, 11, '#ffb8ff');
        this.baseSpeed = 1.8;
        this.speed = this.baseSpeed;
        this.ambushDistance = 4;
    }

    getCornerTarget() {
        return { x: 0, y: 0 };
    }

    decideNextDirection(pacmanX, pacmanY, pacmanDirection) {
        if (this.isVulnerable) {
            return super.decideNextDirection(pacmanX, pacmanY);
        }

        const availableDirections = this.getAvailableDirections();

        // スキャターモード中は左上のコーナーを目指す
        if (this.scatterMode) {
            const corner = this.getCornerTarget();
            return this.findBestDirection(availableDirections, corner.x, corner.y);
        }

        // パックマンの4タイル先を目標とする(オリジナルの仕様)
        let targetX = pacmanX;
        let targetY = pacmanY;

        // パックマンの向いている方向に応じて目標位置を設定
        const tileOffset = 4;  // 4タイル先を目標
        switch (pacmanDirection) {
            case 0: // 右
                targetX += this.tileSize * tileOffset;
                break;
            case 1: // 上
                targetX -= this.tileSize * tileOffset;  // 上向き時のバグを再現
                targetY -= this.tileSize * tileOffset;
                break;
            case 2: // 左
                targetX -= this.tileSize * tileOffset;
                break;
            case 3: // 下
                targetY += this.tileSize * tileOffset;
                break;
        }

        // 目標位置が壁の場合、最も近い通路に調整
        const targetTileX = Math.floor(targetX / this.tileSize);
        const targetTileY = Math.floor(targetY / this.tileSize);
        if (this.maze.isWall(targetX, targetY)) {
            // 最も近い通路を探す
            for (let radius = 1; radius < 5; radius++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    for (let dy = -radius; dy <= radius; dy++) {
                        const checkX = (targetTileX + dx) * this.tileSize;
                        const checkY = (targetTileY + dy) * this.tileSize;
                        if (!this.maze.isWall(checkX, checkY)) {
                            targetX = checkX;
                            targetY = checkY;
                            break;
                        }
                    }
                }
            }
        }

        return this.findBestDirection(availableDirections, targetX, targetY);
    }
}

class Inky extends Ghost {
    constructor(canvas, maze) {
        super(canvas, maze, 15, 11, '#00ffff');
        this.baseSpeed = 1.8;
        this.speed = this.baseSpeed;
    }

    adjustTargetPosition(x, y) {
        // 迷路の範囲内に収める
        const maxX = (this.maze.layout[0].length - 1) * this.tileSize;
        const maxY = (this.maze.layout.length - 1) * this.tileSize;
        
        const adjustedX = Math.max(0, Math.min(x, maxX));
        const adjustedY = Math.max(0, Math.min(y, maxY));
        
        // 目標位置が壁の場合、最も近い通路を探す
        const tileX = Math.floor(adjustedX / this.tileSize);
        const tileY = Math.floor(adjustedY / this.tileSize);
        
        if (this.maze.isWall(adjustedX, adjustedY)) {
            for (let radius = 1; radius < 5; radius++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    for (let dy = -radius; dy <= radius; dy++) {
                        const checkX = (tileX + dx) * this.tileSize;
                        const checkY = (tileY + dy) * this.tileSize;
                        if (!this.maze.isWall(checkX, checkY)) {
                            return { x: checkX, y: checkY };
                        }
                    }
                }
            }
        }
        
        return { x: adjustedX, y: adjustedY };
    }

    getCornerTarget() {
        return { x: this.maze.tileSize * 25, y: this.canvas.height };
    }

    decideNextDirection(pacmanX, pacmanY, pacmanDirection, blinkyX, blinkyY) {
        if (this.isVulnerable) {
            return super.decideNextDirection(pacmanX, pacmanY);
        }

        const availableDirections = this.getAvailableDirections();

        // スキャターモード中は右下のコーナーを目指す
        if (this.scatterMode) {
            const corner = this.getCornerTarget();
            return this.findBestDirection(availableDirections, corner.x, corner.y);
        }

        // パックマンの2タイル先の位置を計算
        let intermediateX = pacmanX;
        let intermediateY = pacmanY;

        switch (pacmanDirection) {
            case 0: // 右
                intermediateX += this.tileSize * 2;
                break;
            case 1: // 上
                intermediateX -= this.tileSize * 2;  // 上向き時のバグを再現
                intermediateY -= this.tileSize * 2;
                break;
            case 2: // 左
                intermediateX -= this.tileSize * 2;
                break;
            case 3: // 下
                intermediateY += this.tileSize * 2;
                break;
        }

        // Blinkyの位置を基準に目標位置を計算
        const targetX = intermediateX + (intermediateX - blinkyX);
        const targetY = intermediateY + (intermediateY - blinkyY);

        // 目標位置が迷路の範囲外の場合、最も近い有効な位置に調整
        const adjustedTarget = this.adjustTargetPosition(targetX, targetY);

        return this.findBestDirection(availableDirections, adjustedTarget.x, adjustedTarget.y);
    }
}

class Clyde extends Ghost {
    constructor(canvas, maze) {
        super(canvas, maze, 16, 11, '#ffb851');
        this.baseSpeed = 1.7;  // 最も遅い
        this.speed = this.baseSpeed;
        this.distanceThreshold = 8 * this.tileSize;  // 8タイルの距離閾値
    }

    getCornerTarget() {
        return { x: 0, y: this.canvas.height };
    }

    decideNextDirection(pacmanX, pacmanY) {
        if (this.isVulnerable) {
            return super.decideNextDirection(pacmanX, pacmanY);
        }

        const availableDirections = this.getAvailableDirections();

        // スキャターモード中は左下のコーナーを目指す
        if (this.scatterMode) {
            const corner = this.getCornerTarget();
            return this.findBestDirection(availableDirections, corner.x, corner.y);
        }

        // パックマンとの距離を
