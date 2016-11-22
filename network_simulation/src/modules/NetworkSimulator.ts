import NetworkTopologyStar from './NetworkTopologyStar';
import GraphVisualizer from './GraphVisualizer';

class NetworkSimulator {

    private topology: NetworkTopologyStar;
    private graphVisualizer: GraphVisualizer;

    constructor() {
        this.topology = new NetworkTopologyStar(100);
        this.graphVisualizer = new GraphVisualizer(<SVGElement><any>document.getElementById('graph_container'),
                                                   this.topology);
        this.graphVisualizer.draw();
    }

}

export default NetworkSimulator;