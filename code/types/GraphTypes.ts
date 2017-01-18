import * as T from './Types';


/*
    now using adjacency lists
*/
export interface Graph {
    nodes: Node[]
}

export interface Node {
    // index of node is it's ID
    links: AdjacentEdge[]
}

export interface AdjacentEdge {
    id: number, // graph-wide unique number as ID
    latency: number,
    target: number
}

export interface d3Node {
    x?: number, // for d3
    y?: number  // for d3
    weight?: number //for d3
}

export interface d3Edge {
    source: number,
    target: number,
    latency: number,
    x?: number,
    y?: number
}

//--- GraphVisualizer ---
export interface VisualizerOptions {
    height: number, 
    width: number, 
    radius: number,
    linkDistance: number,
    charge: number
}