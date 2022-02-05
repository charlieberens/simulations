let grid;
const dims = [512, 512];
const resolution = 15;
const particle_radius = 1;

const particle_radius_sq = particle_radius ** 2;

const dt = 0.5;
const n_particles = 1000;

const particle_force = 1;
const wall_force = 1;
const particle_mass = 1;

const wind_speed = 4;
const vert_speed_range = 1;

const partition_cell_size = 32;

const particle_view = false;
const fluid_view = true;
const cell_size = 16;
const opacity_multiplier = 150;

let particles = [];
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

    distance(pos) {
        return (
            sqrt(
                (pos[0] - this.center[0]) ** 2 + (pos[1] - this.center[1]) ** 2
            ) -
            this.r -
            particle_radius
        );
    }

    rough_sq_center_distance(pos) {
        return (
            (pos[0] - this.center[0]) ** 2 +
            (pos[1] - this.center[1]) ** 2 -
            this.r ** 2
        );
    }

    norm_and_distance(pos) {
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

        return [unit_normal_dir, center_distance - this.r];
    }
}

function setup() {
    createCanvas(dims[0], dims[1]);

    // Load objects
    barriers.push(new Circle(256, 256, 80));

    // Create Starting State
    generate_particles();
}

function generate_particles() {
    particles = [];

    for (let n = 0; n < n_particles; n++) {
        let particle;
        // Generate Coordinates, redo if they're inside a barrier
        while (!particle) {
            let x = random(dims[0] - 2 * particle_radius) + particle_radius;
            let y = random(dims[0] - 2 * particle_radius) + particle_radius;

            let overlap = false;
            for (let i = 0; i < barriers.length; i++) {
                let distance = barriers[i].distance([x, y]);
                if (distance <= particle_radius) {
                    overlap = true;
                }
            }
            if (!overlap) {
                particle = {
                    position: [x, y],
                    velocity: [
                        wind_speed,
                        random(2 * vert_speed_range) - vert_speed_range,
                    ],
                };
            }
        }
        particles.push(particle);
    }
}

function make2DArray(cols, rows, val) {
    let arr = [];
    for (let i = 0; i < cols; i++) {
        arr.push([]);
        for (let j = 0; j < rows; j++) {
            arr[i].push(val);
        }
    }
    return arr;
}

function partitions(particles) {
    let grid = make2DArray(
        Math.floor(dims[0] / cell_size),
        Math.floor(dims[1] / cell_size),
        0
    );
}

function particle_collisions(particle_list) {
    // Generate array of 2

    let output = [];

    for (let i = 0; i < particle_list.length; i++) {
        output.push(particle_list[i]);
    }

    for (let n = 0; n < output.length; n++) {
        for (let i = 0; i < particle_list.length; i++) {
            if (i != n) {
                let distance_sq = sq_distance(
                    particle_list[i].position,
                    particle_list[n].position
                );

                if (distance_sq < particle_radius_sq * 4) {
                    let particle_1 = particle_list[n];
                    let particle_2 = particle_list[i];

                    // Adjust position
                    let distance = sqrt(distance_sq);
                    let dx =
                        particle_list[n].position[0] -
                        particle_list[i].position[0];
                    let dy =
                        particle_list[n].position[1] -
                        particle_list[i].position[1];

                    let norm = [dx / distance, dy / distance];
                    let adjustment = 2 * particle_radius - distance;

                    output[n].position[0] += adjustment * norm[0];
                    output[n].position[1] += adjustment * norm[1];
                    output[i].position[0] -= adjustment * norm[0];
                    output[i].position[1] -= adjustment * norm[1];

                    // Adjust velocity
                    let p =
                        particle_1.velocity[0] * norm[0] +
                        particle_1.velocity[1] * norm[1] -
                        (particle_2.velocity[0] * norm[0] +
                            particle_2.velocity[1] * norm[1]);

                    output[n].velocity[0] =
                        particle_1.velocity[0] - p * norm[0];
                    output[n].velocity[1] =
                        particle_1.velocity[1] - p * norm[1];
                    output[i].velocity[0] =
                        particle_2.velocity[0] + p * norm[0];
                    output[i].velocity[1] =
                        particle_2.velocity[1] + p * norm[1];
                }
            }
        }
    }
    return output;
}

function wall_collisions(particle_list) {
    let output = particle_list;
    for (let n = 0; n < particle_list.length; n++) {
        // if (output[n].position[0] <= particle_radius) {
        //     output[n].position[0] = particle_radius;
        //     output[n].velocity[0] = -particle_list[n].velocity[0];
        // } else if (output[n].position[0] >= dims[0] - particle_radius - 1) {
        //     output[n].position[0] = dims[0] - particle_radius - 1;
        //     output[n].velocity[0] = -particle_list[n].velocity[0];
        // }
        if (
            output[n].position[0] <= -particle_radius ||
            output[n].position[0] >= dims[0] + particle_radius - 1
        ) {
            output.splice(n, 1);
        }
        // if (output[n].position[1] <= particle_radius) {
        //     output[n].position[1] = particle_radius;
        //     output[n].velocity[1] = -particle_list[n].velocity[1];
        // } else if (output[n].position[1] >= dims[1] - particle_radius - 1) {
        //     output[n].position[1] = dims[1] - particle_radius - 1;
        //     output[n].velocity[1] = -particle_list[n].velocity[1];
        // }
        if (
            output[n].position[1] <= -particle_radius ||
            output[n].position[1] >= dims[1] + particle_radius - 1
        ) {
            output.splice(n, 1);
        }
    }

    return output;
}

