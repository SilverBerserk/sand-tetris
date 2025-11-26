import { drawCanvas } from "./draw";
import { COLS, FIGURE_MULTIPLIER, ROWS } from "./settings";
import { Figure } from "./types";

interface State {
    minRow: number;
    maxCol: number;
}

export const fillNeighbor = (row: number, col: number, val: number, grid: number[][], state: State) => {

    // out of bounds
    if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) return;

    // ❗ avoid infinite recursion — if already visited (8), stop
    if (grid[row][col] === 8) return;

    // not same value → stop
    if (grid[row][col] !== val) return;

    // mark visited
    grid[row][col] = 8;

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


const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));


export const breakDown = async (arr: number[][], ctx: CanvasRenderingContext2D) => {
    let moved = true;

    while (moved) {
        moved = false;

        // start from second-to-last row (ROWS - 2) so row+1 is always valid
        for (let row = ROWS - 2; row >= 0; row--) {
            for (let col = 0; col < COLS; col++) {
                if (arr[row][col] === 0) continue;

                // try to fall straight down
                if (arr[row + 1][col] === 0) {
                    const prevValue = arr[row][col]
                    arr[row][col] = 0;
                    arr[row + 1][col] = prevValue;
                    moved = true;
                    continue;
                }

                // try down-left
                if (col > 0 && arr[row][col - 1] === 0 && arr[row + 1][col - 1] === 0) {
                    const prevValue = arr[row][col]
                    arr[row][col] = 0;
                    arr[row + 1][col - 1] = prevValue;
                    moved = true;
                    continue;
                }

                // try down-right
                if (col < COLS - 1 && arr[row][col + 1] === 0 && arr[row + 1][col + 1] === 0) {
                    const prevValue = arr[row][col]
                    arr[row][col] = 0;
                    arr[row + 1][col + 1] = prevValue;
                    moved = true;
                    continue;
                }
            }

        }
        drawCanvas(arr, ctx);
        await sleep(50)
    }
};

const replaceValue = (arr: number[][], val1: number, val2: number) => {
    let valuesReplaced = 0;
    for (let rowIndex = 0; rowIndex < arr.length; rowIndex++) {
        const row = arr[rowIndex];
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            if (row[colIndex] == val1) {
                row[colIndex] = val2
                valuesReplaced++;
            }
        }
    }
    return valuesReplaced;
}



export const checkConnection = async (arr: number[][], ctx: CanvasRenderingContext2D) => {
    // let isConnection = false;
    let conectedLines = 0;
    let replacedValues = 0;
    let state = { maxCol: 0, minRow: ROWS };

    // Continue climbing up ONLY if the next row is full
    while (arr[state.minRow - 1][0] > 0 && !arr[ROWS - 1].includes(0)) {
        let newArr = arr.map(row => [...row]);  // deep clone

        // Start at bottom-left (THIS WAS WRONG BEFORE)
        const startVal = arr[state.minRow - 1][0];

        // Flood-fill the row above (same value!)
        fillNeighbor(state.minRow - 1, 0, startVal, newArr, state);

        // If we reached last column → connection exists
        if (state.maxCol === COLS - 1) {
            state.maxCol = 0


            // copy newArr contents into the original arr object
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    arr[r][c] = newArr[r][c];
                }
            }

            conectedLines++;
            replaceValue(arr, 8, 7)
        }
    }
    if (conectedLines > 0) {
        drawCanvas(arr, ctx)
        await sleep(50)
        replacedValues = replaceValue(arr, 7, 0)
        await breakDown(arr, ctx);
    }
        return {replacedValues,conectedLines};
};


export const pinFigure = (arr: number[][], figure: Figure, x: number, y: number) => {
    for (let rowIndex = 0; rowIndex < figure.shape.length; rowIndex++) {
        const row = figure.shape[rowIndex];
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            if (row[colIndex] == 1) {
                for (let i = 0; i < FIGURE_MULTIPLIER; i++)
                    for (let j = 0; j < FIGURE_MULTIPLIER; j++) {
                        arr[rowIndex * FIGURE_MULTIPLIER + y + j][colIndex * FIGURE_MULTIPLIER + x + i] = figure.value
                    }
            }
        }
    }
}

export const spingFigure = (figure: Figure, clockwise: boolean = false) => {
    const { shape } = figure
    const rows = shape.length;
    const cols = shape[0].length;

    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (clockwise)
                rotated[c][rows - 1 - r] = shape[r][c]
            else
                rotated[cols - 1 - c][r] = shape[r][c];
        }
    }

    return { shape: rotated, value: figure.value };
}