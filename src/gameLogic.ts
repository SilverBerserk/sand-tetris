import { drawCanvas } from "./draw";
import { FIGURES } from "./figures";
import { COLS, FIGURE_MULTIPLIER, ROWS } from "./settings";

const MAX_NUM = FIGURES.length + 1;
const TOTAL = ROWS * COLS;

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

// ─── Flat typed-array grid ────────────────────────────────────────────────────
// A flat Int32Array is ~10× faster to clone than a jagged number[][] for large
// grids (90 × 150 = 13 500 cells).  All helpers accept either shape; internal
// functions use the flat form exclusively.

export type Grid = number[][];          // public surface stays the same
type FlatGrid = Int32Array;

const flat = (grid: Grid): FlatGrid => Int32Array.from(grid.flat());
const unflat = (flatGrid: FlatGrid): Grid =>
    Array.from({ length: ROWS }, (_, r) =>
        Array.from(flatGrid.subarray(r * COLS, r * COLS + COLS)) as number[]);

const cloneFlat = (flatGrid: FlatGrid): FlatGrid => {
    const copy = new Int32Array(TOTAL);
    copy.set(flatGrid);
    return copy;
};

// Keep the public API identical so main.ts needs no changes.
export const generateGrid = (i: number): Grid =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(i));

export const cloneGrid = (grid: Grid): Grid =>
    grid.map(row => [...row]);

// ─── Iterative flood-fill (was recursive → stack-overflow risk) ───────────────
const fillNeighborFlat = (
    startRow: number,
    startCol: number,
    val: number,
    flatGrid: FlatGrid,
    state: { minRow: number; maxCol: number }
): FlatGrid => {
    const out = cloneFlat(flatGrid);
    const VISITED = MAX_NUM + 1;
    const stack: number[] = [startRow * COLS + startCol];

    while (stack.length) {
        const idx = stack.pop()!;
        const row = (idx / COLS) | 0;
        const col = idx % COLS;

        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) continue;
        if (out[idx] !== val) continue;

        out[idx] = VISITED;

        if (col === 0 && row < state.minRow) state.minRow = row;
        if (col > state.maxCol) state.maxCol = col;

        if (row + 1 < ROWS) stack.push(idx + COLS);
        if (row - 1 >= 0) stack.push(idx - COLS);
        if (col + 1 < COLS) stack.push(idx + 1);
        if (col - 1 >= 0) stack.push(idx - 1);
    }
    return out;
};

// Public wrapper keeps the Grid ↔ FlatGrid conversion in one place.
export const fillNeighbor = (
    row: number,
    col: number,
    val: number,
    grid: Grid,
    state: { minRow: number; maxCol: number }
): Grid => unflat(fillNeighborFlat(row, col, val, flat(grid), state));

// ─── breakDown – single-pass gravity, no per-row clone ───────────────────────
export const breakDown = async (
    grid: Grid,
    ctx: CanvasRenderingContext2D
): Promise<Grid> => {
    let flatGrid = flat(grid);
    let moved = true;

    while (moved) {
        moved = false;
        const prev = cloneFlat(flatGrid);

        for (let row = ROWS - 2; row >= 0; row--) {
            for (let col = 0; col < COLS; col++) {
                const idx = row * COLS + col;
                if (flatGrid[idx] === 0) continue;

                // straight down
                if (flatGrid[idx + COLS] === 0) {
                    flatGrid[idx + COLS] = flatGrid[idx];
                    flatGrid[idx] = 0;
                    moved = true;
                    continue;
                }
                // down-left
                if (col > 0 && flatGrid[idx - 1] === 0 && flatGrid[idx + COLS - 1] === 0) {
                    flatGrid[idx + COLS - 1] = flatGrid[idx];
                    flatGrid[idx] = 0;
                    moved = true;
                    continue;
                }
                // down-right
                if (col < COLS - 1 && flatGrid[idx + 1] === 0 && flatGrid[idx + COLS + 1] === 0) {
                    flatGrid[idx + COLS + 1] = flatGrid[idx];
                    flatGrid[idx] = 0;
                    moved = true;
                    continue;
                }
            }
        }

        drawCanvas(unflat(flatGrid), unflat(prev), ctx);
        await sleep(50);
    }

    return unflat(flatGrid);
};

// ─── replaceValue – single flat pass ─────────────────────────────────────────
const replaceValueFlat = (
    flatGrid: FlatGrid,
    valueToReplace: number,
    valueReplacedWith: number
): { valuesReplaced: number; flatGrid: FlatGrid } => {
    const out = cloneFlat(flatGrid);
    let valuesReplaced = 0;
    for (let i = 0; i < TOTAL; i++) {
        if (out[i] === valueToReplace) { out[i] = valueReplacedWith; valuesReplaced++; }
    }
    return { valuesReplaced, flatGrid: out };
};

