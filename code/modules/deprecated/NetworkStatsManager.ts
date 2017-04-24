import Topology from './topology/Topology';
import Time from './Time';
import {initArrayWith} from './Helper';

export default class NetworkStatsManager {
    // index = edge ID, as in Topology -- I don't like this, coupled too tightly..
    private linkLoads: number[];
    private totalLinkLoads: number[];
    // total number of packets in the network currently
    private currentLoad: number;
    private totalLoad: number;

    private topology: Topology;
    // private time: Time;
    private displayDiv: HTMLDivElement;
    private currentLoadDiv: HTMLDivElement;
    private totalLoadDiv: HTMLDivElement;

    constructor(topology: Topology, displayDiv: HTMLDivElement) {

        this.topology = topology;
        // this.time = time;

        this.displayDiv = displayDiv;
        this.currentLoadDiv = document.createElement('div');
        this.displayDiv.appendChild(this.currentLoadDiv);
        this.totalLoadDiv = document.createElement('div');
        this.displayDiv.appendChild(this.totalLoadDiv);

        this.linkLoads = initArrayWith(topology.getNumEdges(), 0);
        this.totalLinkLoads = initArrayWith(topology.getNumEdges(), 0);
        this.currentLoad = 0;
        this.totalLoad = 0;
    }

    public topologyChanged(): void {
        let newNumEdges = this.topology.getNumEdges();
        for (let i = this.linkLoads.length; i < newNumEdges; i++) {
            this.linkLoads.push(0);
            this.totalLinkLoads.push(0);
        }
    }

    public incrementLoad(edgeId): void {
        this.linkLoads[edgeId]++;
        this.totalLinkLoads[edgeId]++;
        this.currentLoad++;
        this.totalLoad++;
        this.updateDisplay();
    }

    public decrementLoad(edgeId): void {
        this.linkLoads[edgeId]--;
        this.currentLoad--;
        this.updateDisplay();
    }

    public getLoadOn(edgeId): number {
        return this.linkLoads[edgeId];
    }

    public getFractionalLoadOn(edgeId): number {
        return (this.currentLoad === 0 ? 0 : this.linkLoads[edgeId]/this.getMaxLinkLoad());
    }

    public getMaxLinkLoad(): number {
        return Math.max.apply(null, this.linkLoads)
    }

    public getCurrentLoad(): number {
        return this.currentLoad;
    }

    private updateDisplay(): void {
        this.currentLoadDiv.innerHTML = this.currentLoad + " packets";
        this.totalLoadDiv.innerHTML = this.totalLoad + " packets";
    }

}