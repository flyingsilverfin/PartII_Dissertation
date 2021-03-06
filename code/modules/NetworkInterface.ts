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
    public requestCRDTReceived: (origin: T.ClientId) => void;
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

    public getLowestIdNeighbor(): T.ClientId {
        // TODO what if we request from another client that is not enabled?
        // RESOLUTION : will keep it as is, as we don't want a server tracking any/much state in the end as to who is enabled and not
        // thus we will simply have to wait until that client has its own CRDT and then can return it
        // NOTE: this can lead to bad worst case (linear topology, N-1 latencies wait before get CRDT at end of line)
        let neighbors = this.networkManager.getNeighbors(this.clientId);
        return Math.min(...neighbors);
    }

    // Asks a neighbor for the current CRDT state
    public requestCRDT(destination: T.ClientId): void {
        let packet: NT.NetworkPacket = {
            o: "" + this.clientId, // need to be string
            t: "reqCRDT",
            b: {}
        };

        this.networkManager.unicast(this.clientId, destination, packet);
    }

    public returnCRDT(destination: T.ClientId, crdt: CT.MapCRDTStore): void {
        let packet: NT.NetworkPacket = {
            o: "" + this.clientId,
            t: "retCRDT",
            b: {
                crdt: crdt
            }
        }
        this.networkManager.unicast(this.clientId, destination, packet);
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
        if (!this.enabled && packet.t !== "retCRDT" && packet.t !== "reqCRDT") {
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
        if (packet.t === 'i') {
            isValidNewPacket = this.insertPacketReceived(packet.b);
        } else if (packet.t === 'd') {
            isValidNewPacket = this.deletePacketReceived(packet.b);
        } else if (packet.t == "reqCRDT") {
            // bundle is empty
            let origin = packet.o;
            this.requestCRDTReceived(parseInt(origin));
            isValidNewPacket = false;   // disable broadcasting this unicast...
        } else if (packet.t == "retCRDT") {
            let crdt = (<NT.ReturnCRDTMessage>packet.b).crdt;
            this.returnCRDTReceived(crdt);
            isValidNewPacket = false;   // disable broadcasting this unicast...
        }        
         else {
            console.error('Received unknown network packet type: ' + packet.t);
            return;
        }

        if (isValidNewPacket) {
            // transmit packet to all neighbors again
            this.networkManager.transmit(this.clientId, packet);
        }

    }
}

export default NetworkInterface;