import NetworkInterface from './NetworkInterface';
import * as NT from '../types/NetworkTypes';
import Topology from './topology/Topology';
import RealtimeScheduler from './RealtimeScheduler';
import * as T from '../types/Types';

class NetworkManager {

    private clientMap: NT.ClientMap;    // maps client ID (number) to NetworkInterface
    private clientLogicalCounterMap: NT.ClientLogicalCounterMap;
    private topology: Topology;
    private scheduler: RealtimeScheduler;


    constructor(topology: Topology) {
        this.clientMap = {};
        this.clientLogicalCounterMap = {};
        this.topology = topology;
        this.scheduler = new RealtimeScheduler();
    }

    public register(client: NetworkInterface): T.ClientId {
        let id;
        try {
            // collect next ID according to the topology mapping
            id = this.topology.addNode();
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
        debugger
        let neighborLinkIds = this.topology.getNeighborLinksOf(sender);
        let self = this;
        // iterate over identifier of the links
        for (let i = 0; i < neighborLinkIds.length; i++) {
            let link = neighborLinkIds[i];
            let edge = this.topology.getEdge(link);

            let targetNetworkInterface = self.clientMap[edge.target];
            // D3 is messing with my graph :| just going to work around it for now...
            //let targetNetworkInterface = self.clientMap[(<any>edge.target).index];

            let action = function() {
                
                targetNetworkInterface.receive(packet);
            };
            this.scheduler.addEvent(edge.latency, this.clientLogicalCounterMap[sender], action);
        }
        this.clientLogicalCounterMap[sender]++;
    }

}

export default NetworkManager;