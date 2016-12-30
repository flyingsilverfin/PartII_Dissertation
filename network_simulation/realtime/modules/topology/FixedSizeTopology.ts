import {FixedSizeTopologyException} from '../Helper';
import * as T from '../../types/Types';
import Topology from './Topology';

/*
    This is an abstract fixed size network topology
    Will be used for hand coded topologie I suppose...?
*/

abstract class FixedSizeTopology extends Topology {
    constructor() {
        super();
        console.log('Constructing fixed size topology');
        this.graph = {
            nodes: [],
            edges: []
        }
    }

    public getMaximumSize(): number {
        return this.graph.nodes.length;
    }

    public addNode(): T.ClientId {
        if (this.allocated == this.graph.nodes.length) {
            throw new FixedSizeTopologyException('cannot add more than: ' + this.graph.nodes.length + ' nodes to this fixed size topology');
        } else {
            this.allocated++;
            return <T.ClientId>(this.allocated - 1);
        }
    }
}

export default FixedSizeTopology;