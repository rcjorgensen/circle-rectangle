// setup state

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

const params = new URL(document.location).searchParams;
const count = parseInt(params.get("count") ?? 400);
const mean = parseInt(params.get("mean") ?? 24);
const stdDev = parseInt(params.get("stdDev") ?? 6);

let selected;
const rectangles = [];

const seed = 1337 ^ 0xdeadbeef;
const rand = sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, seed);

for (let i = 0; i < count; ++i) {
  const x = Math.floor(rand() * CANVAS_WIDTH);
  const y = Math.floor(rand() * CANVAS_HEIGHT);
  const width = normal();
  const height = normal();

  const left = x - width / 2;
  const top = y - height / 2;
  const right = x + width / 2;
  const bottom = y + height / 2;

  rectangles.push({ x, y, left, top, right, bottom, width, height });
}

// draw

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

draw();

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#202020";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.2;
  rectangles.forEach((rect, i) => {
    if (selected === i) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#FFFF99";
      ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

      ctx.beginPath();
      ctx.arc(rect.x, rect.y, 12, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.globalAlpha = 0.2;
    }

    if (rect.width <= 24 || rect.height <= 24) {
      ctx.fillStyle = "#FFC0CB";
    } else {
      ctx.fillStyle = "#98FB98";
    }
    ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
  });
  ctx.globalAlpha = 1;
}

// handlers

canvas.onclick = (e) => {
  const x = e.offsetX;
  const y = e.offsetY;

  selected = null;

  rectangles.forEach((rect, i) => {
    if (
      rect.left <= x &&
      x <= rect.right &&
      rect.top <= y &&
      y <= rect.bottom
    ) {
      selected = i;
    }
  });

  draw();
};

// helpers

function sfc32(a, b, c, d) {
  return function () {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    let t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function normal() {
  const y1 = rand();
  const y2 = rand();

  return (
    mean + stdDev * Math.cos(2 * Math.PI * y2) * Math.sqrt(-2 * Math.log(y1))
  );
}