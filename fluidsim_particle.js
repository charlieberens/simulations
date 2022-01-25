let grid;
const dims = [512, 512];
const resolution = 15;
const particle_radius = 2;

const particle_radius_sq = particle_radius ** 2;

const dt = 0.5;
const n_particles = 500;

const particle_force = 1;
const wall_force = 1;
const particle_mass = 1;

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
    createCanvas(dims[0], dims[1]);

    // Create Starting State
    generate_particles();

    // Load objects
    barriers.push(new Circle(24, 24, 5));
}

function generate_particles() {
    for (let n = 0; n < n_particles; n++) {
        particles.push({
            position: [
                random(dims[0] - 2 * particle_radius) + particle_radius,
                random(dims[1] - 2 * particle_radius) + particle_radius,
            ],
            velocity: [random(6) - 3, random(6) - 3],
        });
    }
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
        if (output[n].position[0] <= particle_radius) {
            output[n].position[0] = particle_radius;
            output[n].velocity[0] = -particle_list[n].velocity[0];
        } else if (output[n].position[0] >= dims[0] - particle_radius - 1) {
            output[n].position[0] = dims[0] - particle_radius - 1;
            output[n].velocity[0] = -particle_list[n].velocity[0];
        }
        if (output[n].position[1] <= particle_radius) {
            output[n].position[1] = particle_radius;
            output[n].velocity[1] = -particle_list[n].velocity[1];
        } else if (output[n].position[1] >= dims[1] - particle_radius - 1) {
            output[n].position[1] = dims[1] - particle_radius - 1;
            output[n].velocity[1] = -particle_list[n].velocity[1];
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

function sq_distance(position_1, position_2) {
    let dx = position_1[0] - position_2[0];
    let dy = position_1[1] - position_2[1];
    return dx ** 2 + dy ** 2;
}

function draw() {
    background(0);
    noStroke();

    particles = wall_collisions(particles);
    particles = particle_collisions(particles);
    particles = update_position(particles);

    for (let n = 0; n < particles.length; n++) {
        fill(255);
        let particle = particles[n];
        ellipse(
            particle.position[0],
            particle.position[1],
            particle_radius * 2,
            particle_radius * 2
        );
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
