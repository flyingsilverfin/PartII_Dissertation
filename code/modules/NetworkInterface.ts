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

    private enabled: boolean;
    private queue: (()=>void)[];    // list of actions to do queued up

    public insertPacketReceived;    // TODO type these
    public deletePacketReceived;

    constructor() {
        this.enabled = false;
        this.queue = [];
    }

    public setClientId(id): void {
        this.clientId = id;
    }

    public setManager(manager): void {
        this.networkManager = manager;
    }

    public getRandomNeighbor(): T.ClientId {
        // TODO what if we request from another client that is not enabled?
        // TODO maybe this should be getRandomEnabledNeighbor
        let neighbors = this.networkManager.getNeighbors(this.clientId);
        let r = neighbors[Math.floor(Math.random() * neighbors.length)];
        return r;
    }

    // Asks a neighbor for the current CRDT state
    public requestCRDT(whichNeighbor: T.ClientId): void {
        let payload: NT.NetworkPacket = {
            origin: "" + this.clientId, // need to be string
            type: "reqCRDT",
            bundle: {}
        };

        this.networkManager.unicast(whichNeighbor, payload);
    }

    public enable(): void {
        this.enabled = true;
        console.log('Enabled network interface of: ' + this.clientId + ', executing queued send/receive operations');
        for (let func of this.queue) {
            func();
        }
    }

    public send(packet: NT.NetworkPacket): void {
        if (!this.enabled) {
            // push the same function call into a queue to be executed later
            this.queue.push(function() {
                this.send(packet);
            }.bind(this));
            return;
        }
        this.networkManager.transmit(this.clientId, packet);
    }

    public receive(packet: NT.NetworkPacket) {
        // if it's type retCRDT or reqCRDT let it through
        if (!this.enabled && packet.type !== "retCRDT" && packet.type !== "reqCRDT") {
            // push the same function call into a queue to be executed later
            this.queue.push(function() {
                this.receive(packet)
            }.bind(this));
            return;
        }

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