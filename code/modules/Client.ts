import * as CT from '../types/CRDTTypes';
import * as NT from '../types/NetworkTypes';
import * as T from '../types/Types';

import MapCRDT from './MapCRDT';
import EditableText from './EditableText';
import NetworkInterface from './NetworkInterface';
import NetworkManager from './NetworkManager';
import EventDrivenScheduler from './EventDrivenScheduler';
import ClientOpStack from './ClientOpStack';

/*
TODO
I've imagined a pretty horrible case:
3 clients, 1 and 2 are in the system and transmit with a large latency
Client 3 joins with a large latency to client 2 but a short one to Client 1 shortly after Client 2 broadcasts 
a packet (only to client 1 since 3 joins right after)
Client 3 requests CRDT from Client 1 (lowest ID) which arrives before Client 2's new packet arrives at Client 1
Client 1 returns its CRDT to client 3, which does not contain 2's new event
thus Client 3 will never receive Client 2's new event and lose that data...

WOAH!!!!
The broadcast bounceback will actually solve this problem! Client 1 will broadcast the packet from 2
to all of its neighbors, which will include Client 1!
*/

class Client {

    private DISABLE_INTERFACE = true;

    private id: string;
    private dt: CT.CRDT;    // our CRDT (datastructure)

    private opStack: ClientOpStack;

    private events: T.ScheduledEvents;    // all the events to insert and delete
    private optimized: boolean;
    private insertBuffer: string[] = [];
    private insertStartId: string;
    private insertStartAfter: string;

    private interface: EditableText;
    private scheduler: EventDrivenScheduler;

    private requestedCRDTQueue: T.ClientId[];
    public network: NetworkInterface;
    
    // state variables
    // parallel lists of char array and CRDT IDs of chars
    private charArray: string[];
    private idArray: string[];


    constructor(networkInterface: NetworkInterface, id: T.ClientId, scheduler: EventDrivenScheduler, events: T.ScheduledEvents, optimized=false) {


        


        this.events = events;
        this.scheduler = scheduler;
        this.optimized = optimized;
        this.opStack = new ClientOpStack();

        this.network = networkInterface;
        this.network.insertPacketReceived = this.insertReceived.bind(this);
        this.network.deletePacketReceived = this.deleteReceived.bind(this);
        this.network.requestCRDTReceived = this.requestCRDTReceived.bind(this);
        this.network.returnCRDTReceived = this.returnCRDTReceived.bind(this);
        this.network.undoInsertReceived = this.undoInsertReceived.bind(this);
        this.network.undoDeleteReceived = this.undoDeleteReceived.bind(this);
        this.network.redoInsertReceived = this.redoInsertReceived.bind(this);
        this.network.redoDeleteReceived = this.redoDeleteReceived.bind(this);

        this.requestedCRDTQueue = [];
        this.id = "" + id;


        let interfaceContainer = <HTMLDivElement>document.getElementById('clients-container');

        this.interface = new EditableText(interfaceContainer, optimized, this.DISABLE_INTERFACE);
        this.interface.setId(this.id);
        this.interface.insertCallback = this.charInsertedLocal.bind(this);
        this.interface.deleteCallback = this.charDeletedLocal.bind(this);
        this.interface.commitCallback = this.commit.bind(this);
        this.interface.setUndoCallback(this.localUndo.bind(this));
        this.interface.setRedoCallback(this.localRedo.bind(this));

        // TODO
        // this is a bit of a silly, unnecessarily hardcoded way of doing this...
        if (this.id === '0') {
            this.dt = new MapCRDT();
            this.enable();
            
        } else {
            let neighbor = this.network.getLowestIdNeighbor();
            this.interface.setContent("(Retrieving datastructure/document)");
            this.network.requestCRDT(neighbor);
            // will callback to returnCRDTReceived when received the CRDT from neighbor
        }
    }


    private localUndo(): void {
        if (!this.opStack.undoAvailable()) {
            return;
        }
        let packet = this.opStack.undo();
        let op = <CT.UndoMessage>packet.bundle;

        if (packet.type === "ui") {
            this.dt.undoInsert(op);
        } else {    // type ud - undo delete
            let when = this.network.peekNextVector();
            this.dt.undoDelete(op, when, when);
        }
        this.updateInterface();
        this.network.broadcast(packet);
    }

