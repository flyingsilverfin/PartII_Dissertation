interface Graph {
    nodes: Nodes,
    edges: Edges
}

interface Nodes {
    [i: number] : NodeDescription
}

interface NodeDescription {
    name: string
}

interface Edges {
    [i: number] : Edge
}

interface Edge {
    [i: number] : [number, number]
};



interface IRun {
    date: Date;
    pass: boolean;
}

interface IPerfDataSeries {
    desc: string;
    data: IPerfRun[];
}

interface IPerfRun {
    x: Date;
    y: number;
}