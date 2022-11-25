import { EaseOut, Normalize, OneInFifteenChance } from "./Utils.js";
import { GameLoop } from "./GameLoop.js";

type CellType = {
    ctx: CanvasRenderingContext2D;
    grid_x: number;
    grid_y: number;
    alive: boolean;
    died_at: number;
    cell_size: number;
    shape: string;
}

class Cell {
    ctx: CanvasRenderingContext2D;
    grid_x: number;
    grid_y: number;
    alive: boolean;
    died_at: number;
    cell_size: number;
    shape: string;

    constructor({ ctx, grid_x, grid_y, alive, died_at, cell_size, shape }: CellType) {
        this.ctx = ctx;
        this.grid_x = grid_x;
        this.grid_y = grid_y;
        this.alive = alive;
        this.died_at = died_at;
        this.cell_size = cell_size;
        this.shape = shape;
    }

    draw(dt: number, fadeOut: boolean): void {
        if (!this.alive) {
            if (this.died_at == -1) { return; }

            const elapsed = dt - this.died_at;
            if (elapsed > 1000) { return; }

            if (fadeOut) {
                this.ctx.fillStyle = `rgba(226, 78, 27, ${Math.max(0.7 - EaseOut(Normalize(elapsed, 1000, 0)), 0)})`;
            } else {
                return;
            }
        } else {
            this.ctx.fillStyle = 'rgb(226, 78, 27)';
        }

        this.ctx.beginPath();
        if (this.shape === "circle") {
            this.ctx.arc(this.grid_x * this.cell_size, this.grid_y * this.cell_size, this.cell_size / 2, 0, 2 * Math.PI);
        } else if (this.shape === "square") {
            this.ctx.fillRect(this.grid_x * this.cell_size, this.grid_y * this.cell_size, this.cell_size, this.cell_size);
        }
        this.ctx.fill();
    }
}

export class GameOfLife extends GameLoop {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    cells: Cell[][];
    next_button: HTMLButtonElement | undefined;
    start_button: HTMLButtonElement | undefined;
    stop_button: HTMLButtonElement | undefined;
    reset_button: HTMLButtonElement | undefined;
    cell_size: number;
    num_rows: number;
    num_cols: number;
    last_refresh: number;
    last_resize: number;
    grid_showing: boolean;
    fade_dead_cells: boolean;
    cell_shape: string;

    constructor(canvas: HTMLCanvasElement) {
        super(16.67, 16.67);

        this.canvas = canvas;
        this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

        this.last_refresh = 0;
        this.last_resize = 0;

        this.grid_showing = true;
        this.fade_dead_cells = true;
        this.cell_size = 0;
        this.num_rows = 0;
        this.num_cols = 0;
        this.cells = [[]];
        this.cell_shape = "circle";

        this.reset();
        this.start();
    }

    reset(): void {
        this.cell_size = 24;
        this.num_cols = Math.floor(window.innerWidth / this.cell_size);
        this.num_rows = Math.floor(window.innerHeight / this.cell_size);
        this.cells = this.randomize();
    }

    drawGrid(): void {
        if (!this.grid_showing) { return; }
        this.context.save();
        this.context.strokeStyle = `rgb(100, 100, 25)`;
        for (let x = 0; x <= this.num_cols; x++) {
            this.context.beginPath();
            this.context.lineWidth = 1;
            this.context.lineJoin = 'round';
            this.context.moveTo((x * this.cell_size), 0);
            this.context.lineTo(x * this.cell_size, this.cell_size * (this.num_rows - 1));
            this.context.stroke();
            this.context.closePath();
        }

        for (let y = 0; y <= this.num_rows; y++) {
            this.context.beginPath();
            this.context.lineWidth = 1;
            this.context.lineJoin = 'round';
            this.context.moveTo(0, (y * this.cell_size));
            this.context.lineTo(this.cell_size * (this.num_cols), y * this.cell_size);
            this.context.stroke();
            this.context.closePath();
        }
        this.context.restore();
    }

    resize(): void {
        const elapsed = (window.performance.now() - this?.last_resize);
        // debounce 250ms
        if (this.last_resize > 0 && elapsed < 250) {
            return;
        }

        const width = window.innerWidth;
        const height = window.innerHeight;

        if (width !== this.canvas.width || height !== this.canvas.height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.num_cols = Math.ceil(width / this.cell_size);
            this.num_rows = Math.ceil(height / this.cell_size);

            //    if (this.num_rows > this.cells.length) {
            //        let needed = this.num_rows - this.cells.length;
            //        for (let ni = 0; ni < needed; ni++) {
            //            let n = [];
            //            for (let nni = 0; nni < this.num_cols; nni++) {
            //                n.push(new Cell({ context: this.context, x: nni, y: this.cells.length, size: this.cell_size }));
            //            }
            //            this.cells.push(n);
            //        }
            //    } else if (this.num_rows < this.cells.length) {
            //        this.cells.splice(this.num_rows - 1, this.cells.length - this.num_rows);
            //    }

            //    if (this.num_cols > this.cells[0].length) {
            //        let needed = this.num_cols - this.cells[0].length;
            //        for (let rowi = 0; rowi < this.cells.length; rowi++) {
            //            for (let ni = 0; ni < needed; ni++) {
            //                this.cells[rowi].push(new Cell({ context: this.context, x: this.cells[rowi].length, y: rowi, size: this.cell_size }));
            //            }
            //        }
            //    } else if (this.num_cols < this.cells[0].length) {
            //        for (let rowi = 0; rowi < this.cells.length; rowi++) {
            //            this.cells[rowi].splice(this.num_cols - 1, this.cells[rowi].length - this.num_cols);
            //        }
            //    }
        }
        this.last_resize = window.performance.now();
    }

