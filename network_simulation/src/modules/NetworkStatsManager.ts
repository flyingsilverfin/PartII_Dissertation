import Topology from './topology/Topology';
import {initArrayWith} from './Helper';

export default class NetworkStatsManager {
    // index = edge ID, as in Topology -- I don't like this, coupled too tightly..
    private linkLoads: number[];
    // total number of packets in the network currently
    private totalLoad: number;

    private topology: Topology;
    private displayDiv: HTMLDivElement;
    private totalLoadDiv: HTMLDivElement;

    constructor(topology: Topology, displayDiv: HTMLDivElement) {

        this.displayDiv = displayDiv;
        this.totalLoadDiv = document.createElement('div');


        this.linkLoads = initArrayWith(topology.getEdges().length, 0);
        this.totalLoad = 0;
    }

    public incrementLoad(edgeId): void {
        this.linkLoads[edgeId]++;
        this.totalLoad++;
        this.displayTotalLoad();
    }

    public decrementLoad(edgeId): void {
        this.linkLoads[edgeId]--;
        this.totalLoad--;
        this.displayTotalLoad();
    }

    public getLoadOn(edgeId): number {
        return this.linkLoads[edgeId];
    }

    public getFractionalLoadOn(edgeId): number {
        return (this.totalLoad === 0 ? 0 : this.linkLoads[edgeId]/this.totalLoad);
    }

    public getTotalLoad(): number {
        return this.totalLoad;
    }

    private displayTotalLoad() {
        this.totalLoadDiv.innerHTML = this.totalLoad + " packets";
    }

}