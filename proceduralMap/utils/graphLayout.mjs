import * as d3 from 'd3'; // ES Module import

class GraphLayout {
    constructor(dependencies) {
        // Generate nodes and links from dependencies
        this.nodes = dependencies.map(dep => ({
            id: dep.id,
            dependencies: dep.directDependencies,
            x: dep.x || Math.random() * 500,  // Random initial positions
            y: dep.y || Math.random() * 500
        }));

        // Create links based on dependencies
        this.links = [];
        dependencies.forEach(dep => {
            dep.dependencies.forEach(d => {
                // Create a link from the current node (dep) to each of its dependencies (d)
                this.links.push({ source: dep.id, target: d });
            });
        });

        this.positions = [];
    }

    applyForceSimulation(distance = 100, collisionForce = 50) {
        // Initialize the simulation with nodes and links
        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links).id(d => d.id).distance(distance))  // Define link force
            .force("x", d3.forceX())
            .force("y", d3.forceY())
            .force("collide", d3.forceCollide(collisionForce)) // Adjust collision radius as needed
            .on("tick", this.updatePositions.bind(this)); // Bind the tick event to update positions

        // Run the simulation for a certain number of ticks to stabilize
        this.simulation.stop(); // Start simulation in paused state
        for (let i = 0; i < 40000; i++) { // Run 300 ticks to stabilize the layout (can adjust)
            this.simulation.tick();
        }
    }

    updatePositions() {
        this.positions = this.nodes.map(d => ({
            id: d.id, // Retain the id of the node
            x: d.x,   // Store the x position
            y: d.y    // Store the y position
        }));
    }

    getPositions() {
        return this.positions;
    }
}

export default GraphLayout; // Use export default for ES Modules
