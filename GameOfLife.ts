import { OneInFifteenChance } from "./Utils.js";
import { GameLoop } from "./GameLoop.js";
import { Cell, CellShape } from "./Cell.js";
import { DrawLine, DrawRect } from "./CanvasUtils.js";

type GameOptions = {
  showGrid: boolean;
  fadeDeadCells: boolean;
  cellShape: CellShape;
  updateCellsMs: number;
  updateMs: number;
  drawMs: number;
  bgColor: string;
  cellColor: string;
}

export class CellAutomata extends GameLoop {
  canvas!: HTMLCanvasElement;
  context!: CanvasRenderingContext2D;
  cells!: Cell[][];
  cellSize!: number;
  numRows!: number;
  numCols!: number;
  lastRefresh!: number;
  lastResize!: number;
  options!: GameOptions;

  constructor(options: GameOptions) {
    super(options.updateCellsMs, options.updateMs, options.drawMs);
    const canvi = document.getElementsByTagName("canvas");
    if (canvi.length === 0) {
      console.log("You forgot the canvas element, silly.");
      return;
    }
    this.canvas = canvi[0];
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.options = options;

    this.lastRefresh = 0;
    this.lastResize = 0;

    this.reset();
    this.start();
  }

  reset(): void {
    this.cellSize = 24;
    this.numRows = Math.floor(window.innerHeight / this.cellSize);
    this.numCols = Math.floor(window.innerWidth / this.cellSize);
    this.cells = this.generateCells();
  }

  drawGrid(): void {
    if (!this.options.showGrid) { return; }
    this.context.save();
    this.context.strokeStyle = `rgb(100, 100, 25)`;

    for (let x = 0; x <= this.numCols; x++) {
      DrawLine(this.context,
        { x: (x * this.cellSize), y: 0 },
        { x: (x * this.cellSize), y: (this.cellSize * this.numRows) }
      );
    }
    for (let y = 0; y <= this.numRows; y++) {
      DrawLine(this.context,
        { x: 0, y: (y * this.cellSize) },
        { x: this.cellSize * this.numCols, y: y * this.cellSize }
      );
    }
    this.context.restore();
  }

