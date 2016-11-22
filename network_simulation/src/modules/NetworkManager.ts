import NetworkInterface from './NetworkInterface';
import * as NT from '../types/NetworkTypes';
import Topology from './topology/Topology';
import * as T from '../types/Types';

class NetworkManager {

    private clientMap: NT.ClientMap;
    private topology: Topology;

    constructor(topology: Topology) {
        this.clientMap = {};
        this.topology = topology;
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
        for (let n in neighbors) {
            // this can be packaged into a function and inserted in a scheduler! (for modeling latency)
            let target = this.clientMap[n];
            target.receive(packet);
        }
    }

}

export default NetworkManager;