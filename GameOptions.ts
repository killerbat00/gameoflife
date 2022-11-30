export type CellShape = "circle" | "square";

export type GameOptions = {
    showGrid: boolean;
    fadeDeadCells: boolean;
    cellShape: CellShape;
    updateMs: number;
    drawMs: number;
    bgColor: string;
    cellColor: string;
}
