class dependenciesGenerator {
    constructor(numberPoints, maxDependencies) {
        this.numberPoints = numberPoints;
        this.maxDependencies = maxDependencies;
        this.dependencies = [];
    }

    getDependencies() {
        return this.dependencies; 
    }

    getNumberPoints() {
        return this.numberPoints;
    }

    getMaxDependencies() {
        return this.maxDependencies;
    }

    generateDependencies() {
        /*
        The concept of dependencies and directDependencies is:
            - directDependence is a point you are connected directly
                - For doing activity A, you need to complete B
                - Therefore, in activity A, B is a directly dependency
            - dependencies are the point you are not necessarily connected
                - For doing activity A, you need to complete B. But to complete B, you need to complete C
                - Therefore, in activity A, B and C are dependencies...
        */
        this.dependencies.push({
            id: 0,
            dependencies: [], 
            directDependencies: [],
        })

        for (let i = 1; i < this.numberPoints; i++) {
            let possibleDependenciesForPoint = this.dependencies;
            let numberOfPossibilities = possibleDependenciesForPoint.length;
            let numberDependenciesForPoint = Math.floor(Math.random() * Math.min(numberOfPossibilities, 3)) + 1;

            let point = {
                id: i,
                dependencies: [],
                directDependencies: []
            };

            for (let ii = 0; ii < numberDependenciesForPoint; ii++) {
                if (possibleDependenciesForPoint.length === 0) {
                    break;
                }

                else {
                    let dependencyIndex = 0;

                    if (possibleDependenciesForPoint.length > 1) {
                        dependencyIndex = Math.floor(
                            Math.random() * possibleDependenciesForPoint.length
                        );
                    }

                    const dependency = possibleDependenciesForPoint[dependencyIndex];

                    point.dependencies = [
                        ...point.dependencies,
                        ...dependency.dependencies,
                        dependency.id
                    ]

                    point.directDependencies = [
                        ...point.directDependencies, 
                        dependency.id
                    ];

                    possibleDependenciesForPoint = possibleDependenciesForPoint.filter(
                        obj => !point.directDependencies.includes(obj.id)
                    );

                    possibleDependenciesForPoint = possibleDependenciesForPoint.filter(
                        obj =>
                            !point.dependencies.includes(obj.id) && 
                            !point.directDependencies.some(dep => obj.dependencies.includes(dep))  
                    );
                }
            }

            if (point.dependencies.length > 0) {
                point.dependencies = [... new Set(point.dependencies)]
            }

            this.dependencies.push(point);
        }
    }
}

export default dependenciesGenerator;

// Example with 5 points and 3 max dependencies
//let generator = new dependenciesGenerator(20, 3);

// Generate the dependencies
//generator.generateDependencies();

// Log the generated dependencies
// console.log(generator.getDependencies());