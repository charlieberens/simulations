function make2DArray(cols, rows) {
    let arr = [];
    for (let i = 0; i < cols; i++) {
        arr.push(new Array(rows));
    }
    return arr;
}

let grid;
const dims = [49, 49];
const resolution = 15;

const dt = 0.025;

const diffusion_strength = 0.0001;
const velocity_diffusion_strength = 0.0001;
const vanishing_strength = 0.00002;
const shared_velocity_strength = 0.02;
const minimum_object_distance = 3;

let barriers = [];

class Barrier {
    constructor(x, y, width, height) {
        this.center = [x, y];
        this.dimensions = [width, height];
    }
}

class Circle extends Barrier {
    constructor(x, y, r) {
        super(x, y, r, r);
        this.r = r;
        this.type = "circle";
    }

    distance_and_normal(pos) {
        let center_distance = sqrt(
            (pos[0] - this.center[0]) ** 2 + (pos[1] - this.center[1]) ** 2
        );
        let unit_normal_dir;
        if (center_distance !== 0) {
            unit_normal_dir = [
                (pos[0] - this.center[0]) / center_distance,
                (pos[1] - this.center[1]) / center_distance,
            ];
        } else {
            unit_normal_dir = [0, 0];
        }

        return [center_distance - this.r, unit_normal_dir];
    }
}

function setup() {
    createCanvas(resolution * dims[0], resolution * dims[1]);
    grid = make2DArray(...dims);

    // Create Starting State
    define_grid();

    // Load objects
    barriers.push(new Circle(24, 24, 5));
}

function define_grid() {
    for (let i = 0; i < dims[0]; i++) {
        for (let j = 0; j < dims[1]; j++) {
            grid[i][j] = {
                density: random(0.2),
                velocity: [0, 5],
            };
            if (j > 2 && j < 7) {
                if (i > 20 && i < 30) {
                    grid[i][j] = {
                        density: 1,
                        velocity: [0, 5],
                    };
                }
            }
        }
    }
}

function velocity(grid) {
    output = grid;

    for (let i = 0; i < dims[0]; i++) {
        for (let j = 0; j < dims[1]; j++) {
            let pixel = grid[i][j];
            let pos = [i - pixel.velocity[0] * dt, j - pixel.velocity[1] * dt]; //Position where velocity vector falls
            let corner = [floor(pos[0]), floor(pos[1])]; //Coordinates of bottom left corner pixel
            let frac = [pos[0] - corner[0], pos[1] - corner[1]]; //Amount above and to the right of the corner pixel

            // Wrap around
            let corners = [];
            let temp_corners = [
                corner,
                [corner[0] + 1, corner[1]],
                [corner[0], corner[1] + 1],
                [corner[0] + 1, corner[1] + 1],
            ];
            temp_corners.forEach((point) => {
                corners.push(handle_edges(grid, point));
            });

            // Find the horizontal interpolation between (0,1) and (1,1) and (0,0) and (1,0)
            let z_1 = lerp(corners[0].density, corners[1].density, frac[0]);
            let z_2 = lerp(corners[2].density, corners[3].density, frac[0]);

            // Find the vertical interpolation between the horizontal interpolations
            let output_density = lerp(z_1, z_2, frac[1]);
            output[i][j].density = output_density;

            // Velocity sharing
        }
    }
    return output;
}
function velocity__2(grid) {
    output = grid;

    for (let i = 0; i < dims[0]; i++) {
        for (let j = 0; j < dims[1]; j++) {
            output[i][j].density = 0;
        }
    }
    for (let i = 0; i < dims[0]; i++) {
        for (let j = 0; j < dims[1]; j++) {
            let pixel = grid[i][j];
            let pos = [i - pixel.velocity[0] * dt, j - pixel.velocity[1] * dt]; //Position where velocity vector falls
            let corner = [floor(pos[0]), floor(pos[1])]; //Coordinates of bottom left corner pixel
            let frac = [pos[0] - corner[0], pos[1] - corner[1]]; //Amount above and to the right of the corner pixel

            // Wrap around
            let corners = [];
            let temp_corners = [
                corner,
                [corner[0] + 1, corner[1]],
                [corner[0], corner[1] + 1],
                [corner[0] + 1, corner[1] + 1],
            ];
            temp_corners.forEach((point) => {
                corners.push(handle_edges(grid, point));
            });

            // Find the horizontal interpolation between (0,1) and (1,1) and (0,0) and (1,0)
            let z_1 = lerp(corners[0].density, corners[1].density, frac[0]);
            let z_2 = lerp(corners[2].density, corners[3].density, frac[0]);

            // Find the vertical interpolation between the horizontal interpolations
            let output_density = lerp(z_1, z_2, frac[1]);
            output[i][j].density = output_density;

            // Velocity sharing
        }
    }
    return output;
}

