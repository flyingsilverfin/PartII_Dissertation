import * as GT from '../../types/GraphTypes';
import * as T from '../../types/Types';
import OpenSizeTopology from './OpenSizeTopology'
import LatencyModel from './LatencyModel';

/*
    Flexible size fully connected topology
*/

class TopologyFullyConnected extends OpenSizeTopology  {

    constructor(latencyModel: LatencyModel, numClients: number = 0) {
        // numClients are added() in the super() call
        super(latencyModel, numClients);
        console.log('(NetworkGraph) Instantiated  empty fully connected topology with latencyModel: ' + latencyModel.getDescription());


        
    }

    public addNode(): T.ClientId {
        let newNode: GT.Node = {
            links: []
        };
        let nodeId = this.graph.nodes.length;
        for (let target = 0; target < this.graph.nodes.length; target++) {
            let edgeId = this.numEdges;
            this.numEdges++;
            let latency = this.latencyModel.getLatency(nodeId, target);
            let adjacentEdge: GT.AdjacentEdge = {
                id: edgeId,
                target: target,
                latency: latency
            }
            // add references for fast neighbor retrieval
            newNode.links.push(adjacentEdge);

            let oppositeAdjacentEdge: GT.AdjacentEdge = {
                id: edgeId,
                target: nodeId,
                latency: latency
            }
            this.graph.nodes[target].links.push(oppositeAdjacentEdge);
        }
        this.graph.nodes.push(newNode);
        return <T.ClientId>nodeId;
    }
}

export default TopologyFullyConnected;