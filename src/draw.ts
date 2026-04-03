import { COLORS } from "./colors"
import { COLS, FIGURE_MULTIPLIER, ROWS, SQUARE_SIZE } from "./settings"

export const drawCanvas = (grid: number[][], ctx: CanvasRenderingContext2D) => {
    grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            ctx.fillStyle = COLORS[cell]
            ctx.fillRect(colIndex * SQUARE_SIZE, rowIndex * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        })
    })
}

export const drawFigure = (figure: number[][], x: number, y: number, ctx: CanvasRenderingContext2D) => {
    figure.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell > 0) {
                ctx.fillStyle = COLORS[cell];
                for (let i = 0; i < FIGURE_MULTIPLIER; i++)
                    for (let j = 0; j < FIGURE_MULTIPLIER; j++) {
                        ctx.fillRect((colIndex * SQUARE_SIZE + x + i) * SQUARE_SIZE,
                            (rowIndex * SQUARE_SIZE + y + j) * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
                    }
            }
        })
    })
}

export const drawNextFigure = (figure: number[][], x: number, y: number, ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = COLORS[7]
    ctx.fillRect(x * SQUARE_SIZE, y * SQUARE_SIZE, 4 * SQUARE_SIZE * SQUARE_SIZE, 2 * SQUARE_SIZE * SQUARE_SIZE);
    drawFigure(figure, x, y, ctx)
}


export const drawStats = (stats: { title: string, value?: number }[], ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = COLORS[7];
    ctx.fillRect(COLS * FIGURE_MULTIPLIER, ROWS * FIGURE_MULTIPLIER / 6 - 30, 160, 350);

    ctx.fillStyle = COLORS[6];
    ctx.font = "16px 'Press Start 2P'";
    stats.forEach((state, index) => {
        ctx.fillText(state.title, COLS * FIGURE_MULTIPLIER + 20, ROWS * FIGURE_MULTIPLIER / 6 + (index * 80));
        state.value !== undefined && ctx.fillText(state.value.toString(), COLS * FIGURE_MULTIPLIER + 20, ROWS * FIGURE_MULTIPLIER / 6 + (index * 80) + 30);
    })
}

export const drawPause = (ctx: CanvasRenderingContext2D) => {
    ctx.font = "56px 'Press Start 2P'";
    ctx.fillStyle = 'red';
    ctx.fillText('PAUSE', 90, ROWS * FIGURE_MULTIPLIER / 2 + 5);
    ctx.fillStyle = 'yellow';
    ctx.fillText('PAUSE', 85, ROWS * FIGURE_MULTIPLIER / 2);
}

export const drawGameOver = (ctx: CanvasRenderingContext2D) => {
    ctx.font = "56px 'Press Start 2P'";
    ctx.fillStyle = 'red';
    ctx.fillText('GAME', 125, ROWS * FIGURE_MULTIPLIER / 2 - 15);
    ctx.fillText('OVER', 125, ROWS * FIGURE_MULTIPLIER / 2 + 45);
    ctx.fillStyle = 'yellow';
    ctx.fillText('GAME', 120, ROWS * FIGURE_MULTIPLIER / 2 - 20);
    ctx.fillText('OVER', 120, ROWS * FIGURE_MULTIPLIER / 2 + 40);
}