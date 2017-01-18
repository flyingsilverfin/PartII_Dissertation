import * as NT from '../types/NetworkTypes';
import * as T from '../types/Types';
import NetworkManager from './NetworkManager';


/*
    DUMMY

    all actual code here has been added and needs to be merged into combined project
*/

class NetworkInterface {
    private clientId: T.ClientId;
    private networkManager: NetworkManager;

    public insertPacketReceived;    // TODO type these
    public deletePacketReceived;

    constructor() {
    }

    public setClientId(id): void {
        this.clientId = id;
    }

    public setManager(manager): void {
        this.networkManager = manager;
    }

    public send(packet: NT.NetworkPacket) {
        this.networkManager.transmit(this.clientId, packet);
    }

    public receive(packet: NT.NetworkPacket) {
        // ASSERT NEEDED
        //  this.insertPacketReceived !== null
        //  this.deletePacketReceived !== null

        // demultiplex packet type
        let isValidNewPacket;
        if (packet.type === 'i') {
            isValidNewPacket = this.insertPacketReceived(packet.bundle);
        } else if (packet.type === 'd') {
            isValidNewPacket = this.deletePacketReceived(packet.bundle);
        } else {
            console.error('Received unknown network packet type: ' + packet.type);
            return;
        }

        if (isValidNewPacket) {
            // transmit packet to all neighbors again
            this.networkManager.transmit(this.clientId, packet);
        }

    }
}

export default NetworkInterface;