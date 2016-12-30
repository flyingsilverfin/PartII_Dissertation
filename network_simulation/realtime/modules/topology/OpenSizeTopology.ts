import * as T from '../../types/Types';
import * as GT from '../../types/GraphTypes';
import Topology from './Topology';
import LatencyModel from './LatencyModel';

/*
    This is a fixed size network topology interface
*/

abstract class OpenSizeTopology extends Topology {
    protected latencyModel: LatencyModel;
    constructor(latencyModel: LatencyModel) {
        super();
        this.latencyModel = latencyModel;
        console.log('Constructing flexible size topology');
        this.graph = {
            nodes: [],
        }
    }

    public getMaximumSize(): number {
        return -1;
    }

    public abstract addNode(): T.ClientId;
}

export default OpenSizeTopology;