import * as GT from '../../types/GraphTypes';
import * as T from '../../types/Types';

/*
    This is an abstract network topology


    NOTE!!!!
        Strong requirement that adding nodes does not change the index of existing edges/existing network properties at all
        needed for implementing network stats reasonably efficiently
        TODO: write unit tests for this
*/

abstract class Topology {
    protected graph: GT.Graph;
    protected allocated = 0;

    // this doesn't need to be efficient, only used by D3 once to start and then on each full redraw
    public getNodes(): GT.Node[] {
        return this.graph.nodes;
    }

    // this doesn't need to be efficient, only used by D3 once to start and then on each full redraw
    public getEdges(): GT.Edge[] {
        return this.graph.edges;
    }

    public abstract getMaximumSize(): number;

    // this may need to be efficient
    public abstract addNode(): T.ClientId;

    // this needs to be efficient
    public getNeighborLinksOf(id: T.ClientId): number[] {
        return this.graph.nodes[id].links;
    }

    public getEdge(index: number): GT.Edge {
        return this.graph.edges[index];
    }
}

export default Topology;