import TopologyFullyConnected from './topology/TopologyFullyConnected';
import GraphVisualizer from './GraphVisualizer';

class NetworkSimulator {

    private topology: TopologyFullyConnected;
    private graphVisualizer: GraphVisualizer;

    constructor() {
        this.topology = new TopologyFullyConnected(100);
        this.graphVisualizer = new GraphVisualizer(<SVGElement><any>document.getElementById('graph_container'),
                                                   this.topology);
        this.graphVisualizer.updateGraph();
    }

}

export default NetworkSimulator;