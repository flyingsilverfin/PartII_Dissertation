import {Graph} from '../../types/GraphTypes';
import FixedSizeTopology from './FixedSizeTopology';

/*
    This is a sample fixed network topology
*/

class TopologyFixed1 extends FixedSizeTopology {
    protected graph: Graph = {    // moving this bracket onto a new line breaks the syntax highlighting!
        // index is the node ID we will allocate
        nodes: [
            {   
                name: "",
                weight: 0,   // d3 value,
                links: [0, 1, 2]
            },
            {   
                name: "",
                weight: 0,
                links: [0]
            },
            {   
                name: "",
                weight: 0,
                links: [1]
            },
            {
                name: "",
                weight: 0,
                links: [2,3]
            },
        ],
        edges: [
            {source: 0, target: 1, latency: 1}, 
            {source: 0, target: 2, latency: 1},
            {source: 0, target: 3, latency: 1},
            {source: 2, target: 3, latency: 1}
        ]
    };
}

export default TopologyFixed1;