    private localRedo(): void {
        if (!this.opStack.redoAvailable()) {
            return;
        }
        let packet = this.opStack.redo();
        let op = <CT.UndoMessage>packet.bundle;


        if (packet.type === "ri") {
            this.dt.redoInsert(op);
        } else {    // type rd - redo delete
            let when = this.network.peekNextVector();
            this.dt.redoDelete(op, when, when);
        }
        this.updateInterface();
        this.network.broadcast(packet);
    }

    private undoInsertReceived(bundle: CT.UndoMessage): void {
        this.dt.undoInsert(bundle);
        this.updateInterface();
    }

    private undoDeleteReceived(bundle: CT.UndoMessage, when: NT.VectorClock): void {
        this.dt.undoDelete(bundle, when, this.network.getCurrentVector());
        this.updateInterface();
    }

    private redoInsertReceived(bundle: CT.UndoMessage): void {
        this.dt.redoInsert(bundle);
        this.updateInterface();
    }

    private redoDeleteReceived(bundle: CT.UndoMessage, when: NT.VectorClock): void {
        this.dt.redoDelete(bundle, when, this.network.getCurrentVector());
        this.updateInterface();
    }

    private enable(): void {
        // WARN: MUST be called first - network.enable may run queued receives which require
        //       an up to date id and char array
        //this.updateParallelArrays();
        this.updateInterface();
if (this.DISABLE_INTERFACE) {
    this.interface.setContent("Running")
}
        this.network.enable();
        this.createScheduledEvents();

    }

