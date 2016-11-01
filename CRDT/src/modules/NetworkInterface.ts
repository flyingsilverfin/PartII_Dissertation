import * as CT from '../types/CRDTTypes';

class NetworkInterface {

    private networkManager;

    public packetReceivedCallback;

    constructor(networkManager: any) {
        this.networkManager = networkManager; 
        this.networkManager.register(this);
    }

    public send(bundle: CT.NetworkPacket) {
        this.networkManager.submit(bundle);
    }

    public receive(bundle) {
        // ASSERT NEEDED
        //  this.packetReceivedCallback !== null

        this.packetReceivedCallback(bundle);
    }
}

export default NetworkInterface;