import { checkBorders, checkForColision } from "./colision";
import { clearNextFigure, drawCanvas, drawFigure, drawGameOver, drawLinesNumber, drawPause, drawScore, drawStats } from "./draw";
import { randomFigure } from "./figures";
import { breakDown, checkConnection, pinFigure, spingFigure } from "./gameLogic";
import { COLS, FIGURE_MULTIPLIER, ROWS } from "./settings";
import { Figure } from "./types";


let lines = 0;
let score = 0;

let fig_x = 0;
let fig_y = 0;

let isProcessing = false;
let isPaused = false;
let isGameOver = false;


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
    drawFigure(nextFigure, COLS + 10, ROWS / 2, ctx)
}

init()


const interval = setInterval(async () => {
    // ⛔ If we are processing breakdown/spawning — SKIP this tick
    if (isGameOver || isProcessing || isPaused || !currentFigure) return;

    drawCanvas(arr, ctx);
    drawFigure(currentFigure, fig_x, fig_y, ctx);

    if (checkBorders(currentFigure, fig_x, fig_y) || checkForColision(currentFigure, arr, fig_x, fig_y, "DOWN")) {

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
        clearNextFigure(COLS + 10, ROWS / 2,  ctx)
        drawFigure(nextFigure,COLS + 10, ROWS / 2 , ctx)

        isProcessing = false; // 🔓 unlock
    }
    else {
        fig_y++;
    }
}, 50);


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
            const newFigure = spingFigure(currentFigure)
            if (!checkForColision(newFigure, arr, fig_x, fig_y) && !checkBorders(newFigure, fig_x, fig_y))
                currentFigure = newFigure;
        }
    }
    if (e.key === "ArrowDown") {
        if (currentFigure) {
            const newFigure = spingFigure(currentFigure, true)
            if (!checkForColision(newFigure, arr, fig_x, fig_y) && !checkBorders(newFigure, fig_x, fig_y))
                currentFigure = newFigure;
        }
    }
    if (e.key === " ") {
        if (currentFigure) {
            while (!checkBorders(currentFigure, fig_x, fig_y) && !checkForColision(currentFigure, arr, fig_x, fig_y, "DOWN")) {
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
