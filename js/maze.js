class Maze {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = 16; // 1マスのサイズ
        this.layout = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,2,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,2,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
            [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,0,1,1,1,3,3,1,1,1,0,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,0,1,3,3,3,3,3,3,1,0,1,1,0,1,1,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,1,3,3,3,3,3,3,1,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,0,1,1,0,1,3,3,3,3,3,3,1,0,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,2,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,2,1],
            [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
            [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
            [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
            [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
    }

    // 迷路の描画
    draw() {
        for (let row = 0; row < this.layout.length; row++) {
            for (let col = 0; col < this.layout[row].length; col++) {
                const tile = this.layout[row][col];
                const x = col * this.tileSize;
                const y = row * this.tileSize;

                switch (tile) {
                    case 0: // パス（ドット配置場所）
                        this.drawDot(x, y);
                        break;
                    case 1: // 壁
                        this.drawWall(x, y);
                        break;
                    case 2: // パワーエサ
                        this.drawPowerPellet(x, y);
                        break;
                    case 3: // ゴースト待機エリア
                        this.ctx.fillStyle = '#000';
                        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
                        break;
                }
            }
        }
    }

    // 壁の描画
    drawWall(x, y) {
        this.ctx.fillStyle = '#00f';
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
    }

    // ドットの描画
    drawDot(x, y) {
        this.ctx.fillStyle = '#fff';
        const dotSize = 2;
        const offset = (this.tileSize - dotSize) / 2;
        this.ctx.fillRect(x + offset, y + offset, dotSize, dotSize);
    }

    // パワーエサの描画
    drawPowerPellet(x, y) {
        this.ctx.fillStyle = '#fff';
        const pelletSize = 8;
        const offset = (this.tileSize - pelletSize) / 2;
        this.ctx.beginPath();
        this.ctx.arc(
            x + offset + pelletSize / 2,
            y + offset + pelletSize / 2,
            pelletSize / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    // 指定された位置が壁かどうかを判定
    isWall(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        return this.layout[row][col] === 1;
    }

    // 指定された位置にドットがあるかどうかを判定
    hasDot(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        return this.layout[row][col] === 0;
    }

    // ドットを消去
    removeDot(col, row) {
        // 範囲チェック
        if (row < 0 || row >= this.layout.length || col < 0 || col >= this.layout[0].length) {
            return false;
        }

        // パワーエサの場合
        if (this.layout[row][col] === 2) {
            this.layout[row][col] = 4; // 食べられた状態
            const event = new CustomEvent('powerPelletEaten');
            document.dispatchEvent(event);
            return true;
        }

        // 通常のドットの場合
        if (this.layout[row][col] === 0) {
            this.layout[row][col] = 4; // 食べられた状態
            return true;
        }

        return false;
    }
}