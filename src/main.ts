import { checkForColision } from "./colision";
import { drawCanvas, drawFigure, drawGameOver, drawLinesNumber, drawNextFigure, drawPause, drawScore, drawStats } from "./draw";
import { randomFigure } from "./figures";
import { breakDown, checkConnection, pinFigure, spinFigure } from "./gameLogic";
import { COLS, FIGURE_MULTIPLIER, ROWS } from "./settings";
import { Figure } from "./types";


let lines = 0;
let score = 0;

let fig_x = 0;
let fig_y = 0;

let isProcessing = false;
let isPaused = false;
let isGameOver = false;

let lastTime = 0;
let dropCounter = 0;

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

document.fonts.ready.then(
    () => {
        drawStats(ctx)
        drawLinesNumber(lines, ctx)
        drawScore(score, ctx)
    })


const spawnFigure = (newFigure: Figure) => {
    fig_y = 0;
    fig_x = COLS / 2 - 8;

    if (!checkForColision(newFigure, arr, fig_x, fig_y))
        return newFigure
    else {
        isProcessing = false;
        isGameOver = true;
        drawGameOver(ctx)
        console.log('Game Over')
    }
}

let arr: number[][];
let currentFigure: Figure | undefined;
let nextFigure: Figure

const init = () => {
    arr = Array.from({ length: ROWS }, () => Array(COLS).fill(0)) as number[][];
    currentFigure = spawnFigure(randomFigure());
    nextFigure = randomFigure();
    lines = 0;
    score = 0
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
                drawLinesNumber(lines, ctx)
                drawScore(score, ctx)
                // currentFigure = spawnFigure();  // generate only ONCE
                currentFigure = spawnFigure(nextFigure)
                nextFigure = randomFigure()
                drawNextFigure(nextFigure, COLS + 10, ROWS / 2, ctx)

                isProcessing = false; // 🔓 unlock
            }
            else {
                fig_y++;
            }

            // drawField(grid, ctx);
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
    if (e.key === "ArrowLeft") {
        if (fig_x > 0)
            fig_x--;
    }
    if (e.key === "ArrowRight") {
        if (fig_x + (currentFigure?.shape[0].length ?? 0) * FIGURE_MULTIPLIER < COLS)
            fig_x++;
    }
    if (e.key === "ArrowUp") {
        if (currentFigure) {
            const newFigure = spinFigure(currentFigure)
            if (!checkForColision(newFigure, arr, fig_x, fig_y))
                currentFigure = newFigure;
        }
    }
    if (e.key === "ArrowDown") {
        if (currentFigure) {
            const newFigure = spinFigure(currentFigure, true)
            if (!checkForColision(newFigure, arr, fig_x, fig_y))
                currentFigure = newFigure;
        }
    }
    if (e.key === " ") {
        if (currentFigure) {
            while (!checkForColision(currentFigure, arr, fig_x, fig_y + 1)) {
                fig_y++
            }
        }
    }
    if (e.key === "r") {
        isGameOver = false;
        isPaused = false;
        init()
    }
    if (e.key === "Enter") {
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
});
