import * as CT from '../types/CRDTTypes';
import * as NT from '../types/NetworkTypes';
import * as T from '../types/Types';

import MapCRDT from './MapCRDT';
import EditableText from './EditableText';
import NetworkInterface from './NetworkInterface';
import NetworkManager from './NetworkManager';
import EventDrivenScheduler from './EventDrivenScheduler';
import ClientOpStack from './ClientOpStack';
import Logger from './Logger';

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

    private DISABLE_INTERFACE = false;

    private logger: Logger;

    private id: string;
    private dt: CT.CRDT;    // our CRDT (datastructure)

    private opStack: ClientOpStack;

    private events: T.ScheduledEvents;    // all the events to insert and delete
    private optimized: boolean;
    private insertBuffer: [string, string][] = [];  //repurpose to hold pairs of (startId, insertAfter)
    //private insertStartId: string;
    //private insertStartAfter: string;

    private interface: EditableText;
    private scheduler: EventDrivenScheduler;

    private requestedCRDTQueue: T.ClientId[];
    public network: NetworkInterface;
    
    // state variables
    // parallel lists of char array and CRDT IDs of chars
    private charArray: string[];
    private idArray: string[];


    constructor(networkInterface: NetworkInterface, id: T.ClientId, scheduler: EventDrivenScheduler, events: T.ScheduledEvents, optimized=false, logger:Logger) {


        this.logger = logger;


        this.events = events;
        this.scheduler = scheduler;
        this.optimized = optimized;
        this.opStack = new ClientOpStack();

        this.network = networkInterface;
        this.network.bundledInsertPacketReceived = this.bundledInsertReceived.bind(this);
        this.network.bundledDeletePacketReceived = this.bundledDeleteReceived.bind(this);
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
        let op = <CT.UndoMessage>packet.b;

        if (packet.t === "ui") {
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
        let op = <CT.UndoMessage>packet.b;


        if (packet.t === "ri") {
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
            let inserts = this.events.insert[time];

            let self = this;

            if (inserts.length === 0) {  //skip empty insertions
                continue;
            }

            /*
            OPTIMIZATION
                if enabled, here we will take advantage of the 'insert word' capability
                which sends entire words to insert at once, rather than 1 character at a time
            */
            if (this.optimized) {
                this.scheduler.addEvent(time, 0, function() {
                    self.logger.log('time', "Beginning large mock insert");
                    self.interface.mockInsert(inserts);
                    self.logger.log("time", "Finished large mock insert at source");
                })
            } else {
              /*  for (let i = 0; i < insert.chars.length; i++) {
                    this.scheduler.addEvent(time, i, function() {
                        self.interface.mockInsert(insert.chars[i], insert.after + i);
                    });
                }
                */
                console.log("Not programmed for non-optimized testing, skipping!")
            }
        }

        
        for (let eventTime in this.events.delete) {
            let time = parseFloat(eventTime);
            let deletes = this.events.delete[eventTime];

            let self = this;

            if (deletes.length === 0) {
                continue;
            }

            this.scheduler.addEvent(time, 1, function() {
                self.logger.log('time', "Beginning large mock delete");
                self.interface.mockDelete(deletes);
                self.logger.log('time', "Finished large mock delete");
            });
        }

/*        if (this.events.undo !== undefined) {
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
*/
    }

    private commit(inserts: T.ScheduledInsert[]): void {
        if (inserts === undefined) {
            return;
        }
        let bundles = [];
        for (let insert of inserts) {
            let chars = insert.chars;


            let vals = this.insertBuffer.shift();


            let insertId = vals[0];
            let afterId = vals[1];

            let bundle: CT.InsertMessage = {
                i: insertId,
                c: chars,
                a: afterId
            };

            bundles.push(bundle);
        }

        //bundled insert to allow many inserts at same time at different places
        let networkPacket: NT.PreparedPacket = {
            t: 'bi',
            b: bundles
        };
        this.network.broadcast(networkPacket);

        this.insertBuffer = [];
    }


    /*
        NOTE
        There is a case where a concurrent edit happens at the same location
        Both clients insert locally at, say, index 0. Currently, I've set up local clients
        to immediately splice their text into the index they wrote locally so it shows up right away
        However, once the concurrent packet arrives, one client will see its word jump ahead
        This is expected behavior
    */
    private charInsertedLocal(inserts: T.ScheduledInsert[], commitNow=false): void {

        for (let insert of inserts) {
            let char = insert.chars;
            let index = insert.after;

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
                i: opId,
                c: char,
                a: idOfAfter
            };

            this.dt.insert(bundle);
            this.insertBuffer.push([opId, idOfAfter]);   // repurpose to contain the op

        //this.opStack.localInsert(opId, char.length);



            /*if (this.optimized) {
                if (this.insertBuffer.length === 0) {
                    this.insertBuffer.push(char);
                    this.insertStartId = opId;
                    this.insertStartAfter = idOfAfter;
                } else {
                    this.insertBuffer.push(char);
                }
            } else {
                let networkPacket: NT.PreparedPacket = {
                    t: 'i',
                    b: bundle
                }
                this.network.broadcast(networkPacket);
                
            }
            */
        }


        this.updateParallelArrays();
        // this is used for mock inserts mostly
        if (commitNow) {
            this.commit(inserts);
        }
    }

    private bundledInsertReceived(b: CT.BundledInsertMessage): void {
        let bundles = b;

        this.logger.log('time', "Beginning remote insertion bundle integration at " + this.id);
        for (let bundle of bundles) {
            this.dt.insert(bundle);


            // get old cursor position and 'after'
            let oldCursorPosition = this.interface.getCursorPosition();
            let oldAfterId = this.getIdOfStringIndex(oldCursorPosition);


            // probably possible to do this more cleanly
            let newAfterId = this.getIdOfStringIndex(oldCursorPosition);
            if (oldAfterId !== newAfterId) {
                this.interface.incrementCursorPosition(bundle.c.length);
            }
        }

        this.updateParallelArrays();
        if (!this.DISABLE_INTERFACE) {
            this.interface.setContent(this.charArray.join(''));
        }
        this.logger.log('time', "Finished remote insertion bundle integration at " + this.id);


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
            this.interface.incrementCursorPosition(bundle.c.length);
        }

        //return true;
    }

    private charDeletedLocal(indices: number[]) {
        let bundles = [];
        for (let index of indices) {
            this.updateParallelArrays();        // could move this out to make it insanely faster than ShareJS

            let deletedId = this.getIdOfStringIndex(index);
            let bundle: CT.DeleteMessage = {
                delId: deletedId
            };
            bundles.push(bundle);

            // WARNING: NOT ROBOUST IF BUFFERING IN THE FUTURE
            //          all buffered local deletes will have same peeked vector...
            //          would either need some sort of keep for next buffered item OR redo this architecture (better)
            let when = this.network.peekNextVector();   // vector that will be used with the delete

            this.dt.delete(bundle, when, when);
            this.opStack.localDelete(deletedId, 1); // no support for group deletes yet, would need a buffering layer
        }
        let networkPacket: NT.PreparedPacket = {
            t: 'bd',
            b: bundles
        };
        this.network.broadcast(networkPacket);  // I'll have to see if using the same vector for each will work OK... everything will be deemed concurrent which is the goal
        //this.updateParallelArrays();
        if (!this.DISABLE_INTERFACE) {
            this.interface.setContent(this.charArray.join(''));
        }
    }

    private bundledDeleteReceived(bundles:CT.BundledDeleteMessage, when:NT.VectorClock): void {

        this.logger.log('time', "Beginning remote deletion bundle integration at " + this.id);

        for (let bundle of bundles) {
            this.dt.delete(bundle, when, this.network.getCurrentVector());

            // get old cursor position and 'after'
            let oldCursorPosition = this.interface.getCursorPosition();
            let oldAfterId = this.getIdOfStringIndex(oldCursorPosition);


            // probably possible to do this more cleanly
            let newAfterId = this.getIdOfStringIndex(oldCursorPosition);
   
            if (oldAfterId !== newAfterId) {
                this.interface.decrementCursorPosition();
            }
        }

        this.updateParallelArrays();
        if (!this.DISABLE_INTERFACE) {
            this.interface.setContent(this.charArray.join(''));
        }
        this.logger.log('time', "Finished remote deletion bundle integration at " + this.id);
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