import * as GT from '../../types/GraphTypes';
import * as T from '../../types/Types';
import OpenSizeTopology from './OpenSizeTopology'

/*
    Flexible size fully connected topology
*/

class TopologyFullyConnected extends OpenSizeTopology  {

    constructor(defaultLatency: number) {
        super(defaultLatency)
        console.log('(NetworkGraph) Instantiated  empty star topology with latency: ' + defaultLatency);
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
                latency: this.latency
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