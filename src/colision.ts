import { COLS, FIGURE_MULTIPLIER, ROWS, SQUARE_SIZE } from "./settings";

export const checkForColision = (
    figure: number[][],
    grid: number[][],
    x: number,
    y: number,
) => {
    const figureHeight = figure.length * FIGURE_MULTIPLIER;
    const figureWidth = figure[0].length * FIGURE_MULTIPLIER;

    // Check boundaries
    if (y + figureHeight >= ROWS || x + figureWidth > COLS || x < 0)
        return true;

    // Check collision
    return figure.some((row, rowIndex) =>
        row.some((cell, colIndex) => {
            if (!cell) return false;

            for (let i = 0; i < FIGURE_MULTIPLIER; i++) {
                for (let j = 0; j < FIGURE_MULTIPLIER; j++) {

                    if (
                        grid[rowIndex * SQUARE_SIZE + y + j]
                        [colIndex * SQUARE_SIZE + x + i]
                    ) {
                        return true;
                    }
                }
            }

            return false;
        })
    );
};