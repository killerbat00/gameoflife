import { EaseOut, Normalize, OneInFifteenChance } from "./Utils.js";
import { GameLoop } from "./GameLoop.js";

interface CellCopyCreationArgs {
    cell: Cell;
}

interface CellCreationArgs {
    context: CanvasRenderingContext2D;
    x: number;
    y: number;
    size: number;
}

type CellConstructorArgs = CellCopyCreationArgs | CellCreationArgs;

class Cell {
    ctx: CanvasRenderingContext2D;
    grid_x: number;
    grid_y: number;
    alive: boolean;
    died_at: number;
    cell_size: number;

    constructor(args: CellConstructorArgs) {
        if ("cell" in args) {
            this.ctx = args.cell.ctx;
            this.grid_x = args.cell.grid_x;
            this.grid_y = args.cell.grid_y;
            this.alive = args.cell.alive;
            this.died_at = args.cell.died_at;
            this.cell_size = args.cell.cell_size;
        } else {
            this.ctx = args.context;
            this.grid_x = args.x;
            this.grid_y = args.y;
            this.cell_size = args.size;
            this.alive = !!OneInFifteenChance();
            this.died_at = -1;
        }
    }

    draw(dt: number): void {
        if (!this.alive) {
            if (this.died_at == -1) { return; }

            const elapsed = dt - this.died_at;
            if (elapsed > 1000) { return; }

            this.ctx.fillStyle = `rgba(226, 78, 27, ${Math.max(0.7 - EaseOut(Normalize(elapsed, 1000, 0)), 0)})`;
        } else {
            this.ctx.fillStyle = 'rgb(226, 78, 27)';
        }
        this.ctx.beginPath();
        this.ctx.arc(this.grid_x * this.cell_size, this.grid_y * this.cell_size, this.cell_size / 2, 0, 2 * Math.PI);
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

    constructor(canvas: HTMLCanvasElement) {
        super(16.67 * 5, 16.67);

        this.canvas = canvas;
        this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

        this.cell_size = 25;
        this.num_cols = Math.ceil(window.innerWidth / this.cell_size);
        this.num_rows = Math.ceil(window.innerHeight / this.cell_size);
        this.last_refresh = 0;
        this.last_resize = 0;

        this.cells = this.randomize();

        window.onresize = () => {
            this.forceDraw();
        }
        this.start();
    }

    resize(): void {
        const elapsed = (window.performance.now() - this?.last_resize);
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

            if (this.num_rows > this.cells.length) {
                let needed = this.num_rows - this.cells.length;
                for (let ni = 0; ni < needed; ni++) {
                    let n = [];
                    for (let nni = 0; nni < this.num_cols; nni++) {
                        n.push(new Cell({ context: this.context, x: nni, y: this.cells.length, size: this.cell_size }));
                    }
                    this.cells.push(n);
                }
            } else if (this.num_rows < this.cells.length) {
                this.cells.splice(this.num_rows - 1, this.cells.length - this.num_rows);
            }

            if (this.num_cols > this.cells[0].length) {
                let needed = this.num_cols - this.cells[0].length;
                for (let rowi = 0; rowi < this.cells.length; rowi++) {
                    for (let ni = 0; ni < needed; ni++) {
                        this.cells[rowi].push(new Cell({ context: this.context, x: this.cells[rowi].length, y: rowi, size: this.cell_size }));
                    }
                }
            } else if (this.num_cols < this.cells[0].length) {
                for (let rowi = 0; rowi < this.cells.length; rowi++) {
                    this.cells[rowi].splice(this.num_cols - 1, this.cells[rowi].length - this.num_cols);
                }
            }
        }
        this.last_resize = window.performance.now();
    }

    randomize(): Cell[][] {
        let grid: Cell[][] = [];

        for (let r = 0; r < this.num_rows; r++) {
            grid.push([]);
            for (let c = 0; c < this.num_cols; c++) {
                let cell = new Cell({ context: this.context, x: c, y: r, size: this.cell_size });
                grid[r].push(cell);
            }
        }
        this.last_refresh = window.performance.now();
        return grid;
    }

    refresh(): void {
        let elapsed_seconds = (window.performance.now() - this.last_refresh) / 1000;
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

        let total_alive = 0;
        for (let y = 0; y < this.cells.length; y++) {
            for (let x = 0; x < this.cells[y].length; x++) {
                const cell = this.cells[y][x];
                if (cell.alive) {
                    total_alive += 1;
                }
                cell.draw(timeStamp);
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
                    const new_cell = new Cell({ cell: cell });
                    new_cell.alive = false
                    new_cell.died_at = timeStamp;
                    return new_cell;
                } else {
                    if (num_alive == 3) {
                        const new_cell = new Cell({ cell: cell });
                        new_cell.alive = true;
                        new_cell.died_at = -1;
                        return new_cell;
                    }
                    return cell;
                }
            });
        });
    }
}

declare global {
    var GOL: GameOfLife;
}

document.addEventListener("DOMContentLoaded", () => {
    let canvas = document.getElementById("canvas") as HTMLCanvasElement;
    globalThis.GOL = new GameOfLife(canvas);
});