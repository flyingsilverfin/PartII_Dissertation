import * as NT from '../types/NetworkTypes';
import * as CT from '../types/CRDTTypes';
import * as T from '../types/Types';
import NetworkManager from './NetworkManager';
import * as Helper from './Helper';


/*
    DUMMY

    all actual code here has been added and needs to be merged into combined project
*/

class NetworkInterface {
    private clientId: T.ClientId;
    private seqNum: number;
    private peerSeqNums: NT.PeerSequenceNumbersMap; // this introduces problems such as when do you drop elements from this map
    private networkManager: NetworkManager;

    private enabled: boolean;
    private queue: (()=>void)[];    // list of actions to do queued up

    public insertPacketReceived: (bundle: CT.InsertMessage) => void;
    public deletePacketReceived: (bundle: CT.DeleteMessage) => void;
    public requestCRDTReceived: (origin: T.ClientId) => void;
    public returnCRDTReceived: (crdt: CT.MapCRDTStore) => void;
    public undoInsertReceived: (bundle: CT.UndoMessage) => void;
    public undoDeleteReceived: (bundle: CT.UndoMessage) => void;
    public redoInsertReceived: (bundle: CT.UndoMessage) => void;
    public redoDeleteReceived: (bundle: CT.UndoMessage) => void;

    constructor() {
        this.enabled = false;
        this.queue = [];
        this.peerSeqNums = {};
        this.seqNum = 1;
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
    // only use sequence numbers for BROADCAST!! NOT for unicast!
    public requestCRDT(destination: T.ClientId): void {
        let packet: NT.NetworkPacket = {
            origin: this.clientId, 
            seq: -1,
            type: "reqCRDT",
            bundle: {}
        };

        this.networkManager.unicast(this.clientId, destination, packet);
    }

    public returnCRDT(destination: T.ClientId, crdt: CT.MapCRDTStore): void {

        let seqNumsToSend = {}
        seqNumsToSend[this.clientId] = this.seqNum; //copy in this client's sequence number for the receiver
        seqNumsToSend = Object.assign(seqNumsToSend, this.peerSeqNums);

        let packet: NT.NetworkPacket = {
            origin: this.clientId,
            seq: -1,
            type: "retCRDT",
            bundle: {
                crdt: crdt,
                peerSeqNums: seqNumsToSend
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

        let netPacket: NT.NetworkPacket = Object.assign({seq: this.nextSeqNum(), origin: this.clientId}, packet);

        this.networkManager.transmit(this.clientId, netPacket);
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

        let from = packet.origin;
        let s = packet.seq;
        let isValidNewPacket = this.receivedSeqNum(from, s);
        console.log("is valid new packet: " + isValidNewPacket);
        let retransmit = s !== -1 && isValidNewPacket;  // if not a unicast and is a new packet ie. a broadcast packet

        // demultiplex packet type

        let actions = {
            'i': () => this.insertPacketReceived(<CT.InsertMessage>packet.bundle),
            'd': () => this.deletePacketReceived(<CT.DeleteMessage>packet.bundle),
            'ui': () => this.undoInsertReceived(<CT.UndoMessage>packet.bundle),
            'ud': () => this.undoDeleteReceived(<CT.UndoMessage>packet.bundle),
            'ri': () => this.redoInsertReceived(<CT.UndoMessage>packet.bundle),
            'rd': () => this.redoDeleteReceived(<CT.UndoMessage>packet.bundle),
            'reqCRDT': () => {
                                this.requestCRDTReceived(from); 
                                isValidNewPacket = false;    //forwarding as broadcast should already be rejected by seq num!!!
                            },   
            'retCRDT': () => {
                                // copying in sequence numbers need to happen before copying in CRDT and executing queued operations
                                let peerSeqNumsReceived = (<NT.ReturnCRDTMessage>packet.bundle).peerSeqNums;
                                this.peerSeqNums = peerSeqNumsReceived;
                                let crdt = (<NT.ReturnCRDTMessage>packet.bundle).crdt; 
                                this.returnCRDTReceived(crdt);
                                isValidNewPacket = false
                            }
        };

        if (isValidNewPacket) actions[packet.type]()
        if (retransmit) this.networkManager.transmit(this.clientId, packet);




/*
        if (packet.type === 'i') {
            this.insertPacketReceived(packet.bundle);
        } else if (packet.type === 'd') {
            this.deletePacketReceived(packet.bundle);
        } else if (packet.type == "reqCRDT") {
            // bundle is empty
            this.requestCRDTReceived(from);
            isValidNewPacket = false;   // disable broadcasting this unicast... //should also be not be rejected by seq num
        } else if (packet.type == "retCRDT") {
            let crdt = (<NT.ReturnCRDTMessage>packet.bundle).crdt;
            this.returnCRDTReceived(crdt);
            isValidNewPacket = false;   // disable broadcasting this unicast... //should also be not be rejected by seq num
        }        
         else {
            console.error('Received unknown network packet type: ' + packet.type);
            return;
        }
*/

    }

    private nextSeqNum(): number {
        this.seqNum++;
        return this.seqNum-1;
    }

    private receivedSeqNum(from: T.ClientId, n: number): boolean {
        if (n === -1) { // unicast, ignore
            return true;
        }
        if (from === this.clientId) {   // reject anything that's bounced back to original sender
            return false;
        }
        if (!this.peerSeqNums[from]) {
            Helper.assert(n === 1, "First seq num received from a peer is not 1");
            this.peerSeqNums[from] = n+1; //should be 2
            return true;
        }
        // if n is less than the next expected sequence number, we've seen it
        if (n < this.peerSeqNums[from]) {
            return false;
        } else {
            Helper.assert(n === this.peerSeqNums[from], "Received sequence number is out of order");
            this.peerSeqNums[from]++;
            return true;
        }
    }
}

export default NetworkInterface;