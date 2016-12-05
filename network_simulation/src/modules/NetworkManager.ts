import NetworkInterface from './NetworkInterface';
import * as NT from '../types/NetworkTypes';
import Topology from './topology/Topology';
import RealtimeScheduler from './RealtimeScheduler';
import * as T from '../types/Types';

class NetworkManager {

    private clientMap: NT.ClientMap;    // maps client ID (number) to NetworkInterface
    private topology: Topology;
    private scheduler: RealtimeScheduler;


    constructor(topology: Topology) {
        this.clientMap = {};
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
        return id;
    }

    public transmit(sender: T.ClientId, packet: NT.NetworkPacket): void {
        let neighbors = this.topology.getNeighborsOf(sender);
        for (let n of neighbors) {
            let edge = this.topology.getEdge(n);
            let action = function() {
                let targetNetworkInterface = this.clientMap[edge.target];
                targetNetworkInterface.receive(packet);
            };
            this.scheduler.addEvent(edge.latency, action);
        }
    }

}

export default NetworkManager;