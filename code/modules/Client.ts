import * as CT from '../types/CRDTTypes';
import * as NT from '../types/NetworkTypes';
import * as T from '../types/Types';

import MapCRDT from './MapCRDT';
import EditableText from './EditableText';
import NetworkInterface from './NetworkInterface';
import NetworkManager from './NetworkManager';
import EventDrivenScheduler from './EventDrivenScheduler';


class Client {

    private id: string;
    private dt: CT.CRDT;    // our CRDT (datastructure)

    private optimized: boolean;
    private insertBuffer: string[] = [];
    private insertStartId: string;
    private insertStartAfter: string;

    private interface: EditableText;

    private requestedCRDTQueue: T.ClientId[];
    public network: NetworkInterface;
    
    // state variables
    // parallel lists of char array and CRDT IDs of chars
    private charArray: string[];
    private idArray: string[];


    constructor(networkInterface: NetworkInterface, id: T.ClientId, scheduler: EventDrivenScheduler, events: T.ScheduledEvents, optimized=false) {


        this.optimized = optimized;

        this.network = networkInterface;
        this.network.insertPacketReceived = this.insertReceived.bind(this);
        this.network.deletePacketReceived = this.deleteReceived.bind(this);
        this.network.requestCRDTReceived = this.requestCRDTReceived.bind(this);
        this.network.returnCRDTReceived = this.returnCRDTReceived.bind(this);
        this.requestedCRDTQueue = [];
        this.id = "" + id;


        let interfaceContainer = <HTMLDivElement>document.getElementById('clients-container');

        this.interface = new EditableText(interfaceContainer, optimized);
        this.interface.setId(this.id);
        this.interface.insertCallback = this.charInsertedLocal.bind(this);
        this.interface.deleteCallback = this.charDeletedLocal.bind(this);
        this.interface.commitCallback = this.commit.bind(this);

        this.updateParallelArrays();

        // 'events' are stored as a map between time and items to insert and delete
 
        for (let eventTime in events.insert) {
            let time = parseFloat(eventTime);
            let insert = events.insert[time];

            let self = this;

            /*
            OPTIMIZATION
                if enabled, here we will take advantage of the 'insert word' capability
                which sends entire words to insert at once, rather than 1 character at a time
            */
            if (this.optimized) {
                scheduler.addEvent(time, 0, function() {
                    self.interface.mockInsert(insert.chars, insert.after);
                })

            } else {
                for (let i = 0; i < insert.chars.length; i++) {
                    scheduler.addEvent(time, i, function() {
                        self.interface.mockInsert(insert.chars[i], insert.after + i);
                    });
                }
            }
        }

        for (let eventTime in events.delete) {
            let time = parseFloat(eventTime);
            let deletes = events.delete[eventTime];

            let self = this;

            for (let i = 0; i < deletes.length; i++) {
                let mockDelete = deletes[i];
                scheduler.addEvent(time, i, function() {
                    self.interface.mockDelete(mockDelete.index);
                });
            }

        }


        // TODO
        // this is a bit of a silly, unnecessarily hardcoded way of doing this...
        if (this.id === '0') {
            this.dt = new MapCRDT();
            this.network.enable();
        } else {
            let neighbor = this.network.getRandomNeighbor();
            this.network.requestCRDT(neighbor);
            // will callback to returnCRDTReceived when received the CRDT from neighbor
        }

    }

    private commit(): void {
        if (this.insertBuffer.length > 0) {
            let chars = this.insertBuffer.join('');
            let insertId = this.insertStartId;
            let afterId = this.insertStartAfter;

            let bundle: CT.InsertMessage = {
                id: insertId,
                char: chars,
                after: afterId
            };

            let networkPacket: NT.NetworkPacket = {
                origin: this.id,
                type: 'i',
                bundle: bundle
            };
            this.network.broadcast(networkPacket);

            this.insertBuffer = [];
            // don't need to update the rest of the values as they just get overwritten
        } else {
            return;
        }
    }