    randomize(): Cell[][] {
        let grid: Cell[][] = [];

        for (let r = 0; r < this.num_rows - 1; r++) {
            grid.push([]);
            for (let c = 0; c < this.num_cols - 1; c++) {
                const cellArgs = { ctx: this.context, grid_x: c + 1, grid_y: r + 1, alive: !!OneInFifteenChance(), died_at: -1, cell_size: this.cell_size, shape: this.cell_shape };
                let cell = new Cell({ ...cellArgs });
                grid[r].push(cell);
            }
        }
        this.last_refresh = window.performance.now();
        return grid;
    }

    refresh(): void {
        let elapsed_seconds = (window.performance.now() - this.last_refresh) / 1000;

        //only refresh once every 10s
        if (elapsed_seconds <= 10) {
            return;
        }

        for (let i = 0; i < this.cells.length; i++) {
            for (let j = 0; j < this.cells[i].length; j++) {
                const cell = this.cells[i][j];
                if (!cell.alive) {
                    cell.alive = !!OneInFifteenChance();
                    cell.died_at = -1
                }
            }
        }
        this.last_refresh = window.performance.now();
    }

    forceDraw(): void {
        this.draw(window.performance.now());
    }

    draw(timeStamp: number): void {
        this.resize();
        this.context.fillStyle = 'rgb(218, 118, 53)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();

        let total_alive = 0;
        for (let y = 0; y < this.cells.length; y++) {
            for (let x = 0; x < this.cells[y].length; x++) {
                const cell = this.cells[y][x];
                if (cell.alive) {
                    total_alive += 1;
                }
                cell.shape = this.cell_shape;
                cell.draw(timeStamp, this.fade_dead_cells);
            }
        }

        // if there are < 5% alive, schedule a refresh
        if (total_alive / (this.num_rows * this.num_cols) * 100 <= 5) {
            this.refresh();
        }
    }

    update(timeStamp: number): void {

        this.cells = this.cells.map((row, cellY) => {
            return row.map((cell, cellX) => {
                let num_alive = 0;

                for (let y = cellY - 1; y <= cellY + 1; y++) {
                    for (let x = cellX - 1; x <= cellX + 1; x++) {
                        if (y == cellY && x == cellX) { continue; }
                        num_alive += (this.cells?.[y]?.[x]?.alive ? 1 : 0);
                    }
                }

                if (cell.alive) {
                    if (num_alive == 2 || num_alive == 3) {
                        return cell;
                    }
                    const new_cell = new Cell({ ...cell, shape: this.cell_shape });
                    new_cell.alive = false;
                    new_cell.died_at = timeStamp;
                    return new_cell;
                } else {
                    if (num_alive == 3) {
                        const new_cell = new Cell({ ...cell, shape: this.cell_shape })
                        new_cell.alive = true;
                        new_cell.died_at = -1;
                        return new_cell;
                    }
                    return cell;
                }
            });
        });
    }

    drawLastFrame(): void {
        if (!this.running) {
            this.draw(this.last_draw_time);
        }
    }
}

declare global {
    var GOL: GameOfLife;
}

document.addEventListener("DOMContentLoaded", () => {
    let canvas = document.getElementById("canvas") as HTMLCanvasElement;
    globalThis.GOL = new GameOfLife(canvas);

    var showGridEl = document.getElementById("showGrid");
    if (showGridEl) {
        // show and hide the grid
        showGridEl.addEventListener("input", (ev: Event) => {
            if ((ev.target as HTMLInputElement).checked) {
                globalThis.GOL.grid_showing = true;
            } else {
                globalThis.GOL.grid_showing = false;
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
                globalThis.GOL.fade_dead_cells = true;
            } else {
                globalThis.GOL.fade_dead_cells = false;
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
                globalThis.GOL.cell_shape = "circle";
                globalThis.GOL.drawLastFrame();
            }
        });
    }

    var squareRadio = document.getElementById("shapeSquare");
    if (squareRadio) {
        squareRadio.addEventListener("input", (ev: Event) => {
            if ((ev.target as HTMLInputElement).checked) {
                globalThis.GOL.cell_shape = "square";
                globalThis.GOL.drawLastFrame();
            }
        });
    }
});