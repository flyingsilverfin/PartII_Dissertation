import * as GT from '../../types/GraphTypes';
import * as T from '../../types/Types';
import OpenSizeTopology from './OpenSizeTopology'
import LatencyModel from './LatencyModel';

/*
    Flexible size star topology
*/

class TopologyStar extends OpenSizeTopology  {
    
    private centerNode: GT.Node;

    constructor(latencyModel: LatencyModel, numClients: number = 0) {
        // numClients are added() in the super() call
        super(latencyModel, numClients);
        console.log('(NetworkGraph) Instantiated empty star topology with latencyModel: ' + latencyModel.getDescription());
    }

    public addNode(): T.ClientId {
        let newNode: GT.Node = {
            links: []
        };

        if (this.graph.nodes.length === 0) {
            this.centerNode = newNode;  // will always have id 0
            let nodeId = this.graph.nodes.length;
            this.graph.nodes.push(newNode);
            return <T.ClientId>nodeId;
        } else {
            let nodeId = this.graph.nodes.length;
            let edgeId = this.numEdges;
            this.numEdges++;
            let target = 0;
            let latency = this.latencyModel.getLatency(nodeId, 0);
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
            this.graph.nodes.push(newNode);
            return <T.ClientId>nodeId;
        }
    }
}

export default TopologyStar;