import NetworkGraph from './NetworkGraph';
import GraphVisualizer from './GraphVisualizer';

class NetworkSimulator {

    private networkGraph: NetworkGraph;
    private graphVisualizer: GraphVisualizer;

    constructor() {
        this.networkGraph = new NetworkGraph();
        this.graphVisualizer = new GraphVisualizer(document.getElementById('graph_container'),
                                                   this.networkGraph.getNodes(),
                                                   this.networkGraph.getEdges());
        this.graphVisualizer.draw();
    }

}

export default NetworkSimulator;