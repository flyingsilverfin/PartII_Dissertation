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
            links: []
        };
        let nodeId = this.graph.nodes.length;
        for (let i = 0; i < this.graph.nodes.length; i++) {
            let edgeId = this.numEdges;
            this.numEdges++;
            let adjacentEdge: GT.AdjacentEdge = {
                id: edgeId,
                target: i,
                latency: this.latencyModel.getLatency(edgeId)
            }
            // add references for fast neighbor retrieval
            newNode.links.push(adjacentEdge);

            let oppositeAdjacentEdge: GT.AdjacentEdge = {
                id: edgeId,
                target: nodeId,
                latency: this.latencyModel.getLatency(edgeId)
            }
            this.graph.nodes[i].links.push(oppositeAdjacentEdge);
        }
        this.graph.nodes.push(newNode);
        return <T.ClientId>nodeId;
    }
}

export default TopologyFullyConnected;