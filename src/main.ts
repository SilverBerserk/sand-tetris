import { checkForColision } from "./collision";
import { drawCanvas, drawFigure, drawGameOver, drawNextFigure, drawPause, drawStats } from "./draw";
import { randomFigure } from "./figures";
import { breakDown, checkConnection, pinFigure, spinFigure } from "./gameLogic";
import { CANVAS_HEIGHT, CANVAS_WIDTH, COLS, FIGURE_MULTIPLIER, ROWS } from "./settings";

enum KEYS {
    ARROW_UP = "ArrowUp",
    ARROW_DOWN = "ArrrowDown",
    ARROW_LEFT = "ArrowLeft",
    ARROW_RIGHT = "ArrowRight",
    ENTER = "Enter",
    SPACE = " ",
    R = "r"
}

let lines = 0;
let score = 0;

let fig_x = 0;
let fig_y = 0;

let isProcessing = false;
let isPaused = false;
let isGameOver = false;

const bestScore = +(localStorage.getItem('sand-tetris') ?? 0)

let lastTime = 0;
let dropCounter = 0;

const canvas = document.getElementById("game") as HTMLCanvasElement;
canvas.width = CANVAS_WIDTH
canvas.height = CANVAS_HEIGHT
canvas.style.marginLeft = "60px"
canvas.style.marginTop = "60px"

const ctx = canvas.getContext("2d")!;

export const loadFonts = async () => {
    await document.fonts.load('16px "Press Start 2P"');
    await document.fonts.load('56px "Press Start 2P"');
    await document.fonts.ready;
};

const stats = [{ title: "Lines:", value: lines },
{ title: "Score:", value: score },
{ title: "Best:", value: bestScore },
{ title: "Next:" }]

const spawnFigure = (newFigure: number[][]) => {
    fig_y = 0;
    fig_x = COLS / 2 - 8;

    if (checkForColision(newFigure, arr, fig_x, fig_y)) {
        isProcessing = false;
        isGameOver = true;
        drawGameOver(ctx)
        if (score > bestScore)
            window.localStorage.setItem('sand-tetris', score.toString())
        console.log('Game Over')
    }
    return newFigure
}

let arr: number[][];
let currentFigure: number[][];
let nextFigure: number[][];

const init = async () => {
    await loadFonts()
    arr = Array.from({ length: ROWS }, () => Array(COLS).fill(0)) as number[][];
    currentFigure = spawnFigure(randomFigure());
    nextFigure = randomFigure();
    lines = 0;
    score = 0

    drawStats(stats, ctx)

    drawNextFigure(nextFigure, COLS + 10, ROWS / 2, ctx)
}

init()


const gameLoop = async (time: number) => {
    const deltaTime = time - lastTime;
    lastTime = time;
    const dropInterval = 50; // piece falls every 1000ms

    if (!isGameOver && !isProcessing && !isPaused) {
        dropCounter += deltaTime;

        if (dropCounter > dropInterval) {
            dropCounter = 0;
            if (isGameOver || isProcessing || isPaused || !currentFigure) return;

            drawCanvas(arr, ctx);
            drawFigure(currentFigure, fig_x, fig_y, ctx);

            if (checkForColision(currentFigure, arr, fig_x, fig_y + 1)) {
                isProcessing = true;  // 🔒 lock

                pinFigure(arr, currentFigure, fig_x, fig_y);

                await breakDown(arr, ctx);    // wait for sand-fall animation
                const { replacedValues, conectedLines } = await checkConnection(arr, ctx)

                lines += conectedLines;
                score += replacedValues;
                drawStats(stats, ctx)
                currentFigure = spawnFigure(nextFigure)
                nextFigure = randomFigure()
                drawNextFigure(nextFigure, COLS + 10, ROWS / 2, ctx)

                isProcessing = false; // 🔓 unlock
            }
            else {
                fig_y++;
            }

            currentFigure && drawFigure(currentFigure, fig_x, fig_y, ctx);

            if (isGameOver)
                drawGameOver(ctx)
        }
    }

    requestAnimationFrame(gameLoop);
};

requestAnimationFrame(gameLoop);


window.addEventListener("keydown", (e) => {
    e.preventDefault();
    if (!isPaused && !isGameOver && !isProcessing) {
        if (e.key === KEYS.ARROW_LEFT) {
            if (fig_x > 0)
                fig_x--;
        }
        if (e.key === KEYS.ARROW_RIGHT) {
            if (fig_x + (currentFigure?.[0].length ?? 0) * FIGURE_MULTIPLIER < COLS)
                fig_x++;
        }
        if (e.key === KEYS.ARROW_UP) {
            if (currentFigure) {
                const newFigure = spinFigure(currentFigure)
                if (!checkForColision(newFigure, arr, fig_x, fig_y))
                    currentFigure = newFigure;
            }
        }
        if (e.key === KEYS.ARROW_DOWN) {
            if (currentFigure) {
                const newFigure = spinFigure(currentFigure, true)
                if (!checkForColision(newFigure, arr, fig_x, fig_y))
                    currentFigure = newFigure;
            }
        }
        if (e.key === KEYS.SPACE) {
            if (currentFigure) {
                while (!checkForColision(currentFigure, arr, fig_x, fig_y + 1)) {
                    fig_y++
                }
            }
        }
    }
    if (!isProcessing) {
        if (e.key === KEYS.R) {
            isGameOver = false;
            isPaused = false;
            init()
        }
        if (e.key === KEYS.ENTER) {
            if (isGameOver) {
                init()
                isGameOver = false;
                isPaused = false
            }
            else {
                if (!isPaused)
                    drawPause(ctx)
                isPaused = !isPaused
            }
        }
    }
});
