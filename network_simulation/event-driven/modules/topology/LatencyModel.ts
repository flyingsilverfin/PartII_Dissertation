abstract class LatencyModel {
    protected center: number;
    constructor(center) {
        this.center = center;
    }
    public abstract getLatency(seed): number;

    public abstract getDescription(): string;
}

export default LatencyModel;