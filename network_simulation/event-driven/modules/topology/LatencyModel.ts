import * as T from '../../types/Types';
import * as NT from '../../types/NetworkTypes';

class LatencyModel {

    private modelDescription;
    private nodeLatencies: NT.NodeLatencies;

    // parameter node_latencies is defined as:
    //  map between node_id and a latency
    //  edges connected between node_id and target is (map[node_id] + map[target]) / 2
    //  this simplifies the experiment creation process (don't have to create O(n^2) latencies beforehand)
    //  and also makes sense as a model of the real world:
    //   nodes with high 'latency' (eg. a mobile) mean all in and outgoing connections 
    //   have a consistently high latency


    constructor(modelDescription, nodeLatencies) {
        this.modelDescription = modelDescription;
        this.nodeLatencies = nodeLatencies;
    }

    public getLatency(source:number, target:number): number {
        // /debugger
        return (this.nodeLatencies[source].latency + this.nodeLatencies[target].latency)/2;
    }

    public getDescription(): string {
        return (
            "LatencyModel: " + this.modelDescription.type + 
            ", center: " + this.modelDescription.center
        );
    }

}

export default LatencyModel;