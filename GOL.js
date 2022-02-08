function make2DArray(cols, rows) {
    let arr = [];
    for (let i = 0; i < cols; i++) {
        arr.push(new Array(rows));
    }
    return arr;
}

let grid;
let dims = [150, 150];
let resolution = 5;
let speed = 30;

function slider(e) {
    if (e.name === "speed") {
        speed = Math.min(e.value);
        frameRate(speed);
    }
}

function setup() {
    let canvas = createCanvas(resolution * dims[0], resolution * dims[1]);
    grid = make2DArray(...dims);

    frameRate(speed);
    canvas.parent("#canvas-cont");

    // Create Starting State
    for (let i = 0; i < dims[0]; i++) {
        for (let j = 0; j < dims[1]; j++) {
            grid[i][j] = floor(random(2));
        }
    }
}

function calculateNext(grid) {
    output = make2DArray(...dims);

    for (let i = 0; i < dims[0]; i++) {
        for (let j = 0; j < dims[1]; j++) {
            let neighbors = 0;

            if (i > 0) {
                neighbors += grid[i - 1][j - 1];
                neighbors += grid[i - 1][j];
                neighbors += grid[i - 1][j + 1];

                if (i < dims[0] - 1) {
                    neighbors += grid[i + 1][j - 1];
                    neighbors += grid[i + 1][j];
                    neighbors += grid[i + 1][j + 1];
                }
            }

            neighbors += grid[i][j - 1];
            neighbors += grid[i][j + 1];

            let alive = 0;

            if (grid[i][j]) {
                if (neighbors >= 2 && neighbors <= 3) {
                    alive = 1;
                }
            } else {
                if (neighbors === 3) {
                    alive = 1;
                }
            }
            output[i][j] = alive;
        }
    }

    return output;
}

function draw() {
    background(0);

    grid = calculateNext(grid);

    for (let i = 0; i < dims[0]; i++) {
        for (let j = 0; j < dims[1]; j++) {
            if (grid[i][j] === 1) {
                fill(255);
                rect(i * resolution, j * resolution, resolution, resolution);
            }
        }
    }
}
