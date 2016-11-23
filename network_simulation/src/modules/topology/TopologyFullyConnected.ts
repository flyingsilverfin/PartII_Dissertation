import * as GT from '../../types/GraphTypes';
import * as T from '../../types/Types';
import OpenSizeTopology from './OpenSizeTopology'
import LatencyModel from './LatencyModel';

/*
    Flexible size fully connected topology
*/

class TopologyFullyConnected extends OpenSizeTopology  {

    constructor(latencyModel: LatencyModel) {
        super(latencyModel)
        console.log('(NetworkGraph) Instantiated  empty star topology with latencyModel: ' + latencyModel.getDescription());
    }

    public addNode(): T.ClientId {
        let newNode: GT.Node = {
            name: "",
            weight: 0,
            links: []
        };
        let id = this.graph.nodes.length;
        for (let i = 0; i < this.graph.nodes.length; i++) {
            let newEdge: GT.Edge = {
                source: i,
                target: id,
                latency: this.latencyModel.getLatency(this.graph.edges.length-1)
            }
            this.graph.edges.push(newEdge);
            // add references for fast neighbor retrieval
            newNode.links.push(this.graph.edges.length-1);
            this.graph.nodes[i].links.push(this.graph.edges.length-1)
        }

        this.graph.nodes.push(newNode);
        return <T.ClientId>id;
    }
}

export default TopologyFullyConnected;