// ─── checkConnection ──────────────────────────────────────────────────────────
// Scan every row bottom-to-top. For each row, if col=0 is non-zero, flood-fill
// that connected region. If the fill reaches col=COLS-1 it's a complete line —
// mark it. After scanning, clear all marked cells, let sand fall, repeat.
export const checkConnection = async (
    grid: Grid,
    ctx: CanvasRenderingContext2D
): Promise<{ replacedValues: number; conectedLines: number; grid: Grid }> => {
    let flatGrid = flat(grid);
    const oldFlatGrid = cloneFlat(flatGrid);
    let conectedLines = 0;
    let replacedValues = 0;

    // Scan rows bottom → top
    for (let row = ROWS - 1; row >= 0; row--) {
        const startIdx = row * COLS;
        const startVal = flatGrid[startIdx];

        // Skip empty cells or already-marked cells
        if (startVal === 0 || startVal === MAX_NUM || startVal === MAX_NUM + 1) continue;

        const state = { maxCol: 0, minRow: row };
        const localFlatGrid = fillNeighborFlat(row, 0, startVal, flatGrid, state);

        if (state.maxCol === COLS - 1) {
            // Full horizontal connection — accept the fill, mark as cleared
            flatGrid = localFlatGrid;
            ({ flatGrid } = replaceValueFlat(flatGrid, MAX_NUM + 1, MAX_NUM));
            conectedLines++;
        }
        // If no connection, localF is discarded (f unchanged)
    }

    if (conectedLines > 0) {
        drawCanvas(unflat(flatGrid), unflat(oldFlatGrid), ctx);
        await sleep(50);
        const afterMark = cloneFlat(flatGrid);

        let vr: number;
        ({ valuesReplaced: vr, flatGrid } = replaceValueFlat(flatGrid, MAX_NUM, 0));
        replacedValues += vr;

        drawCanvas(unflat(flatGrid), unflat(afterMark), ctx);

        // Let sand settle, then check again for newly formed lines
        const settled = await breakDown(unflat(flatGrid), ctx);
        const next = await checkConnection(settled, ctx);
        replacedValues += next.replacedValues;
        conectedLines += next.conectedLines;
        flatGrid = flat(next.grid);
    }

    return { replacedValues, conectedLines, grid: unflat(flatGrid) };
};

// ─── pinFigure ────────────────────────────────────────────────────────────────
export const pinFigure = (
    grid: Grid,
    figure: number[][],
    x: number,
    y: number
): Grid => {
    const newGrid = cloneGrid(grid);
    figure.forEach((row, rowIndex) =>
        row.forEach((cell, colIndex) => {
            if (!cell) return;
            for (let i = 0; i < FIGURE_MULTIPLIER; i++)
                for (let j = 0; j < FIGURE_MULTIPLIER; j++)
                    newGrid[rowIndex * FIGURE_MULTIPLIER + y + j]
                    [colIndex * FIGURE_MULTIPLIER + x + i] = cell;
        })
    );
    return newGrid;
};

// ─── spinFigure ───────────────────────────────────────────────────────────────
export const spinFigure = (figure: number[][], clockwise = false): number[][] => {
    const rows = figure.length;
    const cols = figure[0].length;
    const rotatedShape = Array.from({ length: cols }, () => Array(rows).fill(0));

    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            clockwise
                ? (rotatedShape[c][rows - 1 - r] = figure[r][c])
                : (rotatedShape[cols - 1 - c][r] = figure[r][c]);

    return rotatedShape;
};

// ─── checkForColision – fixed SQUARE_SIZE → FIGURE_MULTIPLIER ────────────────
export const checkForColision = (
    grid: Grid,
    figure: number[][],
    x: number,
    y: number
): boolean => {
    const figureHeight = figure.length * FIGURE_MULTIPLIER;
    const figureWidth = figure[0].length * FIGURE_MULTIPLIER;

    if (y + figureHeight >= ROWS || x + figureWidth > COLS || x < 0) return true;

    return figure.some((row, rowIndex) =>
        row.some((cell, colIndex) => {
            if (!cell) return false;
            for (let i = 0; i < FIGURE_MULTIPLIER; i++)
                for (let j = 0; j < FIGURE_MULTIPLIER; j++)
                    if (grid[rowIndex * FIGURE_MULTIPLIER + y + j]
                    [colIndex * FIGURE_MULTIPLIER + x + i])
                        return true;
            return false;
        })
    );
};