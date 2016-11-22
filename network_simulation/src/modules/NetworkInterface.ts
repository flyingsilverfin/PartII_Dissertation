import * as NT from '../types/NetworkTypes';
import * as T from '../types/Types';


/*
    DUMMY

    all actual code here has been added and needs to be merged into combined project
*/

class NetworkInterface {
    private clientId: T.ClientId;
    constructor() {
    }

    public setClientId(id): void {
        this.clientId = id;
    }

    public send(packet: NT.NetworkPacket) {

    }

    public receive(packet: NT.NetworkPacket) {
       
    }
}

export default NetworkInterface;