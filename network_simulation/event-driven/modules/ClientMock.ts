import * as CT from '../types/CRDTTypes';
import * as NT from '../types/NetworkTypes';
import * as T from '../types/Types';
import NetworkInterface from './NetworkInterface';
import NetworkManager from './NetworkManager';


/*
    basic hacks to implement really bad mixing of network/application later
    which is used to do loop avoidance/stop forwarding packets etc. in network
*/

class ClientMock {

    private id: string;

    public network: NetworkInterface;

    // for mocking up which packet's we've seen
    private clock = 0;
    private deletedIds = [];

    constructor(networkInterface: NetworkInterface, id) {
        this.network = networkInterface;
        this.network.insertPacketReceived = this.insertReceived.bind(this);
        this.network.deletePacketReceived = this.deleteReceived.bind(this);
        this.id = "" + id;
    }

    public sendMockInsertPacket(content: string) {
        // mock bundle that always inserts in beginning
        let bundle: CT.InsertMessage = {
            id: this.clock + "." + this.id,
            char: content,
            after: "0"
        };
        let packet : NT.NetworkPacket = {
            origin: this.id,
            type: 'i',
            bundle: bundle
        }

        this.clock++;

        this.network.send(packet);
    }



    private insertReceived(bundle: CT.InsertMessage): boolean {
        let t = parseInt(bundle.id.split('.')[0]);
        if (t < this.clock) {
            return false;
        }
        
        this.clock = t + 1; // fast forward to this clock to keep causal relationship

        return true;
    }

    private deleteReceived(bundle: CT.DeleteMessage): boolean {
        if (this.deletedIds.indexOf(bundle.deleteId)) {
            return false;
        }
        this.deletedIds.push(bundle.deleteId);
        return true;
    }

}


export default ClientMock;