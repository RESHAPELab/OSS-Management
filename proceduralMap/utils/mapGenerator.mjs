import dependenciesGenerator from './dependenciesGenerator.mjs'; 
import GraphLayout from './graphLayout.mjs'; 

const dependenciesGeneratorInstance = new dependenciesGenerator(100, 6);
dependenciesGeneratorInstance.generateDependencies();
const dependencies = dependenciesGeneratorInstance.getDependencies();

let graphLayout = new GraphLayout(dependencies);

graphLayout.applyForceSimulation();
graphLayout.updatePositions();

let graphPositions = graphLayout.getPositions();
console.log(graphPositions);
