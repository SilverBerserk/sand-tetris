import { drawCanvas } from "./draw";
import { FIGURES } from "./figures";
import { COLS, FIGURE_MULTIPLIER, ROWS } from "./settings";

const MAX_NUM = FIGURES.length + 1

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const fillNeighbor = (row: number, col: number, val: number, grid: number[][], state: { minRow: number, maxCol: number }) => {
    // out of bounds
    if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) return;

    // ❗ avoid infinite recursion — if already visited (8), stop
    if (grid[row][col] === MAX_NUM + 1) return;

    // not same value → stop
    if (grid[row][col] !== val) return;

    // mark visited
    grid[row][col] = MAX_NUM + 1;

    // update minRow
    if (col === 0 && row < state.minRow) {
        state.minRow = row;
    }

    // update maxCol
    if (col > state.maxCol) {
        state.maxCol = col;
    }

    // original recursion structure (UNCHANGED):
    if (row + 1 < grid.length && grid[row + 1][col] === val)
        fillNeighbor(row + 1, col, val, grid, state);

    if (row - 1 >= 0 && grid[row - 1][col] === val)
        fillNeighbor(row - 1, col, val, grid, state);

    if (col + 1 < grid[0].length && grid[row][col + 1] === val)
        fillNeighbor(row, col + 1, val, grid, state);

    if (col - 1 >= 0 && grid[row][col - 1] === val)
        fillNeighbor(row, col - 1, val, grid, state);
};

export const breakDown = async (grid: number[][], ctx: CanvasRenderingContext2D) => {
    let moved = true;

    while (moved) {
        moved = false;

        // start from second-to-last row (ROWS - 2) so row+1 is always valid
        for (let row = ROWS - 2; row >= 0; row--) {
            for (let col = 0; col < COLS; col++) {
                if (grid[row][col] === 0) continue;

                // try to fall straight down
                if (grid[row + 1][col] === 0) {
                    const prevValue = grid[row][col]
                    grid[row][col] = 0;
                    grid[row + 1][col] = prevValue;
                    moved = true;
                    continue;
                }

                // try down-left
                if (col > 0 && grid[row][col - 1] === 0 && grid[row + 1][col - 1] === 0) {
                    const prevValue = grid[row][col]
                    grid[row][col] = 0;
                    grid[row + 1][col - 1] = prevValue;
                    moved = true;
                    continue;
                }

                // try down-right
                if (col < COLS - 1 && grid[row][col + 1] === 0 && grid[row + 1][col + 1] === 0) {
                    const prevValue = grid[row][col]
                    grid[row][col] = 0;
                    grid[row + 1][col + 1] = prevValue;
                    moved = true;
                    continue;
                }
            }
        }
        drawCanvas(grid, ctx);
        await sleep(50)
    }
};

const replaceValue = (grid: number[][], val1: number, val2: number) => {
    let valuesReplaced = 0;
    grid.forEach(row =>
        row.forEach((cell, colIndex) => {
            if (cell == val1) {
                row[colIndex] = val2
                valuesReplaced++
            }
        })
    )
    return valuesReplaced;
}

export const checkConnection = async (grid: number[][], ctx: CanvasRenderingContext2D) => {
    // let isConnection = false;
    let conectedLines = 0;
    let replacedValues = 0;
    let state = { maxCol: 0, minRow: ROWS };

    // Continue climbing up ONLY if the next row is full
    while (grid[state.minRow - 1][0] > 0 && !grid[ROWS - 1].includes(0)) {
        let newArr = grid.map(row => [...row]);  // deep clone

        // Start at bottom-left (THIS WAS WRONG BEFORE)
        const startVal = grid[state.minRow - 1][0];

        // Flood-fill the row above (same value!)
        fillNeighbor(state.minRow - 1, 0, startVal, newArr, state);

        // If we reached last column → connection exists
        if (state.maxCol === COLS - 1) {
            state.maxCol = 0

            // copy newArr contents into the original arr object
            for (let rowIndex = 0; rowIndex < ROWS; rowIndex++)
                for (let colIndex = 0; colIndex < COLS; colIndex++)
                    grid[rowIndex][colIndex] = newArr[rowIndex][colIndex];

            conectedLines++;

            replaceValue(grid, MAX_NUM + 1, MAX_NUM)
        }
    }

    if (conectedLines > 0) {
        drawCanvas(grid, ctx)
        await sleep(50)
        replacedValues = replaceValue(grid, MAX_NUM, 0)

        await breakDown(grid, ctx);
        const valuesAndLines = await checkConnection(grid, ctx)
        replacedValues += valuesAndLines.replacedValues;
        conectedLines += valuesAndLines.conectedLines;
    }

    return { replacedValues, conectedLines };
};


export const pinFigure = (grid: number[][], figure: number[][], x: number, y: number) => {
    figure.forEach((row, rowIndex) =>
        row.forEach((cell, colIndex) => {
            if (cell > 0)
                for (let i = 0; i < FIGURE_MULTIPLIER; i++)
                    for (let j = 0; j < FIGURE_MULTIPLIER; j++)
                        grid[rowIndex * FIGURE_MULTIPLIER + y + j][colIndex * FIGURE_MULTIPLIER + x + i] = cell
        })
    )
}

export const spinFigure = (figure: number[][], clockwise: boolean = false) => {
    const rows = figure.length;
    const cols = figure[0].length;

    const rotatedShape = Array.from({ length: cols }, () => Array(rows).fill(0));

    for (let rowIndex = 0; rowIndex < rows; rowIndex++)
        for (let colIndex = 0; colIndex < cols; colIndex++)
            clockwise
                ? rotatedShape[colIndex][rows - 1 - rowIndex] = figure[rowIndex][colIndex]
                : rotatedShape[cols - 1 - colIndex][rowIndex] = figure[rowIndex][colIndex];


    return rotatedShape
}