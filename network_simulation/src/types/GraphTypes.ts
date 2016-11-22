import * as T from './Types';

export interface Graph {
    nodes: Node[],
    edges: Edge[]
}

// this implementation of fast edge lookups is quite bad:
// given N nodes, up to N-1 indices stored per node => (N-1)^2 just for the nodes
// on the other hand, in that case, we already have N(N-1)/2 edges...
// OPTIMIZE potential
export interface Node {
    // id: number  // index is ID
    name: string,
    links: number[],    // indices into the edge list for faster lookups
    x?: number, // for d3
    y?: number  // for d3
    weight?: number //for d3
}

export interface Edge {
    source: number,
    target: number,
    latency: number,
    x?: number,
    y?: number
}

export interface Topology {
    getNodes(): Node[],
    getEdges(): Edge[],
    addNode(): T.ClientId;
}


//--- GraphVisualizer ---
export interface VisualizerOptions {
    height: number, 
    width: number, 
    radius: number,
    linkDistance: number
}