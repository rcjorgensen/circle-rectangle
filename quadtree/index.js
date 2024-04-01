// constants

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

const RADIUS = 12;
const DIAMETER = RADIUS * 2;

const MAX_DEPTH = 8;

// classes

class Rectangle {
  constructor(xlow, ylow, width, height) {
    this.xlow = xlow;
    this.ylow = ylow;
    this.width = width;
    this.height = height;
  }

  get xhigh() {
    return this.xlow + this.width;
  }

  get yhigh() {
    return this.ylow + this.height;
  }

  contains(rect) {
    if (rect.xlow < this.xlow) return false;
    if (rect.xhigh >= this.xhigh) return false;
    if (rect.ylow < this.ylow) return false;
    if (rect.yhigh >= this.yhigh) return false;
    return true;
  }

  overlaps(rect) {
    if (rect.xhigh < this.xlow) return false;
    if (rect.xlow > this.xhigh) return false;
    if (rect.yhigh < this.ylow) return false;
    if (rect.ylow > this.yhigh) return false;
    return true;
  }
}

class QuadTree {
  constructor(rect, depth = 0) {
    this.rect = rect;
    this.depth = depth;

    const childWidth = rect.width / 2;
    const childHeight = rect.height / 2;
    this.childRects = [
      // top left
      new Rectangle(rect.xlow, rect.ylow, childWidth, childHeight),
      // top right
      new Rectangle(rect.xlow + childWidth, rect.ylow, childWidth, childHeight),
      // bottom left
      new Rectangle(
        rect.xlow,
        rect.ylow + childHeight,
        childWidth,
        childHeight,
      ),
      // bottom right
      new Rectangle(
        rect.xlow + childWidth,
        rect.ylow + childHeight,
        childWidth,
        childHeight,
      ),
    ];

    this.children = [];
    this.items = [];
  }

  size() {
    let l = this.items.length;
    for (c of this.children) {
      l += c.size();
    }
    return l;
  }

  insert(item, boundingRect) {
    if (this.depth <= MAX_DEPTH) {
      for (let i = 0; i < 4; ++i) {
        if (this.childRects[i].contains(boundingRect)) {
          if (this.children[i] === undefined) {
            this.children[i] = new QuadTree(this.childRects[i], this.depth + 1);
          }

          this.children[i].insert(item, boundingRect);
          return;
        }
      }
    }

    // If we reached the maximum depth, or if the item didn't fit into any of the children, we add it to the current quad
    this.items.push(item);
  }
}

// setup state

const params = new URL(document.location).searchParams;
const count = parseInt(params.get("count") ?? 400);
const mean = parseInt(params.get("mean") ?? DIAMETER);
const stdDev = parseInt(params.get("stdDev") ?? 6);

const rectangles = [];

const seed = 1337 ^ 0xdeadbeef;
const rand = sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, seed);

for (let i = 0; i < count; ++i) {
  const cx = Math.floor(rand() * CANVAS_WIDTH);
  const cy = Math.floor(rand() * CANVAS_HEIGHT);
  const width = normal();
  const height = normal();

  rectangles.push(
    new Rectangle(cx - width / 2, cy - height / 2, width, height),
  );
}

const start = performance.now();

const root = new QuadTree(new Rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT));
for (let rect of rectangles) {
  root.insert(rect, getBoundingRect(rect));
}

const end = performance.now();

const output = document.getElementById("output");
output.innerHTML += `<p>Spacing calculation for ${rectangles.length} rectangles took ${(end - start).toFixed(2)} ms</p>`;

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

  // draw quads
  ctx.strokeStyle = "#F5F5F5"; // "white"
  traverse(root, (node) => {
    ctx.strokeRect(
      node.rect.xlow,
      node.rect.ylow,
      node.rect.width,
      node.rect.height,
    );
  });

  // draw rects
  ctx.globalAlpha = 0.2;
  rectangles.forEach((rect, i) => {
    ctx.fillStyle = "#ADD8E6"; // blue
    ctx.fillRect(rect.xlow, rect.ylow, rect.width, rect.height);

    if (rect.width <= DIAMETER || rect.height <= DIAMETER) {
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = "#FFFF99"; // yellow
      const boundingRect = getBoundingRect(rect);
      ctx.strokeRect(
        boundingRect.xlow,
        boundingRect.ylow,
        boundingRect.width,
        boundingRect.height,
      );
    } else {
      ctx.setLineDash([]);
      ctx.strokeStyle = "#98FB98"; // green
      ctx.strokeRect(rect.xlow, rect.ylow, rect.width, rect.height);
    }
  });
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

// handlers

// helpers

function traverse(node, callback) {
  callback(node);

  for (let child of node.children) {
    if (child !== undefined) {
      traverse(child, callback);
    }
  }
}

function getBoundingRect(rect) {
  const width = Math.max(rect.width, DIAMETER);
  const height = Math.max(rect.height, DIAMETER);
  return new Rectangle(
    rect.xlow + (rect.width - width) / 2,
    rect.ylow + (rect.height - height) / 2,
    width,
    height,
  );
}

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