function handle_edges(grid, coords) {
    if (coords[1] < 0) {
        return {
            density: (coords[0] % 4) * 0.05,
            velocity: [0, 5],
        };
    } else if (coords[1] > dims[1] - 1) {
        return {
            density: 0,
            velocity: [0, 5],
        };
    }
    if (coords[0] < 0) {
        return grid[0][coords[1]];
    } else if (coords[0] > dims[0] - 1) {
        return grid[dims[0] - 1][coords[1]];
    }
    return grid[coords[0]][coords[1]];
}

function diffusion(grid) {
    output = grid;

    for (let n = 0; n < 20; n++) {
        for (let i = 0; i < dims[0]; i++) {
            for (let j = 0; j < dims[1]; j++) {
                output[i][j].density =
                    (output[i][j].density +
                        (diffusion_strength *
                            (handle_edges(output, [i + 1, j]).density +
                                handle_edges(output, [i - 1, j]).density +
                                handle_edges(output, [i, j + 1]).density +
                                handle_edges(output, [i, j - 1]).density)) /
                            4) /
                        (1 + diffusion_strength) -
                    vanishing_strength;
            }
        }
    }

    return output;
}

function velocity_diffusion(grid) {
    output = grid;

    for (let n = 0; n < 20; n++) {
        for (let i = 0; i < dims[0]; i++) {
            for (let j = 0; j < dims[1]; j++) {
                output[i][j].velocity[0] =
                    (output[i][j].velocity[0] +
                        (diffusion_strength *
                            (handle_edges(output, [i + 1, j]).velocity[0] +
                                handle_edges(output, [i - 1, j]).velocity[0] +
                                handle_edges(output, [i, j + 1]).velocity[0] +
                                handle_edges(output, [i, j - 1]).velocity[0])) /
                            4) /
                    (1 + velocity_diffusion_strength);
                output[i][j].velocity[1] =
                    (output[i][j].velocity[1] +
                        (diffusion_strength *
                            (handle_edges(output, [i + 1, j]).velocity[1] +
                                handle_edges(output, [i - 1, j]).velocity[1] +
                                handle_edges(output, [i, j + 1]).velocity[1] +
                                handle_edges(output, [i, j - 1]).velocity[1])) /
                            4) /
                    (1 + velocity_diffusion_strength);
            }
        }
    }

    return output;
}

function barrier_effects(grid) {
    output = grid;

    for (let i = 0; i < dims[0]; i++) {
        for (let j = 0; j < dims[1]; j++) {
            for (let n = 0; n < barriers.length; n++) {
                [distance, unit_normal_dir] = barriers[n].distance_and_normal([
                    i,
                    j,
                ]);

                if (distance <= minimum_object_distance) {
                    if (distance < 0) {
                        output[i][j].density = 0;
                    } else {
                        output[i][j].velocity[0] +=
                            (minimum_object_distance - distance) *
                            unit_normal_dir[0];
                        output[i][j].velocity[1] +=
                            (minimum_object_distance - distance) *
                            unit_normal_dir[1];
                    }
                }
                // if (distance <= minimum_object_distance) {
                //     output[i][j].velocity[0] += 1;
                //     output[i][j].velocity[1] += 1;
                // }
            }
        }
    }
    return output;
}

