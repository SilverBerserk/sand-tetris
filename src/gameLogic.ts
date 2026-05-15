import { drawCanvas } from "./draw";
import { FIGURES } from "./figures";
import { COLS, FIGURE_MULTIPLIER, ROWS } from "./settings";

const MAX_NUM = FIGURES.length + 1

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const cloneGrid = (grid: number[][]) => grid.map(row => [...row])

export const fillNeighbor = (row: number, col: number, val: number, grid: number[][], state: { minRow: number, maxCol: number }) => {
    let newGrid = cloneGrid(grid)
    // out of bounds
    if (row < 0 || row >= newGrid.length || col < 0 || col >= newGrid[0].length) return newGrid;

    // ❗ avoid infinite recursion — if already visited (8), stop
    if (newGrid[row][col] === MAX_NUM + 1) return newGrid;

    // not same value → stop
    if (newGrid[row][col] !== val) return newGrid;

    // mark visited
    newGrid[row][col] = MAX_NUM + 1;

    // update minRow
    if (col === 0 && row < state.minRow) {
        state.minRow = row;
    }

    // update maxCol
    if (col > state.maxCol) {
        state.maxCol = col;
    }

    // original recursion structure (UNCHANGED):
    if (row + 1 < newGrid.length && newGrid[row + 1][col] === val)
        newGrid = fillNeighbor(row + 1, col, val, newGrid, state);

    if (row - 1 >= 0 && newGrid[row - 1][col] === val)
        newGrid = fillNeighbor(row - 1, col, val, newGrid, state);

    if (col + 1 < newGrid[0].length && newGrid[row][col + 1] === val)
        newGrid = fillNeighbor(row, col + 1, val, newGrid, state);

    if (col - 1 >= 0 && newGrid[row][col - 1] === val)
        newGrid = fillNeighbor(row, col - 1, val, newGrid, state);

    return newGrid
};

export const breakDown = async (grid: number[][], ctx: CanvasRenderingContext2D) => {
    let moved = true;
    const newGrid = cloneGrid(grid)
    while (moved) {
        moved = false;
        const prevGrid = cloneGrid(newGrid)

        // start from second-to-last row (ROWS - 2) so row+1 is always valid
        for (let row = ROWS - 2; row >= 0; row--) {
            for (let col = 0; col < COLS; col++) {
                if (newGrid[row][col] === 0) continue;

                // try to fall straight down
                if (newGrid[row + 1][col] === 0) {
                    const prevValue = newGrid[row][col]
                    newGrid[row][col] = 0;
                    newGrid[row + 1][col] = prevValue;
                    moved = true;
                    continue;
                }

                // try down-left
                if (col > 0 && newGrid[row][col - 1] === 0 && newGrid[row + 1][col - 1] === 0) {
                    const prevValue = newGrid[row][col]
                    newGrid[row][col] = 0;
                    newGrid[row + 1][col - 1] = prevValue;
                    moved = true;
                    continue;
                }

                // try down-right
                if (col < COLS - 1 && newGrid[row][col + 1] === 0 && newGrid[row + 1][col + 1] === 0) {
                    const prevValue = newGrid[row][col]
                    newGrid[row][col] = 0;
                    newGrid[row + 1][col + 1] = prevValue;
                    moved = true;
                    continue;
                }
            }
        }
        drawCanvas(newGrid, prevGrid, ctx);
        await sleep(50)
    }
    return newGrid
};

const replaceValue = (grid: number[][], val1: number, val2: number) => {
    const newGrid = cloneGrid(grid)
    let valuesReplaced = 0;
    newGrid.forEach(row =>
        row.forEach((cell, colIndex) => {
            if (cell == val1) {
                row[colIndex] = val2
                valuesReplaced++
            }
        })
    )
    return { valuesReplaced, grid: newGrid };
}

export const checkConnection = async (grid: number[][], ctx: CanvasRenderingContext2D) => {
    // let isConnection = false;
    let conectedLines = 0;
    let replacedValues = 0;
    let state = { maxCol: 0, minRow: ROWS };
    let newGrid = cloneGrid(grid);  // deep clone
    let oldGrid = cloneGrid(grid)

    // Continue climbing up ONLY if the next row is full
    while (newGrid[state.minRow - 1][0] > 0 && !newGrid[ROWS - 1].includes(0)) {

        let localGrid = cloneGrid(newGrid)
        // Start at bottom-left (THIS WAS WRONG BEFORE)
        const startVal = newGrid[state.minRow - 1][0];

        // Flood-fill the row above (same value!)
        localGrid = fillNeighbor(state.minRow - 1, 0, startVal, localGrid, state);

        // If we reached last column → connection exists
        if (state.maxCol === COLS - 1) {
            state.maxCol = 0

            newGrid = cloneGrid(localGrid);

            conectedLines++;

            ({ grid: newGrid } = replaceValue(newGrid, MAX_NUM + 1, MAX_NUM))
        }
    }

    if (conectedLines > 0) {
        drawCanvas(newGrid, oldGrid, ctx)
        await sleep(50);
        oldGrid = cloneGrid(newGrid);
        ({ valuesReplaced: replacedValues, grid: newGrid } = replaceValue(newGrid, MAX_NUM, 0))
        drawCanvas(newGrid, oldGrid, ctx)
        newGrid = await breakDown(newGrid, ctx);
        const valuesAndLines = await checkConnection(newGrid, ctx)
        replacedValues += valuesAndLines.replacedValues;
        conectedLines += valuesAndLines.conectedLines;
        newGrid = valuesAndLines.grid
    }

    return { replacedValues, conectedLines, grid: newGrid };
};


export const pinFigure = (grid: number[][], figure: number[][], x: number, y: number) => {
    let newGrid = cloneGrid(grid)
    figure.forEach((row, rowIndex) =>
        row.forEach((cell, colIndex) => {
            if (cell > 0)
                for (let i = 0; i < FIGURE_MULTIPLIER; i++)
                    for (let j = 0; j < FIGURE_MULTIPLIER; j++)
                        newGrid[rowIndex * FIGURE_MULTIPLIER + y + j][colIndex * FIGURE_MULTIPLIER + x + i] = cell
        })
    )
    return newGrid
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