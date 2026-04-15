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
const gameFont = "Google Sans"; // "JetBrains Mono"
let mineCount = 10;
let sizeX = 10;
let sizeY = 8;
let tileSize = 10;
let animation = Math.floor(Math.random() * 7);
const numColors = [
    "#1976d2",
    "#388e3c",
    "#d32f2f",
    "#7b1fa2",
    "#ff8f00",
    "#0097a7",
    "#424242",
    "#9e9e9e"
];
let state = gameStates.inProgress;
let drawInterval;
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
let initialized = false;
// default is easy preset ?x=10&y=8&c=10
// medium is ?x=18&y=14&c=40
// hard is ?x=24&y=20&c=99
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("c")) mineCount = urlParams.get("c");
if (urlParams.has("x")) sizeX = urlParams.get("x");
if (urlParams.has("y")) sizeY = urlParams.get("y");
if (urlParams.has("a")) animation = parseInt(urlParams.get("a"));
if (canvas.width / sizeX < canvas.height / sizeY) tileSize = Math.floor(canvas.width / sizeX);
else tileSize = Math.floor(canvas.height / sizeY);
// initialize tiles array
let tiles = [];
for (let j = 0; j < sizeY; j++) {
    tiles[j] = [];
    for (let i = 0; i < sizeX; i++) {
        tiles[j][i] = 1;
    }
}
drawBoard();
function init(x = 0, y = 0) {
    if (drawInterval) clearInterval(drawInterval);
    // place mines
    for (let i = 0; i < mineCount;) {
        let randomX = Math.floor(Math.random() * sizeX);
        let randomY = Math.floor(Math.random() * sizeY);
        let canPlace = true;
        for (let i = -1; i <= 1; i++)
            for (let j = -1; j <= 1; j++)
                if(randomX + i == x && randomY + j == y)
                    canPlace = false;
        if (tiles[randomY][randomX] == 1 && canPlace) {
            tiles[randomY][randomX] = 0;
            i++;
        }
    }
    drawInterval = window.setInterval(drawBoard, 100);
    initialized = true;
}
function restart() {
    state = gameStates.inProgress;
    initialized = false;
    clearInterval(drawInterval);
    tiles = [];
    for (let j = 0; j < sizeY; j++) {
        tiles[j] = [];
        for (let i = 0; i < sizeX; i++) {
            tiles[j][i] = 1;
        }
    }
    drawBoard();
}
function reveal(x, y, draw = true, spread = true) {
    if (state == gameStates.win) return;
    if (x < 0 || x >= sizeX || y < 0 || y >= sizeY) return;
    // >= 5 is revealed tile
    if (tiles[y][x] >= 5) return;
    // 1 is no mine
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
        if (counter == 0 && spread) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (!(i == 0 && j == 0))
                    window.setTimeout(() => reveal(x + i, y + j, false), 10);
                }
            }
        }
    }
    // 0 is mine
    else if (tiles[y][x] == 0) {
        // 4 is revealed mine
        tiles[y][x] = 4;
        state = gameStates.lose;
        drawBoard();
        window.setTimeout(() => {
            for (let i = 0; i < sizeX; i++) {
                for (let j = 0; j < sizeY; j++) {
                    // unflag
                    if (tiles[j][i] == 2 || tiles[j][i] == 3) tiles[j][i] -= 2;
                    reveal(i, j, false);
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
            // 0-4 hidden or flagged
            if (tiles[j][i] >= 0 && tiles[j][i] <= 4) {
                counter++;
            }
        }
    }
    if (counter == mineCount) {
        for (let i = 0; i < sizeX; i++) {
            for (let j = 0; j < sizeY; j++) {
                // unflag
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
    if (tiles[y][x] == 0 || tiles[y][x] == 1)
        tiles[y][x] += 2;
    else if (tiles[y][x] == 2 || tiles[y][x] == 3)
        tiles[y][x] -= 2;
}
function handleClick(event) {
    if (state == gameStates.lose || state == gameStates.win)
        window.setTimeout(restart, 100);
    let x = Math.floor(event.clientX / tileSize);
    let y = Math.floor(event.clientY / tileSize);
    if (x < 0 || x >= sizeX || y < 0 || y >= sizeY) return;
    if (!initialized) init(x, y);
    reveal(x, y);
}
function handleKeys(event) {
    if (event.key == "m") {
        if (state == gameStates.lose || state == gameStates.win) {
            restart();
            return;
        }
        if (!initialized) {
            switch (animation) {
                case 1:
                    init(sizeX / 2, sizeY / 2);
                    break;
                case 2:
                    init(0, sizeY / 2);
                    break;
                case 3:
                    init(sizeX / 2, 0);
                    break;
                default:
                    init();
                    break;
            }
        }
        for (let i = 0; i < sizeX; i++) {
            for (let j = 0; j < sizeY; j++) {
                if (tiles[j][i] != 0) {
                    let time = 0;
                    let method = () => reveal(i, j, true, false);
                    switch (animation) {
                        case 0:
                            time = 100 * (i + j);
                            break;
                        case 1:
                            time = 100 * Math.sqrt((i - sizeX / 2) ** 2 + (j - sizeY / 2) ** 2);
                            break;
                        case 2:
                            time = 100 * i;
                            break;
                        case 3:
                            time = 100 * j;
                            break;
                        case 4:
                            time = 0;
                            method = () => reveal(i, j, false, false);
                            break;
                        case 5:
                            time = 500 * ((i + j) % 2);
                            method = () => reveal(i, j, false, false);
                            break;
                        case 6:
                            time = 300 * ((i + j) % (sizeX / 3));
                            method = () => reveal(i, j, false, false);
                            break;
                    }
                    window.setTimeout(method, time);
                }
            }
        }
    }
    if(event.key == ",") {
        handleKeys({"key":"m"});
        handleKeys({"key":"m"});
    }
    if (event.key == "r")
        restart();
}
function handleContext(event) {
    if (!initialized) return;
    event.preventDefault();
    let x = Math.floor(event.clientX / tileSize);
    let y = Math.floor(event.clientY / tileSize);
    if (x < 0 || x >= sizeX || y < 0 || y >= sizeY) return;
    flag(x, y);
}
function drawBlankTiles() {
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
                        ctx.strokeStyle = "#87af3a";
                        ctx.lineWidth = tileSize / 7.5;
                        ctx.strokeRect((i + l) * tileSize, (j + k) * tileSize, tileSize, tileSize);
                    }
                }
            }
        }
    }
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
function drawBoard() {
    drawBlankTiles();
    drawGreenTiles();
    for (let i = 0; i < sizeX; i++) {
        for (let j = 0; j < sizeY; j++) {
            // > 5 is number tile
            if (tiles[j][i] > 5) {
                ctx.fillStyle = numColors[tiles[j][i] - 6];
                ctx.font = `bold ${tileSize / 1.3}px ${gameFont}`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(tiles[j][i] - 5, (i + 0.5) * tileSize, (j + 0.5) * tileSize, tileSize)
            }
            // 2 & 3 are flag tiles
            if (tiles[j][i] == 2 || tiles[j][i] == 3) {
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