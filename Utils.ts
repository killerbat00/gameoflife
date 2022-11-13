export function OneInFifteenChance(): number {
    return Math.random() <= 0.15 ? 1 : 0;
}

export function EaseOut(x: number): number {
    return Math.sin((x * Math.PI) / 2);
}

export function EaseIn(x: number): number {
    return 1 - Math.cos((x * Math.PI) / 2);
}

export function Normalize(x: number, max: number, min: number): number {
    return (x - min) / (max - min);
}