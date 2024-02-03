window.onload = init;

var SCREEN_WIDTH = 900;
var SCREEN_HEIGHT = 600;


var RADIUS_SCALE_MIN = 1;
var RADIUS_SCALE_MAX = 1.5;

// The number of circles
var squareSize = 30;
var circleSize = 15;
var xSquares;
var ySquares;
var xSize;
var ySize;

var canvas;
var context;
var field;

var mouseX = (window.innerWidth - SCREEN_WIDTH);
var mouseY = (window.innerHeight - SCREEN_HEIGHT);
var mouseDownX;
var mouseDownY;
var mouseIsDown = false;
var selectedFound = false;
var bullets;
var selectionColor = 'rgba(255,255,255,1)';
var baseSpeed = 8;

var colors = ['#000000', '#ffffff']

function init() {
    canvas = document.getElementById('main');

    if (canvas && canvas.getContext) {
        context = canvas.getContext('2d');

        // Register event listeners
        window.addEventListener('resize', windowResizeHandler, false);
        document.addEventListener('keypress', keyPressHandler, false);

        windowResizeHandler();
        createField();
        initBullets();

        setInterval(loop, 1000 / 30);
    }
}

document.oncontextmenu = function (e) {
    var evt = new Object({ keyCode: 93 });
    stopEvent(e);
}

function createField() {
    field = [];

    xSquares = Math.floor(SCREEN_WIDTH / squareSize);
    ySquares = Math.floor(SCREEN_HEIGHT / squareSize);
    xSize = Math.ceil(SCREEN_WIDTH / xSquares);
    ySize = Math.ceil(SCREEN_HEIGHT / ySquares);

    for (let x = 0; x < xSquares; x++) {
        var row = [];
        for (let y = 0; y < ySquares; y++) {
            var square = {
                position: { x: xSize * x, y: ySize * y },
                index: { x: x, y: y },
                team: getTeam(x, y)
            };
            row.push(square)
        }
        field.push(row)
    }

}

function getTeam(x, y) {
    return x < (xSquares / 2) ? 0 : 1;
}

function getBulletTeam(x, y) {
    return x > (SCREEN_WIDTH / 2) ? 0 : 1;
}

function stopEvent(event) {
    if (event.preventDefault != undefined)
        event.preventDefault();
    if (event.stopPropagation != undefined)
        event.stopPropagation();
}

function initBullets() {
    bullets = [];
    addNewBullet(0, SCREEN_WIDTH / 2);
    addNewBullet(0, SCREEN_WIDTH / 2);
    addNewBullet(0, SCREEN_WIDTH / 2);
    addNewBullet(0, SCREEN_WIDTH / 2);
    addNewBullet(SCREEN_WIDTH / 2, SCREEN_WIDTH);
    addNewBullet(SCREEN_WIDTH / 2, SCREEN_WIDTH);
    addNewBullet(SCREEN_WIDTH / 2, SCREEN_WIDTH);
    addNewBullet(SCREEN_WIDTH / 2, SCREEN_WIDTH);
}

function addNewBullet(xMin, xMax) {
    let speedSum = baseSpeed * 2;
    let angle = Math.random() * 6.18 - 3.14;
    let dx = Math.sin(angle) * speedSum;
    let dy = Math.cos(angle) * speedSum;
    let xPos = null;
    let borderOffset = circleSize / 2 + 1;
    if (xMin == undefined || xMax == undefined) {
        xPos = borderOffset + Math.random() * (SCREEN_WIDTH - borderOffset);
    }
    else {
        xPos = borderOffset + xMin + Math.random() * ((xMax - xMin) - borderOffset);
    }

    let pos = { x: xPos, y: borderOffset + Math.random() * (SCREEN_HEIGHT - borderOffset) };
    var bulletTeam = getBulletTeam(pos.x, pos.y);
    let bullet = {
        position: pos,
        speed: { dx: dx, dy: dy },
        fillColor: getFillColor(bulletTeam),
        size: circleSize,
        team: bulletTeam
    };
    bullets.push(bullet);
}

function resetSpeed() {
    for (let i = 0, len = bullets.length; i < len; i++) {
        let b = bullets[i];
        var speed = { dx: baseSpeed + Math.random() * baseSpeed, dy: baseSpeed + Math.random() * baseSpeed };
        b.speed.dx = speed.dx;
        b.speed.dy = speed.dy;
    }
}

