export interface Graph {
    nodes: Nodes,
    edges: Edges
}

export interface Nodes {
    [i: number] : NodeDescription
}

export interface NodeDescription {
    name: string
}

export interface Edges {
    [i: number] : [number, number]
}

