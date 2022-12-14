type Vector = {
    x: number;
    y: number;
}

export function DrawLine(ctx: CanvasRenderingContext2D, from: Vector, to: Vector): void {
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.closePath();
}

export function DrawRect(ctx: CanvasRenderingContext2D, color: string, from: Vector, dimensions: Vector): void {
    ctx.fillStyle = color;
    ctx.fillRect(from.x, from.y, dimensions.x, dimensions.y);
}

export function DrawCircle(ctx: CanvasRenderingContext2D, color: string, pos: Vector, radius: number): void {
    ctx.fillStyle = color;
    ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    ctx.fill();
}