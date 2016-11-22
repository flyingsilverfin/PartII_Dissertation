import * as GT from '../../types/GraphTypes';
import * as T from '../../types/Types';

/*
    This is an abstract network topology
*/

abstract class Topology implements GT.Topology {
    protected graph: GT.Graph;
    protected allocated = 0;

    public getNodes(): GT.Node[] {
        return this.graph.nodes;
    }

    public getEdges(): GT.Edge[] {
        return this.graph.edges;
    }

    public abstract getMaximumSize(): number;

    public abstract addNode(): T.ClientId;
}

export default Topology;