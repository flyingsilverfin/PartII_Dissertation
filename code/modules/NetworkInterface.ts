import * as NT from '../types/NetworkTypes';
import * as CT from '../types/CRDTTypes';
import * as T from '../types/Types';
import NetworkManager from './NetworkManager';
import CausalDeliveryLayer from './CausalDeliveryLayer';
import * as Helper from './Helper';


/*
    DUMMY

    all actual code here has been added and needs to be merged into combined project
*/

class NetworkInterface {
    private clientId: T.ClientId;
    //private seqNum: number;
    //private peerSeqNums: NT.PeerSequenceNumbersMap; // this introduces problems such as when do you drop elements from this MapCRDTStore
    private causalDeliveryLayer: CausalDeliveryLayer;
    private networkManager: NetworkManager;

    private enabled: boolean;
    private queue: (()=>void)[];    // list of actions to do queued up

    public bundledInsertPacketReceived: (bundle: CT.BundledInsertMessage) => void;
    public bundledDeletePacketReceived: (bundle: CT.BundledDeleteMessage, when: NT.VectorClock) => void;
    public insertPacketReceived: (bundle: CT.InsertMessage) => void;
    public deletePacketReceived: (bundle: CT.DeleteMessage, when: NT.VectorClock) => void;
    public requestCRDTReceived: (origin: T.ClientId) => void;
    public returnCRDTReceived: (crdt: CT.MapCRDTStore) => void;
    public undoInsertReceived: (bundle: CT.UndoMessage) => void;
    public undoDeleteReceived: (bundle: CT.UndoMessage, when: NT.VectorClock) => void;
    public redoInsertReceived: (bundle: CT.UndoMessage) => void;
    public redoDeleteReceived: (bundle: CT.UndoMessage, when: NT.VectorClock) => void;

    constructor() {
        this.enabled = false;
        this.queue = [];

        // initialize Causal layer in setId
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
        this.causalDeliveryLayer = new CausalDeliveryLayer(id);
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
    // only use vectors for BROADCAST!! NOT for unicast!
    public requestCRDT(destination: T.ClientId): void {
        let packet: NT.NetworkPacket = {
            o: this.clientId, 
            v: {},
            t: "reqCRDT",
            b: {}
        };

        this.networkManager.unicast(this.clientId, destination, packet);
    }

    public returnCRDT(destination: T.ClientId, crdt: CT.MapCRDTStore): void {

        let vectorCopy = this.causalDeliveryLayer.copyVector(); //copy in this client's sequence number for the receiver

        let packet: NT.NetworkPacket = {
            o: this.clientId,
            v: {},
            t: "retCRDT",
            b: {
                crdt: crdt,
                currentVector: vectorCopy
            },
        }
        this.networkManager.unicast(this.clientId, destination, packet);
    }

    public broadcast(packet: NT.PreparedPacket): void {
        if (!this.enabled) {
            // push the same function call into a queue to be executed later
            this.queue.push(function() {
                this.broadcast(packet);
            }.bind(this));
            return;
        }

        let netPacket: NT.NetworkPacket = Object.assign({v: this.causalDeliveryLayer.getNextVector(), o: this.clientId}, packet);

        this.networkManager.transmit(this.clientId, netPacket);
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

/*
        let from = packet.origin;
        let s = packet.seq;
        let isValidNewPacket = this.receivedSeqNum(from, s);
        console.log("is valid new packet: " + isValidNewPacket);
        let retransmit = s !== -1 && isValidNewPacket;  // if not a unicast and is a new packet ie. a broadcast packet
        // demultiplex packet type
*/

        let actions = {
            'bi': () => this.bundledInsertPacketReceived(<CT.BundledInsertMessage>packet.b),
            'bd': () => this.bundledDeletePacketReceived(<CT.BundledDeleteMessage>packet.b, packet.v),
            'i': () => this.insertPacketReceived(<CT.InsertMessage>packet.b),
            'd': () => this.deletePacketReceived(<CT.DeleteMessage>packet.b, packet.v),
            'ui': () => this.undoInsertReceived(<CT.UndoMessage>packet.b),
            'ud': () => this.undoDeleteReceived(<CT.UndoMessage>packet.b, packet.v),
            'ri': () => this.redoInsertReceived(<CT.UndoMessage>packet.b),
            'rd': () => this.redoDeleteReceived(<CT.UndoMessage>packet.b, packet.v),
            'reqCRDT': () => {
                                this.requestCRDTReceived(packet.o); 
                            },  
            'retCRDT': () => {
                                // copying in sequence numbers need to happen before copying in CRDT and executing queued operations
                                let vectorReceived = (<NT.ReturnCRDTMessage>packet.b).currentVector;
                                
                                this.causalDeliveryLayer.setVector(vectorReceived);
                                let crdt = (<NT.ReturnCRDTMessage>packet.b).crdt; 
                                this.returnCRDTReceived(crdt);
                            }
        };

        let isNewPacket = this.causalDeliveryLayer.receive(packet, actions[packet.t].bind(this));
        let retransmit = packet.t !== "retCRDT" && packet.t !== "reqCRDT" && isNewPacket;

        if (retransmit) this.networkManager.transmit(this.clientId, packet);

    }

    public getCurrentVector(): NT.VectorClock {
        return this.causalDeliveryLayer.copyVector();
    }

    public peekNextVector(): NT.VectorClock {
        return this.causalDeliveryLayer.peekNextVector();
    }

}

export default NetworkInterface;