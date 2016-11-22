import * as T from '../../types/Types';
import * as GT from '../../types/GraphTypes';
import Topology from './Topology';

/*
    This is a fixed size network topology interface
*/

abstract class OpenSizeTopology extends Topology {
    protected latency: number;
    constructor(latency: number) {
        super();
        this.latency = latency;
        console.log('Constructing flexible size topology');
    }

    public getMaximumSize(): number {
        return -1;
    }

    public abstract addNode(): T.ClientId;
}

export default OpenSizeTopology;