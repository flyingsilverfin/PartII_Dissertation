import NetworkInterface from './NetworkInterface';
//import NetworkStatsManager from './NetworkStatsManager';
//import GraphVisualizer from './GraphVisualizer';
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
    //private networkStats: NetworkStatsManager;
    private visualizer: any;
    private log: Logger;

    private paused = true;
    private simulationSpeed: number;
    
    private finished: () => void;


    constructor(topology: Topology, 
                networkStatsManager: any, 
                visualizer: any, 
                scheduler: EventDrivenScheduler, 
                log: Logger,
                finishedCallback: () => void) {
        this.clientMap = {};
        this.clientLogicalCounterMap = {};
        this.topology = topology;
        this.scheduler = scheduler;
        //this.networkStats = networkStatsManager;
        this.visualizer = visualizer;
        this.log = log;
        this.finished = finishedCallback;


        //console.log(visualizer);
    }

    public isPaused() {
        return this.paused;
    }

    public pause() {
        this.paused = true;
    }

    public start() {
        this.paused = false;
        this.runSimulation();
    }

    public register(client: NetworkInterface): T.ClientId {
        let id;
        try {
            // collect next ID according to the topology mapping
            
            id = this.topology.reserveNextNodeId();

            this.log.logJoin("join", id, "Joined network!");

            if (this.visualizer !== null) this.visualizer.setNodeActive(id);

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


        // iterate over identifier of the linksf
        for (let i = 0; i < neighborLinks.length; i++) {
            let edge = neighborLinks[i];

            let targetNetworkInterface = self.clientMap[edge.target]; 
            if (targetNetworkInterface === undefined) {
                // this means that client hasn't joined yet
                // in reality wouldn't have a connection then
                // keeping this in causes errors obviously as cannot receive on an undefined object
                continue;
            }

            // D3 is messing with my graph :| just going to work around it for now...
            //let targetNetworkInterface = self.clientMap[(<any>edge.target).index];

            let action = function() {
                //self.networkStats.decrementLoad(edge.id);
                self.log.logPacket(sender, edge.target, "received", packet);
                targetNetworkInterface.receive(packet);
                if (self.visualizer !== null) self.visualizer.updateLoads();  //TODO this is an O(#edges) operation per packet received...
            };
            this.scheduler.addEvent(edge.getLatency(), this.clientLogicalCounterMap[sender], action);
            //this.networkStats.incrementLoad(edge.id);
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

      note: can only unicast to any neighbor  
    */
    public unicast(from: T.ClientId, to: T.ClientId, packet: NT.NetworkPacket): void {

        let self = this;

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

        let action = function() {
            //self.networkStats.decrementLoad(edge.id);
            self.log.logPacket(from, to, "received", packet);
            targetNetworkInterface.receive(packet);
            if (self.visualizer !== null) self.visualizer.updateLoads();  //TODO this is an O(#edges) operation per packet received...
        };

        this.scheduler.addEvent(edge.getLatency(), this.clientLogicalCounterMap[from], action);

        //this.networkStats.incrementLoad(edge.id);
        this.log.logPacket(from, edge.target, "sent", packet);
        if (this.visualizer !== null) this.visualizer.updateLoads();
        this.clientLogicalCounterMap[from]++;

    }


    public getNeighbors(id: T.ClientId): T.ClientId[] {
        let neighborLinks = this.topology.getNeighborLinksOf(id);
        let neighborIds: T.ClientId[] = [];
        for (let n of neighborLinks) {
            neighborIds.push(<T.ClientId>n.target);
        }
        return neighborIds;
    }



    public setSimulationSpeed(number: number) {
        this.simulationSpeed = number;
    }

    public runSimulation(): void {
        if (this.simulationSpeed > 0.0) {
            if (this.paused) {
                return;
            }
            if (!this.scheduler.areEventsScheduled()) {
                (<any>window).pauseplay();  // pause
                console.log("FINISHED SIMULATION IN NETWORK MANAGER");
                this.finished();
                return;
            }

            setTimeout((function() {
                this.scheduler.run();
                this.runSimulation();
            }).bind(this), 100.0/this.simulationSpeed);
        } else {
            while (this.scheduler.areEventsScheduled()) {
                this.scheduler.run();
            }
            this.finished();
            return;
        }
    }

}

export default NetworkManager;