import * as NT from '../types/NetworkTypes';
import * as CT from '../types/CRDTTypes';
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
    public requestCRDTReceived: (origin: string) => void;
    public returnCRDTReceived: (crdt: CT.MapCRDTStore) => void;

    constructor() {
        this.enabled = false;
        this.queue = [];
    }

    public isEnabled() {
        return this.enabled;
    }

    public enable(): void {
        this.enabled = true;
        console.log('Enabled network interface of: ' + this.clientId + ', executing queued send/receive operations');
        for (let func of this.queue) {
            func();
        }
    }

    public setClientId(id): void {
        this.clientId = id;
    }

    public setManager(manager): void {
        this.networkManager = manager;
    }

    public getRandomNeighbor(): T.ClientId {
        // TODO what if we request from another client that is not enabled?
        // RESOLUTION : will keep it as is, as we don't want a server tracking any/much state in the end as to who is enabled and not
        // thus we will simply have to wait until that client has its own CRDT and then can return it
        // NOTE: this can lead to bad worst case (linear topology, N-1 latencies wait before get CRDT at end of line)
        let neighbors = this.networkManager.getNeighbors(this.clientId);
        let r = neighbors[Math.floor(Math.random() * neighbors.length)];
        return r;
    }

    // Asks a neighbor for the current CRDT state
    public requestCRDT(destination: T.ClientId): void {
        let packet: NT.NetworkPacket = {
            origin: "" + this.clientId, // need to be string
            type: "reqCRDT",
            bundle: {}
        };

        this.networkManager.unicast(destination, packet);
    }

    public returnCRDT(destination: T.ClientId, crdt: CT.MapCRDTStore): void {
        let packet: NT.NetworkPacket = {
            origin: "" + this.clientId,
            type: "retCRDT",
            bundle: {
                crdt: crdt
            }
        }
        this.networkManager.unicast(destination, packet);
    }

    public broadcast(packet: NT.NetworkPacket): void {
        if (!this.enabled) {
            // push the same function call into a queue to be executed later
            this.queue.push(function() {
                this.broadcast(packet);
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
        } else if (packet.type == "reqCRDT") {
            // bundle is empty
            let origin = packet.origin;
            this.requestCRDTReceived(origin);
            isValidNewPacket = false;   // disable broadcasting this unicast...
        } else if (packet.type == "retCRDT") {
            let crdt = (<NT.ReturnCRDTMessage>packet.bundle).crdt;
            this.returnCRDTReceived(crdt);
            isValidNewPacket = false;   // disable broadcasting this unicast...
        }        
         else {
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