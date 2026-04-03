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
// Initialization
let canvas = document.getElementById("canvas");
canvas.setAttribute("width", window.innerWidth);
canvas.setAttribute("height", window.innerHeight);
canvas.addEventListener("click", handleClick);
canvas.addEventListener("contextmenu", handleContext);
/** @type {CanvasRenderingContext2D} */
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
                if(randomX + i == x || randomY + j == y)
                    canPlace = false
        if (tiles[randomY][randomX] == 1 && canPlace) {
            tiles[randomY][randomX] = 0;
            i++;
        }
    }
    window.setInterval(drawBoard, 100);
    initialized = true;
}
function reveal(x, y) {
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
                    window.setTimeout(() => reveal(x + i, y + j), 100);
                }
            }
        }
    }
    // reveal all if you click a mine
    else if (tiles[y][x] == 0) {
        tiles[y][x] = 4;
        state = gameStates.lose;
        for (let i = 0; i < sizeX; i++){
            for (let j = 0; j < sizeY; j++) {
                if (tiles[j][i] == 2 || tiles[j][i] == 3) tiles[j][i] -= 2;
                reveal(i, j);                
            }
        }
    }
    drawBoard();
    checkWin();
}
function checkWin() {
    if (state != 0) return;
    let counter = 0;
    for (let i = 0; i < sizeX; i++){
        for (let j = 0; j < sizeY; j++) {
            if (tiles[j][i] == 0 || tiles[j][i] == 1 || tiles[j][i] == 2 || tiles[j][i] == 3 || tiles[j][i] == 4) {
                counter++;
            }
        }
    }
    if (counter == mineCount) {
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
    let x = Math.floor(event.clientX / tileSize);
    let y = Math.floor(event.clientY / tileSize);
    if (x < 0 || x >= sizeX || y < 0 || y >= sizeY) return;
    if (!initialized) init(x, y);
    reveal(x, y);
}
function handleContext(event) {
    if (!initialized) return;
    event.preventDefault();
    let x = Math.floor(event.clientX / tileSize);
    let y = Math.floor(event.clientY / tileSize);
    if (x < 0 || x >= sizeX || y < 0 || y >= sizeY) return;
    flag(x, y);
}
function drawBoard() {
    for (let i = 0; i < sizeX; i++){
        for (let j = 0; j < sizeY; j++) {
            // color tiles
            if (tiles[j][i] == 0 || tiles[j][i] == 1 || tiles[j][i] == 2 || tiles[j][i] == 3) {
                ctx.fillStyle = (i % 2 == 0 ^ j % 2 == 0) ? "#a2d149" : "#aad751";
            }
            else if (tiles[j][i] == 4) {
                ctx.fillStyle = "red";
            }
            else {
                ctx.fillStyle = (i % 2 == 0 ^ j % 2 == 0) ? "#d7b899" : "#e5c29f";
            }
            ctx.fillRect(i * tileSize, j * tileSize, tileSize, tileSize);
            ctx.fill();
            if (tiles[j][i] > 5) {
                // text if number tile
                ctx.fillStyle = numColors[tiles[j][i] - 6];
                ctx.font = `${tileSize}px JetBrains Mono`
                ctx.textAlign = "center";
                ctx.textBaseline = "middle"
                ctx.fillText(tiles[j][i] - 5, (i + 0.5) * tileSize, (j + 0.5) * tileSize, tileSize)
            }
            if (tiles[j][i] == 2 || tiles[j][i] == 3) {
                // red square if flag tile
                ctx.fillStyle = "#f23607";
                ctx.fillRect((i + 0.25) * tileSize, (j + 0.25) * tileSize, tileSize / 2, tileSize / 2);
            }
        }
    }
    if (state == gameStates.win) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "black";
        ctx.fillText("You Win", tileSize * sizeX / 2, tileSize * sizeY / 2)
        ctx.fill();
    }
}