function keyPressHandler(e) {
    if (e.keyCode == 32) {
        addNewBullet();
    }
    else if (e.keyCode = 13) {
        bullets.pop();
    }
}

function windowResizeHandler() {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;

    canvas.style.position = 'absolute';
    canvas.style.left = (window.innerWidth - SCREEN_WIDTH) * .5 + 'px';
    canvas.style.top = (window.innerHeight - SCREEN_HEIGHT) * .5 + 'px';
}

function isCollision(circleX, circleY, circleRadius, squareX, squareY, squareWidth, squareHeight) {
    // Calculate the distance between the center of the circle and the square
    let deltaX = circleX - Math.max(squareX, Math.min(circleX, squareX + squareWidth));
    let deltaY = circleY - Math.max(squareY, Math.min(circleY, squareY + squareHeight));
    let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check if the distance is less than the sum of the radii
    return distance < circleRadius;
}

function loop() {

    // Fade out the lines slowly by drawing a rectangle over the entire canvas
    context.fillStyle = 'rgba(0,0,0,0.1)';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    handleFieldFrame();
    handleBulletsFrame();
}

function findSquareInRadius(bullet) {
    let ret = { current: null, hit: null, match: 0 };
    for (let x = 0, xLen = field.length; x < xLen; x++) {
        for (let y = 0, yLen = field[x].length; y < yLen; y++) {
            var sq = field[x][y];

            if (isCollision(
                bullet.position.x, bullet.position.y, bullet.size / 2,
                sq.position.x, sq.position.y, xSize, ySize)) {
                if (sq.team == bullet.team) {
                    ret.hit = sq;
                }
                else {
                    ret.current = sq;
                }
            }

            if (ret.current != null && ret.hit != null) {
                return ret;
            }
        }
    }
    return ret;
}

function calculateNewSpeed(bullet, square, sqSizeX, sqSizeY) {
    // Calculate the angle of collision
    let angle = Math.atan2(bullet.position.y - (square.position.y + sqSizeY / 2), bullet.position.x - (square.position.x + sqSizeX / 2));

    // Calculate the new speed components
    let speed = Math.sqrt(bullet.speed.dx * bullet.speed.dx + bullet.speed.dy * bullet.speed.dy);
    bullet.speed.dx = speed * Math.cos(angle);
    bullet.speed.dy = speed * Math.sin(angle);
}

function changleTeamOfSquare(squares, bullet) {
    squares.hit.team = squares.current.team;
}

function handleBulletsFrame() {
    for (let i = 0, len = bullets.length; i < len; i++) {
        let b = bullets[i];

        var squares = findSquareInRadius(b);

        if (squares.current != null && squares.hit != null) {
            calculateNewSpeed(b, squares.hit, xSize, ySize);
            changleTeamOfSquare(squares, b);
        }

        b.position.x += b.speed.dx;
        b.position.y += b.speed.dy;

        let bRad = b.size / 2;
        if (b.position.x - bRad < 0 || b.position.x + bRad > SCREEN_WIDTH) {
            b.speed.dx *= -1;
        }
        if (b.position.y - bRad < 0 || b.position.y + bRad > SCREEN_HEIGHT) {
            b.speed.dy *= -1;
        }

        context.beginPath();
        context.fillStyle = b.fillColor;
        context.strokeStyle = b.fillColor;
        context.lineWidth = b.size;
        context.moveTo(b.position.x, b.position.y);
        context.lineTo(b.position.x, b.position.y);
        context.stroke();
        context.arc(b.position.x, b.position.y, b.size / 2, 0, Math.PI * 2, true);
        context.fill();
    }
}

function getFillColor(team) {
    return colors[team];
}

function handleFieldFrame() {

    if (field.length == 0) {
        createField();
    }

    for (let x = 0, xLen = field.length; x < xLen; x++) {
        for (let y = 0, yLen = field[x].length; y < yLen; y++) {
            let sq = field[x][y];
            let fillColor = getFillColor(sq.team);

            context.fillStyle = fillColor;
            context.fillRect(sq.position.x, sq.position.y, xSize, ySize);
        }
    }
}