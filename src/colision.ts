import { COLS, FIGURE_MULTIPLIER, ROWS, SQUARE_SIZE } from "./settings";
import { Figure } from "./types";

export const checkForColision = (
    figure: Figure,
    grid: number[][],
    x: number,
    y: number,
) => {
    const figureHeight = figure.shape.length * FIGURE_MULTIPLIER;
    const figureWidth = figure.shape[0].length * FIGURE_MULTIPLIER;

    // Check boundaries
    if (y + figureHeight >= ROWS || x + figureWidth > COLS || x < 0)
        return true;

    // Check collision
    return figure.shape.some((row, rowIndex) =>
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