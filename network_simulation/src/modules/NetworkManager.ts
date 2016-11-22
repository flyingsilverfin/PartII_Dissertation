import NetworkInterface from './NetworkInterface';
import * as GT from '../types/GraphTypes';
import * as T from '../types/Types';
import {FixedSizeTopologyException} from './Helper';

class NetworkManager {

    private clients: NetworkInterface[];
    private topology: GT.Topology;

    constructor(topology: GT.Topology) {
        this.clients = [];
        this.topology = topology;
    }

    public register(client: NetworkInterface): T.ClientId {
        try {
            let id = this.topology.addNode();
        } catch (err) {
            console.error(err.msg);
        }
        this.clients.push(client);
        return id;
    }

    public transmit()
/*
    // just send it to all the other registered clients
    public broadcast(sender: NetworkInterface, packet) {
        console.log(this.clients);
        for (let client of this.clients) {
            if (client === sender) {
                continue;
            }
            client.receive(packet);
        }
    }
*/

}

export default NetworkManager;