function handle_edges_p(grid, coords) {
    if (coords[1] < 0) {
        coords[1] = 0;
    } else if (coords[1] > dims[1] - 1) {
        coords[1] = dims[1] - 1;
    }
    if (coords[0] < 0) {
        coords[0] = 0;
    } else if (coords[0] > dims[0] - 1) {
        coords[0] = dims[0] - 1;
    }
    return grid[coords[0]][coords[1]];
}

//Clear divergence
function clear_div(grid) {
    let div_field = make2DArray(...dims);
    let p = make2DArray(...dims); //Value of the potential function at each point
    let output = grid;

    // Generate divergence field
    for (let i = 0; i < dims[0]; i++) {
        for (let j = 0; j < dims[1]; j++) {
            //Approximate the divergence using a small dx and dy
            div_field[i][j] =
                handle_edges(grid, [i + 1, j]).velocity[0] -
                handle_edges(grid, [i - 1, j]).velocity[0] +
                handle_edges(grid, [i, j + 1]).velocity[1] -
                handle_edges(grid, [i, j - 1]).velocity[1];
            // Set initial value for potential function
            p[i][j] = 0;
        }
    }
    // Approximate potential function using Gaus-Seidel method
    for (let n = 0; n < 20; n++) {
        for (let i = 0; i < dims[0]; i++) {
            for (let j = 0; j < dims[1]; j++) {
                p[i][j] =
                    (handle_edges_p(p, [i + 1, j]) +
                        handle_edges_p(p, [i - 1, j]) +
                        handle_edges_p(p, [i, j + 1]) +
                        handle_edges_p(p, [i, j - 1]) -
                        div_field[i][j]) /
                    4;
            }
        }
    }
    // Subtract gradient of potential function from initial vector field
    for (let i = 0; i < dims[0]; i++) {
        for (let j = 0; j < dims[1]; j++) {
            output[i][j].velocity[0] -=
                (handle_edges_p(p, [i + 1, j]) -
                    handle_edges_p(p, [i - 1, j])) /
                2;
            output[i][j].velocity[1] -=
                (handle_edges_p(p, [i, j + 1]) -
                    handle_edges_p(p, [i, j - 1])) /
                2;
        }
    }
    return output;
}

function objects() {}

function draw() {
    background(0);
    noStroke();

    // Velocity behaves better if the vector field is mass conserving, so clear_div is called twice
    grid = diffusion(grid);
    grid = clear_div(grid);
    // grid = velocity_diffusion(grid);
    grid = velocity(grid);
    grid = barrier_effects(grid);
    grid = clear_div(grid);

    grid[25][0] = { density: 1, velocity: [5, 0] };
    grid[26][0] = { density: 1, velocity: [5, 0] };
    grid[24][0] = { density: 1, velocity: [5, 0] };
    grid[23][0] = { density: 1, velocity: [5, 0] };
    grid[27][0] = { density: 1, velocity: [5, 0] };
    grid[28][0] = { density: 1, velocity: [5, 0] };
    grid[22][0] = { density: 1, velocity: [5, 0] };

    for (let i = 0; i < dims[0]; i++) {
        for (let j = 0; j < dims[1]; j++) {
            fill(255 * grid[i][j].density);
            rect(i * resolution, j * resolution, resolution, resolution);
        }
    }
    for (let n = 0; n < barriers.length; n++) {
        if (barriers[n].type === "circle") {
            // fill(255, 204, 100);
            // ellipse(
            //     barriers[n].center[0] * resolution,
            //     barriers[n].center[1] * resolution,
            //     barriers[n].r * 2 * resolution,
            //     barriers[n].r * 2 * resolution
            // );
        }
    }
}

function restart() {
    setup();
}