    private createScheduledEvents(): void {
        // 'events' are stored as a map between time and items to insert and delete
        // IMPORTANT: we now interpret the scheduled events as relative to when the client has been created
        //            

        // info
        let counter = 0;
        for (let eventTime in this.events.insert) {
            let time = parseFloat(eventTime);
            let insert = this.events.insert[time];

            let self = this;

            /*
            OPTIMIZATION
                if enabled, here we will take advantage of the 'insert word' capability
                which sends entire words to insert at once, rather than 1 character at a time
            */
            if (this.optimized) {
                this.scheduler.addEvent(time, 0, function() {
                    self.interface.mockInsert(insert.chars, insert.after);
                })

            } else {
                for (let i = 0; i < insert.chars.length; i++) {
                    this.scheduler.addEvent(time, i, function() {
                        self.interface.mockInsert(insert.chars[i], insert.after + i);
                    });
                }
            }
        }

        
        for (let eventTime in this.events.delete) {
            let time = parseFloat(eventTime);
            let deletes = this.events.delete[eventTime];

            let self = this;
            
            let insertsAtTime = this.events.insert[eventTime]; // for experiments, want deletes to happen after inserts of the same time
            let numInsertsAtTime = 0;
            if (insertsAtTime !== undefined) {
                numInsertsAtTime = insertsAtTime.chars.length;
            }

            for (let i = 0; i < deletes.length; i++) {
                let mockDelete = deletes[i];
                this.scheduler.addEvent(time, 1 + i + numInsertsAtTime, function() {
                    self.interface.mockDelete(mockDelete);
                });
            }
        }

        if (this.events.undo !== undefined) {
            for (let undoAt of this.events.undo) {
                let insertsAtTime = this.events.insert[undoAt]; // for experiments, want deletes to happen after inserts of the same time
                let numInsertsAtTime = 0;
                if (insertsAtTime !== undefined) {
                    numInsertsAtTime = insertsAtTime.chars.length;
                }

                let deletesAt = this.events.delete[undoAt]
                let numDeletesAtTime = 0;
                if (deletesAt !== undefined) {
                    numDeletesAtTime = deletesAt.length;
                }
                let self = this;
                this.scheduler.addEvent(undoAt, 2+numInsertsAtTime + numDeletesAtTime, function() {
                    self.localUndo();
                });
            }
        }
        if (this.events.redo !== undefined) {
            for (let redoAt of this.events.redo) {
                let insertsAtTime = this.events.insert[redoAt]; // for experiments, want deletes to happen after inserts of the same time
                let numInsertsAtTime = 0;
                if (insertsAtTime !== undefined) {
                    numInsertsAtTime = insertsAtTime.chars.length;
                }

                let deletesAt = this.events.delete[redoAt]
                let numDeletesAtTime = 0;
                if (deletesAt !== undefined) {
                    numDeletesAtTime = deletesAt.length;
                }
                let self = this;
                this.scheduler.addEvent(redoAt, 2+numInsertsAtTime + numDeletesAtTime, function() {
                    self.localRedo();
                });
            }
        }

        this.events = null; // to enable GC later
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

            let networkPacket: NT.PreparedPacket = {
                type: 'i',
                bundle: bundle
            };
            this.network.broadcast(networkPacket);

            this.insertBuffer = [];
            // don't need to reset the rest of the values as they just get overwritten
        } else {
            return;
        }
    }


    /*
        NOTE
        There is a case where a concurrent edit happens at the same location
        Both clients insert locally at, say, index 0. Currently, I've set up local clients
        to immediately splice their text into the index they wrote locally so it shows up right away
        However, once the concurrent packet arrives, one client will see its word jump ahead
        This is expected behavior
    */
    private charInsertedLocal(char: string, index: number, commitNow=false): void {
        let nextT = this.dt.getNextTs().toString(); // must reserve this timestamp for this character
        let opId = nextT + '.' + this.id;


        // CAN I PUT THIS INTO THE CRDT LATER ALL TOGETHER ie with one start ID + length????
        // ANS: bad idea - if another message arrives with a higher Timestamp, this one will jump up
        //      and we will no longer have a continuous sequence of timestamps in our crdt
        // SOLUTION: insert each character into CRDT immediately with unique ID
        //           Meanwhlie, buffer the string to be sent. If an edit arrives, then immediately send our changes
        // NOTE: this is a possible optimization that requires inserts/deletes to be labeled as (prior hash identifier, offset)
        //       then split up the word in the CRDT into sub words/characters

        let idOfAfter = this.getIdOfStringIndex(index-1);
        let bundle: CT.InsertMessage = {
            id: opId,
            char: char,
            after: idOfAfter
        };

        this.dt.insert(bundle);
        this.opStack.localInsert(opId, char.length);


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
            let networkPacket: NT.PreparedPacket = {
                type: 'i',
                bundle: bundle
            }
            this.network.broadcast(networkPacket);
        }
    }

    private insertReceived(bundle: CT.InsertMessage): void {
        /*  
        if (!this.dt.insert(bundle)) {
            return false;
        }
        */
        this.dt.insert(bundle);


        // get old cursor position and 'after'
        let oldCursorPosition = this.interface.getCursorPosition();
        let oldAfterId = this.getIdOfStringIndex(oldCursorPosition);


        this.updateParallelArrays();

        // probably possible to do this more cleanly
        let newAfterId = this.getIdOfStringIndex(oldCursorPosition);
if (!this.DISABLE_INTERFACE) {
        this.interface.setContent(this.charArray.join(''));
}
        if (oldAfterId !== newAfterId) {
            this.interface.incrementCursorPosition(bundle.char.length);
        }

        //return true;
    }

    private charDeletedLocal(index: number) {
        let deletedId = this.getIdOfStringIndex(index);
        let bundle: CT.DeleteMessage = {
            deleteId: deletedId
        };

        // WARNING: NOT ROBOUST IF BUFFERING IN THE FUTURE
        //          all buffered local deletes will have same peeked vector...
        //          would either need some sort of keep for next buffered item OR redo this architecture (better)
        let when = this.network.peekNextVector();   // vector that will be used with the delete

        this.dt.delete(bundle, when, when);
        this.opStack.localDelete(deletedId, 1); // no support for group deletes yet, would need a buffering layer

        let networkPacket: NT.PreparedPacket = {
            type: 'd',
            bundle: bundle
        };
        this.network.broadcast(networkPacket);
        this.updateParallelArrays();
    }

    private deleteReceived(bundle: CT.DeleteMessage, when: NT.VectorClock): void {
        
        this.dt.delete(bundle, when, this.network.getCurrentVector());

        // get old cursor position and 'after'
        let oldCursorPosition = this.interface.getCursorPosition();
        let oldAfterId = this.getIdOfStringIndex(oldCursorPosition);

        this.updateParallelArrays();

        // probably possible to do this more cleanly
        let newAfterId = this.getIdOfStringIndex(oldCursorPosition);
if (!this.DISABLE_INTERFACE) {
        this.interface.setContent(this.charArray.join(''));
}
        if (oldAfterId !== newAfterId) {
            this.interface.decrementCursorPosition();
        }

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

        this.enable();  // absorb all waiting changes, plus disable queueing packet to broadcast and receive packets
    }



    private updateParallelArrays(): void {
        let readValues = this.dt.read();
        this.charArray = readValues.charArray;
        this.idArray = readValues.idArray;
    }

    private getIdOfStringIndex(after: number): string {
        return this.idArray[after+1];
    }

    private updateInterface(): void {
        this.updateParallelArrays();
if (!this.DISABLE_INTERFACE) {
        this.interface.setContent(this.charArray.join(''));
}
    }

}

export default Client;