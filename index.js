"use strict";
/** Tile key
 *  0: Hidden mine
 *  1: Hidden blank
 *  2: Flagged mine
 *  3: Flagged blank
 *  4: Revealed mine
 *  5: Revealed blank
 *  6-14: Revealed with 1-8
 */
const gameStates = {
    "win": 1,
    "lose": -1,
    "inProgress": 0
}
const gameFont = "Google Sans";//"JetBrains Mono"
// Initialization
/** @type {HTMLCanvasElement} */
let canvas = document.getElementById("canvas");
/** @type {HTMLImageElement} */
let flagImage = document.getElementById("flag");
canvas.setAttribute("width", window.innerWidth);
canvas.setAttribute("height", window.innerHeight);
canvas.addEventListener("click", handleClick);
canvas.addEventListener("contextmenu", handleContext);
addEventListener("keydown", handleKeys);
let ctx = canvas.getContext("2d");
let mineCount = 10;
let sizeX = 10;
let sizeY = 8;
let initialized = false;
let tiles = [];
// default is easy preset
// medium is ?x=18&y=14&c=40
// hard is ?x=24&y=20&c=99
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("c")) mineCount = urlParams.get("c");
if (urlParams.has("x")) sizeX = urlParams.get("x");
if (urlParams.has("y")) sizeY = urlParams.get("y");
let tileSize = 10;
let state = gameStates.inProgress;
let numColors = [
    "#1976d2",
    "#388e3c",
    "#d32f2f",
    "#7b1fa2",
    "#ff8f00",
    "#0097a7",
    "#424242",
    "#9e9e9e"
];
if (canvas.width < canvas.height) tileSize = Math.floor(canvas.width / sizeX);
else tileSize = Math.floor(canvas.height / sizeY);
// initialize tiles array and draw initial state
for (let j = 0; j < sizeY; j++) {
    tiles[j] = [];
    for (let i = 0; i < sizeX; i++) {
        tiles[j][i] = 1;
        ctx.fillStyle = (i % 2 == 0 ^ j % 2 == 0) ? "#a2d149" : "#aad751";
        ctx.fillRect(i * tileSize, j * tileSize, tileSize, tileSize);
        ctx.fill();
    }
}
function init(x, y) {
    // place mines
    for (let i = 0; i < mineCount;) {
        let randomX = Math.floor(Math.random() * sizeX);
        let randomY = Math.floor(Math.random() * sizeY);
        let canPlace = true;
        for (let i = -1; i <= 1; i++)
            for (let j = -1; j <= 1; j++)
                if(randomX + i == x && randomY + j == y)
                    canPlace = false
        if (tiles[randomY][randomX] == 1 && canPlace) {
            tiles[randomY][randomX] = 0;
            i++;
        }
    }
    window.setInterval(drawBoard, 100);
    initialized = true;
}
function reveal(x, y, draw = true) {
    if (state == gameStates.win) return;
    if (x < 0 || x >= sizeX || y < 0 || y >= sizeY) return;
    if (tiles[y][x] >= 5) return;
    if (tiles[y][x] == 1) {
        // count surrounding mines
        let counter = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                // continue if out of bounds
                if ((x + j) < 0 || (x + j) >= sizeX || (y + i) < 0 || (y + i) >= sizeY) continue;
                if (tiles[y + i][x + j] == 0 || tiles[y + i][x + j] == 4 || tiles[y + i][x + j] == 2) {
                    counter++;
                }
            }
        }
        tiles[y][x] = counter + 5;
        // spread if no mines
        if (counter == 0) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (!(i == 0 && j == 0))
                    window.setTimeout(() => reveal(x + i, y + j, false), 10);
                }
            }
        }
    }
    // reveal all if you click a mine
    else if (tiles[y][x] == 0) {
        tiles[y][x] = 4;
        state = gameStates.lose;
        drawBoard();
        window.setTimeout(() => {
            for (let i = 0; i < sizeX; i++) {
                for (let j = 0; j < sizeY; j++) {
                    // unflag and then reveal all tiles
                    if (tiles[j][i] == 2 || tiles[j][i] == 3) tiles[j][i] -= 2;
                    reveal(i, j);
                }
            }
        }, 100);
    }
    if(draw) drawBoard();
    checkWin();
}
function checkWin() {
    if (state != 0) return;
    let counter = 0;
    for (let i = 0; i < sizeX; i++) {
        for (let j = 0; j < sizeY; j++) {
            if (tiles[j][i] >= 0 && tiles[j][i] <= 4) {
                counter++;
            }
        }
    }
    if (counter == mineCount) {
        // unflag all tiles
        for (let i = 0; i < sizeX; i++) {
            for (let j = 0; j < sizeY; j++) {
                if (tiles[j][i] == 2 || tiles[j][i] == 3) tiles[j][i] -= 2;
            }
        }
        state = gameStates.win;
        drawBoard();
    }
}
function flag(x, y) {
    checkWin();
    if (state != gameStates.inProgress) return;
    if (x < 0 || x >= sizeX || y < 0 || y >= sizeY) return;
    if (tiles[y][x] == 0 || tiles[y][x] == 1) {
        tiles[y][x] += 2
    }
    else if (tiles[y][x] == 2 || tiles[y][x] == 3) {
        tiles[y][x] -= 2
    }
}
function handleClick(event) {
    if (state == gameStates.lose || state == gameStates.win) {
        window.location.reload();
    }
    let x = Math.floor(event.clientX / tileSize);
    let y = Math.floor(event.clientY / tileSize);
    if (x < 0 || x >= sizeX || y < 0 || y >= sizeY) return;
    if (!initialized) init(x, y);
    reveal(x, y);
}
function handleKeys(event) {
    if (event.key == "m") {
        for (let i = 0; i < sizeX; i++) {
            for (let j = 0; j < sizeY; j++) {
                if (tiles[j][i] != 0) {
                    reveal(i, j);
                }
            }
        }
    }
}
function handleContext(event) {
    if (!initialized) return;
    event.preventDefault();
    let x = Math.floor(event.clientX / tileSize);
    let y = Math.floor(event.clientY / tileSize);
    if (x < 0 || x >= sizeX || y < 0 || y >= sizeY) return;
    flag(x, y);
}
function drawGreenTiles() {
    for (let i = 0; i < sizeX; i++) {
        for (let j = 0; j < sizeY; j++) {
            if (tiles[j][i] >= 0 && tiles[j][i] <= 3) {
                ctx.fillStyle = (i % 2 == 0 ^ j % 2 == 0) ? "#a2d149" : "#aad751";
            }
            else if (tiles[j][i] == 4) {
                ctx.fillStyle = "red";
            }
            else continue;
            ctx.fillRect(i * tileSize, j * tileSize, tileSize, tileSize);
            ctx.fill();
        }
    }
}
function drawOtherTiles() {
    for (let i = 0; i < sizeX; i++) {
        for (let j = 0; j < sizeY; j++) {
            ctx.fillStyle = (i % 2 == 0 ^ j % 2 == 0) ? "#d7b899" : "#e5c29f";
            ctx.fillRect(i * tileSize, j * tileSize, tileSize, tileSize);
            ctx.fill();
            // outline
            for (let k = -1; k <= 1; k++) {
                for (let l = -1; l <= 1; l++) {
                    if (i + l < 0 || i + l >= sizeX || j + k < 0 || j + k >= sizeY) continue;
                    if (tiles[j + k][i + l] >= 0 && tiles[j + k][i + l] <= 3) {
                        ctx.strokeStyle = "#87af3a"
                        ctx.lineWidth = tileSize / 7.5;
                        ctx.strokeRect((i + l) * tileSize, (j + k) * tileSize, tileSize, tileSize);
                    }
                }
            }
        }
    }
}
function drawBoard() {
    drawOtherTiles();
    drawGreenTiles();
    for (let i = 0; i < sizeX; i++) {
        for (let j = 0; j < sizeY; j++) {
            if (tiles[j][i] > 5) {
                // text if number tile
                ctx.fillStyle = numColors[tiles[j][i] - 6];
                ctx.font = `bold ${tileSize / 1.3}px ${gameFont}`
                ctx.textAlign = "center";
                ctx.textBaseline = "middle"
                ctx.fillText(tiles[j][i] - 5, (i + 0.5) * tileSize, (j + 0.5) * tileSize, tileSize)
            }
            if (tiles[j][i] == 2 || tiles[j][i] == 3) {
                // draw flag if flag tile
                let flagSize = 0.8;
                ctx.drawImage(flagImage, (i + (1 - flagSize) / 2) * tileSize, (j + (1 - flagSize) / 2) * tileSize, flagSize * tileSize, flagSize * tileSize);
                // legacy flag
                // ctx.fillStyle = "#f23607";
                // ctx.fillRect((i + 0.25) * tileSize, (j + 0.25) * tileSize, tileSize / 2, tileSize / 2);
            }
        }
    }
    if (state == gameStates.win) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "black";
        ctx.font = `${Math.min(tileSize, Math.round(canvas.width / 25))}px ${gameFont}`;
        ctx.fillText("You Won!", tileSize * sizeX / 2, tileSize * (sizeY / 2 - 0.5));
        ctx.fillText("Click to play again", tileSize * sizeX / 2, tileSize * (sizeY / 2 + 0.5));
        ctx.fill();
    }
    if (state == gameStates.lose) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "black";
        ctx.font = `${Math.min(tileSize, Math.round(canvas.width / 25))}px ${gameFont}`;
        ctx.fillText("You Lost", tileSize * sizeX / 2, tileSize * (sizeY / 2 - 0.5));
        ctx.fillText("Click to try again", tileSize * sizeX / 2, tileSize * (sizeY / 2 + 0.5));
        ctx.fill();
    }
}