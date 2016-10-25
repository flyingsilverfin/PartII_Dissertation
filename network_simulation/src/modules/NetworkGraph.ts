 import {Graph} from '../types/GraphTypes';

class NetworkGraph {
    private graph: Graph = 
        {
            nodes: {
                1 : {
                    name: ""
                },
                2 : {
                    name: ""
                },
                3: {
                    name: ""
                },
                4: {
                    name: ""
                }
            },
            edges: [
                [1,2], [1,3], [1,4], [3,4]
            ]
        };

    constructor() {
        console.log('(NetworkGraph) Instantiated network graph');
    }

    public toDot(): string {
       

        return "";
    }
}

export default NetworkGraph;