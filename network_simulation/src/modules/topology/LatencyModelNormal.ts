import LatencyModel from './LatencyModel';


/*
 TODO
*/
class LatencyModelNormal extends LatencyModel {
    constructor(center, stddev) {
        super(center);
    }

    // ignore the seed, randomly allocated within normal distribution
    public getLatency(seed) {

        return this.center;
    }

    public getDescription() {
        return "Constant Latency Model - always at : " + this.center;
    }
}

export default LatencyModelNormal;