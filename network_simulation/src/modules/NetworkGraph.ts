import {Graph, Node, Edge} from '../types/GraphTypes';

class NetworkGraph {
    private graph: Graph = 
        {
            // index is ID
            nodes: [
                {   
                    name: "",
                    weight: 0
                },
                {   
                    name: "",
                    weight: 0
                },
                {   
                    name: "",
                    weight: 0
                },
                {
                    name: "",
                    weight: 0
                },
            ],
            edges: [
                {source: 0, target: 1, latency: 1}, 
                {source: 0, target: 2, latency: 1},
                {source: 0, target: 3, latency: 1},
                {source: 2, target: 3, latency: 1}
            ]
        };

    constructor() {
        console.log('(NetworkGraph) Instantiated network graph');
    }

    public getNodes(): Node[] {
        return this.graph.nodes;
    }

    public getEdges(): Edge[] {
        return this.graph.edges;
    }

}

export default NetworkGraph;