import * as NT from '../types/NetworkTypes';
import NetworkManager from './NetworkManager';

class NetworkInterface {

    private networkManager: NetworkManager;

    public insertPacketReceived;    // TODO type ese
    public deletePacketReceived;

    constructor(networkManager: any) {
        this.networkManager = networkManager; 
        this.networkManager.register(this);
    }

    public send(packet: NT.NetworkPacket) {
        this.networkManager.broadcast(this, packet);
    }

    public receive(packet: NT.NetworkPacket) {
        // ASSERT NEEDED
        //  this.packetReceivedCallback !== null

        // demultiplex packet type
        if (packet.type === 'i') {
            this.insertPacketReceived(packet.bundle);
        } else if (packet.type === 'd') {
            // TODO
        } else {
            console.error('Received unknown network type: ' + packet.type);
        }
    }
}

export default NetworkInterface;