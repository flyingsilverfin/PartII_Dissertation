import NetworkInterface from './NetworkInterface';
import NetworkStatsManager from './NetworkStatsManager';
import GraphVisualizer from './GraphVisualizer';
import * as NT from '../types/NetworkTypes';
import Topology from './topology/Topology';
import EventDrivenScheduler from './EventDrivenScheduler';
import Time from './Time';
import Logger from './Logger';
import * as T from '../types/Types';

class NetworkManager {

    private clientMap: NT.ClientMap;    // maps client ID (number) to NetworkInterface
    private clientLogicalCounterMap: NT.ClientLogicalCounterMap;
    private topology: Topology;
    private scheduler: EventDrivenScheduler;
    private networkStats: NetworkStatsManager;
    private visualizer: GraphVisualizer;
    private time: Time;
    private log: Logger;


    constructor(topology: Topology, networkStatsManager: NetworkStatsManager, visualizer: GraphVisualizer, time: Time, log: Logger) {
        this.clientMap = {};
        this.clientLogicalCounterMap = {};
        this.topology = topology;
        this.scheduler = new EventDrivenScheduler(time);
        this.networkStats = networkStatsManager;
        this.visualizer = visualizer;

        this.time = time;
        this.log = log;
    }

    public register(client: NetworkInterface): T.ClientId {
        let id;
        try {
            // collect next ID according to the topology mapping
            
            id = this.topology.reserveNextNodeId();

            this.log.log("join", "Node " + id + " joined network");


        } catch (err) {
            // this would be a FixedSizeTopologyException
            console.error(err);
            return;
        }
        this.clientMap[id] = client;
        this.clientLogicalCounterMap[id] = 0;

        return id;
    }


    
    public transmit(sender: T.ClientId, packet: NT.NetworkPacket): void {

        let neighborLinks = this.topology.getNeighborLinksOf(sender);
        let self = this;
        // iterate over identifier of the links
        for (let i = 0; i < neighborLinks.length; i++) {
            let edge = neighborLinks[i];

            let targetNetworkInterface = self.clientMap[edge.target];
            // D3 is messing with my graph :| just going to work around it for now...
            //let targetNetworkInterface = self.clientMap[(<any>edge.target).index];

            let action = function() {
                self.networkStats.decrementLoad(edge.id);
                self.log.logPacket(sender, edge.target, "received", packet);
                targetNetworkInterface.receive(packet);
                self.visualizer.updateLoads();  //TODO this is an O(#edges) operation per packet received...
            };
            this.scheduler.addEvent(edge.latency, this.clientLogicalCounterMap[sender], action);
            this.networkStats.incrementLoad(edge.id);
            this.log.logPacket(sender, edge.target, "sent", packet);
        }
        this.visualizer.updateLoads();
        this.clientLogicalCounterMap[sender]++;
    }

    public runSimulation(): void {
        while (!this.scheduler.areEventsScheduled()) {
            this.scheduler.runNextEvent();
        }
    }

}

export default NetworkManager;