import * as GT from '../../types/GraphTypes';
import * as T from '../../types/Types';
import {NoMoreNodesToAllocateException} from '../Helper';

/*
    This is an abstract network topology


*/

abstract class Topology {
    protected graph: GT.Graph;
    protected allocated = 0;
    protected numEdges = 0;

    // this doesn't need to be efficient, only used by D3 once to start and then on each full redraw
    // basically return list of empty objects where each node's ID is it's list index
    public getD3Nodes(): GT.d3Node[] {
        let d3nodes: GT.d3Node[] = [];

        for (let i = 0; i < this.graph.nodes.length; i++) {
            let node: GT.d3Node = {
            };
            d3nodes.push(node)
        }

        return d3nodes;
    }

    // this doesn't need to be efficient, only used by D3 once to start and then on each full redraw
    public getD3Edges(): GT.d3Edge[] {
        let d3edges: GT.d3Edge[] = [];
        for (let i = 0; i < this.graph.nodes.length; i++) {
            let node = this.graph.nodes[i];
            for (let j = 0; j < node.links.length; j++) {
                let link = node.links[j];
                let d3edge: GT.d3Edge = {
                    latency: link.getLatency(),
                    source: i,
                    target: link.target
                };
                // only push one "direction" into the list
                if (d3edges[link.id] === undefined) {
                    d3edges[link.id] = d3edge;
                };
            }
        }
        return d3edges;
    }

    public abstract getMaximumSize(): number;

    // this may need to be efficient
    public abstract addNode(): T.ClientId;

    public reserveNextNodeId(): T.ClientId {
        console.log('Reserving: ' + this.allocated);
        // if we still have nodes that we can assign
        if (this.allocated < this.getMaximumSize()) {
            this.allocated++;
            return this.allocated-1;
        } else {
            throw new NoMoreNodesToAllocateException("Cannot reserve node ID, have all been allocated");
        }

    }

    // this needs to be efficient
    public getNeighborLinksOf(id: T.ClientId): GT.AdjacentEdge[] {
        return this.graph.nodes[id].links;
    }


    public getNumEdges(): number {
        return this.numEdges;
    }

    /*
    public getEdge(index: number): GT.Edge {
        return this.graph.edges[index];
    }
    */
}

export default Topology;