  resize(): void {
    const elapsed = (window.performance.now() - this.lastResize);
    // debounce 250ms
    if (this.lastResize > 0 && elapsed < 250) {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight
    if (width !== this.canvas.width || height !== this.canvas.height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.numCols = Math.ceil(width / this.cellSize);
      this.numRows = Math.ceil(height / this.cellSize)
    }
    this.lastResize = window.performance.now();
  }

  update(timeStamp: DOMHighResTimeStamp): void {
    return;
  }

  generateCells(): Cell[][] {
    let grid: Cell[][] = []
    for (let r = 0; r < this.numRows - 1; r++) {
      let row = [];
      for (let c = 0; c < this.numCols - 1; c++) {
        const cellArgs = {
          ctx: this.context,
          posX: c + 1,
          posY: r + 1,
          alive: !!OneInFifteenChance(),
          diedAt: -1,
          cellSize: this.cellSize,
          shape: this.options.cellShape,
          color: this.options.cellColor,
        };
        let cell = new Cell(cellArgs);
        row.push(cell);
      }
      grid.push(row);
    }
    this.lastRefresh = window.performance.now();
    return grid;
  }

  refresh(): void {
    let elapsed = (window.performance.now() - this.lastRefresh) / 1000;

    //only refresh once every 10s
    if (elapsed <= 10) {
      return;
    }

    for (let row of this.cells) {
      for (let cell of row) {
        if (!cell.alive) {
          cell.alive = !!OneInFifteenChance();
          cell.diedAt = -1;
        }
      }
    }

    this.lastRefresh = window.performance.now();
  }

  forceDraw(): void {
    this.draw(window.performance.now());
  }

  draw(timeStamp: DOMHighResTimeStamp): void {
    this.resize();
    DrawRect(this.context,
      this.options.bgColor,
      { x: 0, y: 0 },
      { x: this.canvas.width, y: this.canvas.height }
    );
    this.drawGrid()
    let totalAlive = 0;

    for (let row of this.cells) {
      for (let cell of row) {
        totalAlive += Number(cell.alive);
        cell.shape = this.options.cellShape;
        cell.draw(timeStamp, this.options.fadeDeadCells);
      }
    }
    // if there are < 5% alive, schedule a refresh
    if (totalAlive / (this.numRows * this.numCols) * 100 <= 5) {
      this.refresh();
    }
  }

  logicUpdate(timeStamp: DOMHighResTimeStamp): void {
    this.cells = this.cells.map((row, cellY) => {
      return row.map((cell, cellX) => {
        let numAlive = 0;

        for (let y = cellY - 1; y <= cellY + 1; y++) {
          for (let x = cellX - 1; x <= cellX + 1; x++) {
            if (y == cellY && x == cellX) { continue; }
            numAlive += this.cells?.[y]?.[x]?.alive ? 1 : 0;
          }
        }

        if (cell.alive) {
          if (numAlive == 2 || numAlive == 3) {
            return cell;
          }
          const newCell = new Cell({ ...cell, shape: this.options.cellShape });
          newCell.alive = false;
          newCell.diedAt = timeStamp;
          return newCell;
        } else {
          if (numAlive == 3) {
            const newCell = new Cell({ ...cell, shape: this.options.cellShape });
            newCell.alive = true;
            newCell.diedAt = -1;
            return newCell;
          }
          return cell;
        }
      });
    });
  }

  drawLastFrame(): void {
    if (!this.running) {
      this.draw(this.lastDraw);
    }
  }
}

declare global {
  var GOL: CellAutomata;
}

document.addEventListener("DOMContentLoaded", () => {
  const options: GameOptions = {
    showGrid: true,
    fadeDeadCells: true,
    cellShape: 'circle',
    updateCellsMs: 16.67 * 10,
    updateMs: 16.67,
    drawMs: 16.67,
    bgColor: 'rgb(218, 118, 53)',
    cellColor: 'rgb(226, 78, 27)',
  };

  globalThis.GOL = new CellAutomata(options);

  var showGridEl = document.getElementById("showGrid");
  if (showGridEl) {
    // show and hide the grid
    showGridEl.addEventListener("input", (ev: Event) => {
      if ((ev.target as HTMLInputElement).checked) {
        globalThis.GOL.options.showGrid = true;
      } else {
        globalThis.GOL.options.showGrid = false;
      }
      // trigger one more draw if we aren't running
      // so the grid is actually removed.
      globalThis.GOL.drawLastFrame();
    });
  }

  var startStopBtn = document.getElementById("startStopBtn");
  if (startStopBtn) {
    // start and stop the simulation
    startStopBtn.addEventListener("click", (ev: MouseEvent) => {
      let targetEl = ev.target as HTMLInputElement;
      if (globalThis.GOL.running) {
        targetEl.innerText = "Start";
        globalThis.GOL.stop();
      } else {
        targetEl.innerText = "Pause";
        globalThis.GOL.start();
      }
    });
  }

  var fadeOutEl = document.getElementById("fadeOut");
  if (fadeOutEl) {
    fadeOutEl.addEventListener("input", (ev: Event) => {
      if ((ev.target as HTMLInputElement).checked) {
        globalThis.GOL.options.fadeDeadCells = true;
      } else {
        globalThis.GOL.options.fadeDeadCells = false;
      }
      globalThis.GOL.drawLastFrame();
    });
  }

  var resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", (ev: MouseEvent) => {
      globalThis.GOL.reset();
      globalThis.GOL.drawLastFrame();
    });
  }

  var circleRadio = document.getElementById("shapeCircle");
  if (circleRadio) {
    circleRadio.addEventListener("input", (ev: Event) => {
      if ((ev.target as HTMLInputElement).checked) {
        globalThis.GOL.options.cellShape = "circle";
        globalThis.GOL.drawLastFrame();
      }
    });
  }

  var squareRadio = document.getElementById("shapeSquare");
  if (squareRadio) {
    squareRadio.addEventListener("input", (ev: Event) => {
      if ((ev.target as HTMLInputElement).checked) {
        globalThis.GOL.options.cellShape = "square";
        globalThis.GOL.drawLastFrame();
      }
    });
  }
});