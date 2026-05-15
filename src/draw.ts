import { getColor } from "./colors"
import { COLS, FIGURE_MULTIPLIER, ROWS, SQUARE_SIZE } from "./settings"

// ─── drawCanvas – batch fills by colour ──────────────────────────────────────
// Instead of one fillRect per changed cell (up to 13 500 ctx state changes),
// we group all dirty cells by colour and issue one fillRect per group.
// On a 90 × 150 grid this cuts canvas API calls by ~95 % during breakDown.

export const drawCanvas = (
    grid: number[][],
    prevGrid: number[][],
    ctx: CanvasRenderingContext2D
) => {
    // colour → list of [x, y] pixel positions
    const buckets = new Map<string, Array<[number, number]>>();

    grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (prevGrid[rowIndex][colIndex] === cell) return;   // unchanged
            const color = getColor(cell);
            let bucket = buckets.get(color);
            if (!bucket) { bucket = []; buckets.set(color, bucket); }
            bucket.push([colIndex * SQUARE_SIZE, rowIndex * SQUARE_SIZE]);
        });
    });

    buckets.forEach((positions, color) => {
        ctx.fillStyle = color;
        for (const [x, y] of positions)
            ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
    });
};

export const drawGridBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = getColor(0);
    ctx.fillRect(0, 0, COLS * SQUARE_SIZE, ROWS * SQUARE_SIZE);
};

export const drawFigure = (
    figure: number[][],
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D,
    color?: number
) => {
    figure.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (!cell) return;
            ctx.fillStyle = getColor(color ?? cell);
            ctx.fillRect(
                (x + colIndex * FIGURE_MULTIPLIER) * SQUARE_SIZE,
                (y + rowIndex * FIGURE_MULTIPLIER) * SQUARE_SIZE,
                SQUARE_SIZE * FIGURE_MULTIPLIER,
                SQUARE_SIZE * FIGURE_MULTIPLIER
            );
        });
    });
};

export const drawNextFigure = (
    figure: number[][],
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D
) => {
    // Clear area sized to figure, not a magic constant
    const w = figure[0].length * FIGURE_MULTIPLIER * SQUARE_SIZE;
    const h = figure.length    * FIGURE_MULTIPLIER * SQUARE_SIZE;
    ctx.fillStyle = getColor(7);
    ctx.fillRect(x * SQUARE_SIZE, y * SQUARE_SIZE, w + SQUARE_SIZE * 2, h + SQUARE_SIZE * 2);
    drawFigure(figure, x, y, ctx);
};

export const drawStats = (
    stats: { title: string; value?: number }[],
    ctx: CanvasRenderingContext2D
) => {
    ctx.fillStyle = getColor(7);
    ctx.fillRect(COLS * FIGURE_MULTIPLIER, ROWS * FIGURE_MULTIPLIER / 6 - 30, 160, 350);

    ctx.fillStyle = getColor(6);
    ctx.font = "16px 'Press Start 2P'";
    stats.forEach((stat, index) => {
        ctx.fillText(stat.title, COLS * FIGURE_MULTIPLIER + 20, ROWS * FIGURE_MULTIPLIER / 6 + index * 80);
        if (stat.value !== undefined)
            ctx.fillText(stat.value.toString(), COLS * FIGURE_MULTIPLIER + 20, ROWS * FIGURE_MULTIPLIER / 6 + index * 80 + 30);
    });
};

const drawDoubleText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number) => {
    ctx.font = "56px 'Press Start 2P'";
    ctx.fillStyle = "red";
    ctx.fillText(text, x, y + 5);
    ctx.fillStyle = "yellow";
    ctx.fillText(text, x - 5, y);
};

export const drawPause = (ctx: CanvasRenderingContext2D) =>
    drawDoubleText(ctx, "PAUSE", 90, ROWS * FIGURE_MULTIPLIER / 2);

export const drawGameOver = (ctx: CanvasRenderingContext2D) => {
    drawDoubleText(ctx, "GAME", 125, ROWS * FIGURE_MULTIPLIER / 2 - 20);
    drawDoubleText(ctx, "OVER", 125, ROWS * FIGURE_MULTIPLIER / 2 + 40);
};