    // interesting it doesn't type check this automatically with the required structure of this.interface.insertCallback
    private charInsertedLocal(char: string, after: number, commitNow=false): void {
        let nextT = this.dt.getNextTs().toString(); // must reserve this timestamp for this character
        let opId = nextT + '.' + this.id;


        // CAN I PUT THIS INTO THE CRDT LATER ALL TOGETHER ie with one start ID + length????
        // ANS: bad idea - if another message arrives with a higher Timestamp, this one will jump up
        //      and we will no longer have a continuous sequence of timestamps in our crdt
        // SOLUTION: insert each character into CRDT immediately with unique ID
        //           Meanwhlie, buffer the string to be sent. If an edit arrives, then immediately send our changes
        //           
        let idOfAfter = this.getIdOfStringIndex(after);
        let bundle: CT.InsertMessage = {
            id: opId,
            char: char,
            after: idOfAfter
        };

        this.dt.insert(bundle);


        // this is bad - does a O(N) retrieval each insert!
        //  #optmize potential
        this.updateParallelArrays();

        if (this.optimized) {
            if (this.insertBuffer.length === 0) {
                this.insertBuffer.push(char);
                this.insertStartId = opId;
                this.insertStartAfter = idOfAfter;
            } else {
                this.insertBuffer.push(char);
            }
            // this is used for mock inserts mostly
            if (commitNow) {
                this.commit();
            }
        } else {
            let networkPacket: NT.NetworkPacket = {
                origin: this.id,
                type: 'i',
                bundle: bundle
            }
            this.network.broadcast(networkPacket);
        }
    }

    private insertReceived(bundle: CT.InsertMessage): boolean {
        if (!this.dt.insert(bundle)) {
            return false;
        }


        // get old cursor position and 'after'
        let oldCursorPosition = this.interface.getCursorPosition();
        let oldAfterId = this.getIdOfStringIndex(oldCursorPosition);

        this.updateParallelArrays();

        // probably possible to do this more cleanly
        let newAfterId = this.getIdOfStringIndex(oldCursorPosition);
        this.interface.setContent(this.charArray.join(''));
        if (oldAfterId !== newAfterId) {
            this.interface.incrementCursorPosition(bundle.char.length);
        }
        return true;
    }

    private charDeletedLocal(index: number) {
        let deletedId = this.getIdOfStringIndex(index);
        let bundle: CT.DeleteMessage = {
            deleteId: deletedId
        };

        this.dt.delete(bundle);

        let networkPacket: NT.NetworkPacket = {
            origin: this.id,
            type: 'd',
            bundle: bundle
        };
        this.network.broadcast(networkPacket);
        this.updateParallelArrays();
    }

    private deleteReceived(bundle: CT.DeleteMessage): boolean {
        if (!this.dt.delete(bundle)) {
            return false;
        }
        // get old cursor position and 'after'
        let oldCursorPosition = this.interface.getCursorPosition();
        let oldAfterId = this.getIdOfStringIndex(oldCursorPosition);

        this.updateParallelArrays();

        // probably possible to do this more cleanly
        let newAfterId = this.getIdOfStringIndex(oldCursorPosition);
        this.interface.setContent(this.charArray.join(''));
        if (oldAfterId !== newAfterId) {
            this.interface.decrementCursorPosition();
        }
        return true;
    }

    private requestCRDTReceived(origin: T.ClientId): void {
        if (this.dt !== undefined) {
            let crdt = (<CT.MapCRDTStore>this.dt.getCRDTCopy());
            this.network.returnCRDT(origin, crdt);
        } else {
            this.requestedCRDTQueue.push(origin);
        }
    }

    private returnCRDTReceived(crdt: CT.MapCRDTStore): void {
        // YAS GOT A CRDT FROM NEIGHBOR
        this.dt = new MapCRDT(crdt);

        // (!!!) also don't forget to pass it to any neighbors waiting for this as well
        for (let clientRequestingCRDT of this.requestedCRDTQueue) {
            this.network.returnCRDT(clientRequestingCRDT, crdt);    // this network operation is always enabled
        }

        this.network.enable();  // absorb all waiting changes, plus disable queueing packet to broadcast and receive packets
    }



    private updateParallelArrays(): void {
        let readValues = this.dt.read();
        this.charArray = readValues.charArray;
        this.idArray = readValues.idArray;
    }

    private getIdOfStringIndex(after: number): string {
        return this.idArray[after];
    }

}

export default Client;