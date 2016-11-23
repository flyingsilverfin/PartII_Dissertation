import LatencyModel from './LatencyModel';

class LatencyModelConstant extends LatencyModel {
    constructor(center) {
        super(center);
    }

    public getLatency(seed) {
        return this.center;
    }

    public getDescription() {
        return "Constant Latency Model - always at : " + this.center;
    }
}

export default LatencyModelConstant;