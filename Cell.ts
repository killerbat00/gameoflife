import { EaseOut, Normalize } from "./Utils.js";

export type CellShape = "circle" | "square";

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

  draw(dt: number, fadeOut: boolean): void {
    if (!this.alive) {
      if (this.diedAt == -1) { return; }
      const elapsed = dt - this.diedAt;
      if (elapsed > 1000) { return; }

      if (fadeOut) {
        //TODO: Use cell color here.
        this.ctx.fillStyle = `rgba(226, 78, 27, ${Math.max(0.9 - EaseOut(Normalize(elapsed, 1500, 0)), 0)})`;
      } else {
        return;
      }
    } else {
      this.ctx.fillStyle = this.color;
    }

    this.ctx.beginPath();
    if (this.shape === "circle") {
      this.ctx.arc((this.posX * this.cellSize) + this.cellSize / 2,
        (this.posY * this.cellSize) + this.cellSize / 2,
        (this.cellSize / 2), 0, 2 * Math.PI);
    } else if (this.shape === "square") {
      this.ctx.fillRect((this.posX * this.cellSize) + 1, (this.posY * this.cellSize) + 1, this.cellSize - 2, this.cellSize - 2);
    }
    this.ctx.fill();
  }
}