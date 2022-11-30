import { EaseOut, Normalize } from "./Utils.js";
import { CellShape, GameOptions } from "./GameOptions.js";
import { DrawCircle, DrawRect } from "./CanvasUtils.js";

export type CellType = {
  ctx: CanvasRenderingContext2D;
  posX: number;
  posY: number;
  alive: boolean;
  diedAt: number;
  cellSize: number;
  shape: CellShape;
  color: string;
}

export type DrawOptions = {
  timeStamp: number;
  gameOptions: GameOptions;
}

export class Cell {
  ctx: CanvasRenderingContext2D;
  posX: number;
  posY: number;
  alive: boolean;
  diedAt: number;
  cellSize: number;
  shape: CellShape;
  color: string;

  constructor({ ctx, posX, posY, alive, diedAt, cellSize, shape, color }: CellType) {
    this.ctx = ctx;
    this.posX = posX;
    this.posY = posY;
    this.alive = alive;
    this.diedAt = diedAt;
    this.cellSize = cellSize;
    this.shape = shape;
    this.color = color;
  }

  draw({ timeStamp, gameOptions }: DrawOptions): void {
    let color = this.color;

    if (!this.alive) {
      if (!gameOptions.fadeDeadCells) { return; }

      const elapsed = timeStamp - this.diedAt;

      if (this.diedAt == -1) { return; }

      if (elapsed > 1000) {
        this.diedAt = -1;
        return;
      }

      //TODO: Use cell color here.
      color = `rgba(226, 78, 27, ${Math.max(1.0 - EaseOut(Normalize(elapsed, 1000, 0)), 0)})`;
    }

    this.ctx.beginPath();
    if (this.shape === "circle") {
      if (gameOptions.showGrid) {
        DrawCircle(this.ctx, color,
          {
            x: (this.posX * this.cellSize) + this.cellSize / 2,
            y: (this.posY * this.cellSize) + this.cellSize / 2
          },
          (this.cellSize / 2) - 1);
      } else {
        DrawCircle(this.ctx, color,
          {
            x: (this.posX * this.cellSize) + this.cellSize / 2,
            y: (this.posY * this.cellSize) + this.cellSize / 2
          },
          (this.cellSize / 2));
      }
    } else {
      if (gameOptions.showGrid) {
        DrawRect(this.ctx, this.color,
          { x: (this.posX * this.cellSize) + 1, y: (this.posY * this.cellSize) + 1 },
          { x: this.cellSize - 2, y: this.cellSize - 2 });
      } else {
        DrawRect(this.ctx, this.color,
          { x: (this.posX * this.cellSize), y: (this.posY * this.cellSize) },
          { x: this.cellSize, y: this.cellSize });
      }
    }
    this.ctx.closePath();
  }
}