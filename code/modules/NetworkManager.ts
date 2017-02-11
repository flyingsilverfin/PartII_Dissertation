import NetworkInterface from './NetworkInterface';
import NetworkStatsManager from './NetworkStatsManager';
import GraphVisualizer from './GraphVisualizer';
import Topology from './topology/Topology';
import EventDrivenScheduler from './EventDrivenScheduler';
import Time from './Time';
import Logger from './Logger';
import * as T from '../types/Types';
import * as NT from '../types/NetworkTypes';
import * as GT from '../types/GraphTypes';

class NetworkManager {

    private clientMap: NT.ClientMap;    // maps client ID (number) to NetworkInterface
    private clientLogicalCounterMap: NT.ClientLogicalCounterMap;
    private topology: Topology;
    private scheduler: EventDrivenScheduler;
    private networkStats: NetworkStatsManager;
    private visualizer: GraphVisualizer;
    private log: Logger;


    constructor(topology: Topology, networkStatsManager: NetworkStatsManager, visualizer: GraphVisualizer, scheduler: EventDrivenScheduler, log: Logger) {
        this.clientMap = {};
        this.clientLogicalCounterMap = {};
        this.topology = topology;
        this.scheduler = scheduler;
        this.networkStats = networkStatsManager;
        this.visualizer = visualizer;
        this.log = log;
    }

    public register(client: NetworkInterface): T.ClientId {
        let id;
        try {
            // collect next ID according to the topology mapping
            
            id = this.topology.reserveNextNodeId();

            this.log.logJoin("join", id, "Joined network!");


        } catch (err) {
            // this would be a FixedSizeTopologyException
            console.error(err);
            return;
        }
        this.clientMap[id] = client;
        this.clientLogicalCounterMap[id] = 0;

        console.log(' mapped ID: ' + id + ' to client: ');


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
                if (self.visualizer !== null) self.visualizer.updateLoads();  //TODO this is an O(#edges) operation per packet received...
            };
            this.scheduler.addEvent(edge.latency, this.clientLogicalCounterMap[sender], action);
            this.networkStats.incrementLoad(edge.id);
            this.log.logPacket(sender, edge.target, "sent", packet);
        }
        if (this.visualizer !== null) this.visualizer.updateLoads();
        this.clientLogicalCounterMap[sender]++;
    }


    /*
        My topologies are laid out so as to facilitate broadcast, unicast requires
        a linear scan over the adjacency list to find the correct link
        TODO could optimize by rewriting adjacency list as adjacency map
             Haven't fully considered how this might affect parts of code that use the edge ID
             Might be ok - probably was being used for D3/graph visualization
                           is actually being used for updating loads on links
        
    */
    public unicast(from: T.ClientId, to: T.ClientId, packet: NT.NetworkPacket): void {
        // get latency
        // scheduler delivery after that time to method receiveUnicast
        let targetNetworkInterface = this.clientMap[to];
        let edges = this.topology.getNeighborLinksOf(from);
        let edge: GT.AdjacentEdge;
        for (let e of edges) {
            if (e.target === to) {
                edge = e;
                break;
            }
        }

        let self = this;

        let action = function() {
            self.networkStats.decrementLoad(edge.id);
            self.log.logPacket(from, to, "received", packet);
            targetNetworkInterface.receive(packet);
            if (self.visualizer !== null) self.visualizer.updateLoads();  //TODO this is an O(#edges) operation per packet received...
        };

        this.scheduler.addEvent(edge.latency, this.clientLogicalCounterMap[to], action);

        this.networkStats.incrementLoad(edge.id);
        this.log.logPacket(to, edge.target, "sent", packet);
        if (this.visualizer !== null) this.visualizer.updateLoads();
        this.clientLogicalCounterMap[to]++;

    }


    public getNeighbors(id: T.ClientId): T.ClientId[] {
        let neighborLinks = this.topology.getNeighborLinksOf(id);
        let neighborIds: T.ClientId[] = [];
        for (let n of neighborLinks) {
            neighborIds.push(<T.ClientId>n.target);
        }
        return neighborIds;
    }


    public runSimulation(): void {
        debugger
        while (!this.scheduler.areEventsScheduled()) {
            this.scheduler.run();
        }
    }
}

export default NetworkManager;