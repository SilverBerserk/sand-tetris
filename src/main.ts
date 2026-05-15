import { drawCanvas, drawFigure, drawGameOver, drawNextFigure, drawPause, drawStats } from "./draw";
import { breakDown, checkConnection, checkForColision, cloneGrid, generateGrid, pinFigure, spinFigure } from "./gameLogic";
import { randomFigure } from "./figures";
import { CANVAS_HEIGHT, CANVAS_WIDTH, COLS, ROWS, LOCAL_STORAGE_NAME } from "./settings";

enum KEYS {
    ARROW_UP = "ArrowUp",
    ARROW_DOWN = "ArrowDown",
    ARROW_LEFT = "ArrowLeft",
    ARROW_RIGHT = "ArrowRight",
    ENTER = "Enter",
    SPACE = " ",
    R = "r"
}

let lines = 0,
    score = 0,
    fig_x = 0,
    fig_y = 0,
    isProcessing = false,
    isPaused = false,
    isGameOver = false;

const bestScore = +(localStorage.getItem(LOCAL_STORAGE_NAME) ?? 0);

let lastTime = 0;
let dropCounter = 0;

const canvas = document.getElementById("game") as HTMLCanvasElement;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
canvas.style.marginLeft = "60px";
canvas.style.marginTop = "60px";

const ctx = canvas.getContext("2d")!;

export const loadFonts = async () => {
    await document.fonts.load('16px "Press Start 2P"');
    await document.fonts.load('56px "Press Start 2P"');
    await document.fonts.ready;
};

const getStats = () => [
    { title: "Lines:", value: lines },
    { title: "Score:", value: score },
    { title: "Best:", value: bestScore },
    { title: "Next:" }
];

const spawnFigure = (newFigure: number[][]) => {
    fig_y = 0;
    fig_x = COLS / 2 - 8;

    if (checkForColision(grid, newFigure, fig_x, fig_y)) {
        isProcessing = false;
        isGameOver = true;
        drawGameOver(ctx);
        if (score > bestScore)
            window.localStorage.setItem(LOCAL_STORAGE_NAME, score.toString());
        console.log("Game Over");
    }
    return newFigure;
};

let grid: number[][];
let currentFigure: number[][];
let nextFigure: number[][];

const init = async () => {
    await loadFonts();
    grid = generateGrid(0);
    currentFigure = spawnFigure(randomFigure());
    nextFigure = randomFigure();
    lines = 0;
    score = 0;

    drawCanvas(grid, generateGrid(-1), ctx);
    drawStats(getStats(), ctx);
    drawNextFigure(nextFigure, COLS + 10, ROWS / 2, ctx);
};

await init();

const cleanFigureSpace = (figure: number[][]) =>
    drawFigure(figure, fig_x, fig_y, ctx, 0);

const gameLoop = async (time: number) => {
    const deltaTime = time - lastTime;
    lastTime = time;

    const dropInterval = 50;

    if (isGameOver || isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    const prevGrid = cloneGrid(grid);

    if (!isProcessing) {
        dropCounter += deltaTime;

        if (dropCounter >= dropInterval) {
            dropCounter = 0;

            if (currentFigure) {
                if (checkForColision(grid, currentFigure, fig_x, fig_y + 1)) {
                    isProcessing = true;

                    grid = pinFigure(grid, currentFigure, fig_x, fig_y);
                    drawFigure(currentFigure, fig_x, fig_y, ctx);
                    grid = await breakDown(grid, ctx);

                    const { replacedValues, conectedLines, grid: newGrid } =
                        await checkConnection(grid, ctx);

                    lines += conectedLines;
                    score += replacedValues;
                    grid = newGrid;
                    drawStats(getStats(), ctx);

                    currentFigure = spawnFigure(nextFigure);
                    nextFigure = randomFigure();
                    drawNextFigure(nextFigure, COLS + 10, ROWS / 2, ctx);

                    isProcessing = false;
                } else {
                    cleanFigureSpace(currentFigure);
                    fig_y++;
                    drawFigure(currentFigure, fig_x, fig_y, ctx);
                }
            }
        }
    }

    drawCanvas(grid, prevGrid, ctx);

    if (currentFigure) drawFigure(currentFigure, fig_x, fig_y, ctx);
    if (isGameOver) drawGameOver(ctx);

    requestAnimationFrame(gameLoop);
};

requestAnimationFrame(gameLoop);

window.addEventListener("keydown", (e) => {
    e.preventDefault();
    if (isProcessing) return;

    if (!isPaused && !isGameOver) {
        if (e.key === KEYS.ARROW_LEFT) {
            if (!checkForColision(grid, currentFigure, fig_x - 1, fig_y)) {
                cleanFigureSpace(currentFigure);
                fig_x--;
            }
        }
        if (e.key === KEYS.ARROW_RIGHT) {
            if (!checkForColision(grid, currentFigure, fig_x + 1, fig_y)) {
                cleanFigureSpace(currentFigure);
                fig_x++;
            }
        }
        if (e.key === KEYS.ARROW_UP) {
            if (currentFigure) {
                const rotated = spinFigure(currentFigure);
                if (!checkForColision(grid, rotated, fig_x, fig_y)) {
                    cleanFigureSpace(currentFigure);
                    currentFigure = rotated;
                }
            }
        }
        if (e.key === KEYS.ARROW_DOWN) {
            if (currentFigure) {
                const rotated = spinFigure(currentFigure, true);
                if (!checkForColision(grid, rotated, fig_x, fig_y))
                    currentFigure = rotated;
            }
        }
        if (e.key === KEYS.SPACE) {
            cleanFigureSpace(currentFigure);
            if (currentFigure)
                while (!checkForColision(grid, currentFigure, fig_x, fig_y + 1))
                    fig_y++;
        }
    }

    if (e.key === KEYS.R) {
        isGameOver = false;
        isPaused = false;
        init();
    }
    if (e.key === KEYS.ENTER) {
        if (isGameOver) {
            init();
            isGameOver = false;
            isPaused = false;
        } else {
            isPaused ? drawCanvas(grid, generateGrid(-1), ctx) : drawPause(ctx);
            isPaused = !isPaused;
        }
    }
});