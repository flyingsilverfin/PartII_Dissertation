export interface Graph {
    nodes: Node[],
    edges: Edge[]
}

export interface Node {
    // id: number  // index is ID
    name: string,
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