function barrier_collisions(particle_list) {
    let output = particle_list;
    for (let n = 0; n < particle_list.length; n++) {
        for (let i = 0; i < barriers.length; i++) {
            let rough_sq_center_distance = barriers[i].rough_sq_center_distance(
                particle_list[n].position
            );
            if (rough_sq_center_distance <= 15) {
                let [norm, distance] = barriers[i].norm_and_distance(
                    particle_list[n].position
                );
                if (distance <= 0) {
                    let particle = particle_list[n];

                    distance = distance - particle_radius;

                    // Adjust position
                    output[n].position[0] -= distance * norm[0];
                    output[n].position[1] -= distance * norm[1];

                    // Adjust Velocity

                    let dot =
                        particle.velocity[0] * norm[0] +
                        particle.velocity[1] * norm[1];

                    output[n].velocity[0] -= 2 * dot * norm[0];
                    output[n].velocity[1] -= 2 * dot * norm[1];
                }
            }
        }
    }
    return output;
}

function update_position(particle_list) {
    output = particle_list;

    for (let n = 0; n < particle_list.length; n++) {
        particle_list[n].position[0] += particle_list[n].velocity[0] * dt;
        particle_list[n].position[1] += particle_list[n].velocity[1] * dt;
    }

    return output;
}

function add_particles(particle_list) {
    const n_new = n_particles - particle_list.length;

    let output = particle_list;

    for (let n = 0; n < n_new; n++) {
        let particle;
        // Generate Coordinates, redo if they're inside a barrier
        while (!particle) {
            let x = 2 + particle_radius;
            let y = random(dims[1] - 2 * particle_radius) + particle_radius;

            let overlap = false;
            for (let i = 0; i < barriers.length; i++) {
                let distance = barriers[i].distance([x, y]);
                if (distance <= particle_radius) {
                    overlap = true;
                }
            }
            if (!overlap) {
                particle = {
                    position: [x, y],
                    velocity: [
                        wind_speed,
                        random(2 * vert_speed_range) - vert_speed_range,
                    ],
                };
            }
        }
        output.push(particle);
    }
    return output;
}

function sq_distance(position_1, position_2) {
    let dx = position_1[0] - position_2[0];
    let dy = position_1[1] - position_2[1];
    return dx ** 2 + dy ** 2;
}

function particle_renderer(particles, opacity) {
    for (let n = 0; n < particles.length; n++) {
        let particle = particles[n];
        fill(opacity ? opacity : 255);
        stroke(opacity ? opacity : 255);
        ellipse(
            particle.position[0],
            particle.position[1],
            particle_radius * 2,
            particle_radius * 2
        );
    }
    for (let i = 0; i < barriers.length; i++) {
        if (barriers[i].type === "circle") {
            fill(0);
            stroke(255);
            ellipse(
                barriers[i].center[0],
                barriers[i].center[1],
                barriers[i].r * 2,
                barriers[i].r * 2
            );
        }
    }
}

function fluid_renderer(particles) {
    let grid = make2DArray(
        Math.floor(dims[0] / cell_size),
        Math.floor(dims[1] / cell_size),
        0
    );
    for (let n = 0; n < particles.length; n++) {
        let particle = particles[n];

        let x = min(
            max(Math.floor(particle.position[0] / cell_size), 0),
            grid.length - 1
        );
        let y = min(
            max(Math.floor(particle.position[1] / cell_size), 0),
            grid.length - 1
        );

        grid[x][y] += 1;
    }
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
            let sum =
                4 * grid[i][j] +
                grid[min(i + 1, grid.length - 1)][j] +
                grid[max(i - 1, 0)][j] +
                grid[i][min(j + 1, grid[i].length - 1)] +
                grid[i][max(j - 1, 0)];

            fill((opacity_multiplier * sum * 1000) / n_particles / cell_size);
            rect(i * cell_size, j * cell_size, cell_size, cell_size);
        }
    }
    for (let i = 0; i < barriers.length; i++) {
        if (barriers[i].type === "circle") {
            fill(0);
            stroke(255);
            ellipse(
                barriers[i].center[0],
                barriers[i].center[1],
                barriers[i].r * 2,
                barriers[i].r * 2
            );
        }
    }
}

function draw() {
    background(0);
    noStroke();

    // let partitions = partitions(particles);

    particles = wall_collisions(particles);
    particles = particle_collisions(particles);
    particles = barrier_collisions(particles);
    particles = update_position(particles);

    particles = add_particles(particles);

    if (fluid_view) {
        fluid_renderer(particles);
    }
    if (particle_view) {
        particle_renderer(particles);
    }
}

function restart() {
    setup();
}
