import NetworkInterface from './NetworkInterface';
import NetworkStatsManager from './NetworkStatsManager';
import GraphVisualizer from './GraphVisualizer';
import * as NT from '../types/NetworkTypes';
import Topology from './topology/Topology';
import RealtimeScheduler from './RealtimeScheduler';
import * as T from '../types/Types';

class NetworkManager {

    private clientMap: NT.ClientMap;    // maps client ID (number) to NetworkInterface
    private clientLogicalCounterMap: NT.ClientLogicalCounterMap;
    private topology: Topology;
    private scheduler: RealtimeScheduler;
    private networkStats: NetworkStatsManager;
    private visualizer: GraphVisualizer;


    constructor(topology: Topology, networkStatsManager: NetworkStatsManager, visualizer: GraphVisualizer) {
        this.clientMap = {};
        this.clientLogicalCounterMap = {};
        this.topology = topology;
        this.scheduler = new RealtimeScheduler();
        this.networkStats = networkStatsManager;
        this.visualizer = visualizer;
    }

    public register(client: NetworkInterface): T.ClientId {
        let id;
        try {
            // collect next ID according to the topology mapping
            id = this.topology.addNode();

            // notify the networkStatsManager that the topology has changed
            this.networkStats.topologyChanged();


        } catch (err) {
            // this would be a FixedSizeTopologyException
            console.error(err.msg);
            return;
        }
        this.clientMap[id] = client;
        this.clientLogicalCounterMap[id] = 0;

        

        return id;
    }


    
    public transmit(sender: T.ClientId, packet: NT.NetworkPacket): void {
//        debugger
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
                targetNetworkInterface.receive(packet);
                self.visualizer.updateLoads();  //TODO this is an O(#edges) operation per packet received...
            };
            this.scheduler.addEvent(edge.latency, this.clientLogicalCounterMap[sender], action);
            this.networkStats.incrementLoad(edge.id);
        }
        this.visualizer.updateLoads();
        this.clientLogicalCounterMap[sender]++;
    }

}

export default NetworkManager;