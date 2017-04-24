import * as CT from '../types/CRDTTypes';
import * as NT from '../types/NetworkTypes';
import * as T from '../types/Types';

import MapCRDT from './MapCRDT';
import EditableText from './EditableText';
import NetworkInterface from './NetworkInterface';
import NetworkManager from './NetworkManager';
import EventDrivenScheduler from './EventDrivenScheduler';


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

        this.network = networkInterface;
        this.network.insertPacketReceived = this.insertReceived.bind(this);
        this.network.deletePacketReceived = this.deleteReceived.bind(this);
        this.network.requestCRDTReceived = this.requestCRDTReceived.bind(this);
        this.network.returnCRDTReceived = this.returnCRDTReceived.bind(this);
        this.requestedCRDTQueue = [];
        this.id = "" + id;


        let interfaceContainer = <HTMLDivElement>document.getElementById('clients-container');

        this.interface = new EditableText(interfaceContainer, optimized, this.DISABLE_INTERFACE);
        this.interface.setId(this.id);
        this.interface.insertCallback = this.charInsertedLocal.bind(this);
        this.interface.deleteCallback = this.charDeletedLocal.bind(this);
        this.interface.commitCallback = this.commit.bind(this);

        // TODO
        // this is a bit of a silly, unnecessarily hardcoded way of doing this...
        if (this.id === '0') {
            this.dt = new MapCRDT();
            this.enable();
            
        } else {
            let neighbor = this.network.getLowestIdNeighbor();
if (!this.DISABLE_INTERFACE) {
            this.interface.setContent("(Retrieving datastructure/document)");
}
            this.network.requestCRDT(neighbor);
            // will callback to returnCRDTReceived when received the CRDT from neighbor
        }

    }

    private enable(): void {
        // WARN: MUST be called first - network.enable may run queued receives which require
        //       an up to date id and char array
        this.updateParallelArrays();
if (this.DISABLE_INTERFACE) {
    this.interface.setContent("Running")
}
        this.network.enable();
        this.createScheduledEvents();

        this.interface.setContent(this.charArray.join('')); // received CRDT (if got one) doesn't get displayed without an incoming packet otherwise

    }

    private createScheduledEvents(): void {
        // 'events' are stored as a map between time and items to insert and delete
        // IMPORTANT: we now interpret the scheduled events as relative to when the client has been created
        //            
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
                    self.interface.mockDelete(mockDelete.index);
                });
            }
        }
    }

    private commit(): void {
        if (this.insertBuffer.length > 0) {
            let chars = this.insertBuffer.join('');
            let insertId = this.insertStartId;
            let afterId = this.insertStartAfter;

            let bundle: CT.InsertMessage = {
                i: insertId,
                c: chars,
                a: afterId
            };

            let networkPacket: NT.NetworkPacket = {
                o: this.id,
                t: 'i',
                b: bundle
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
        //           

        debugger
        let idOfAfter = this.getIdOfStringIndex(index-1);
        let bundle: CT.InsertMessage = {
            i: opId,
            c: char,
            a: idOfAfter
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
                o: this.id,
                t: 'i',
                b: bundle
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
if (!this.DISABLE_INTERFACE) {
        this.updateParallelArrays();
}

        // probably possible to do this more cleanly
        let newAfterId = this.getIdOfStringIndex(oldCursorPosition);
        this.interface.setContent(this.charArray.join(''));
        if (oldAfterId !== newAfterId) {
            this.interface.incrementCursorPosition(bundle.c.length);
        }
        return true;
    }

    private charDeletedLocal(index: number) {
        let deletedId = this.getIdOfStringIndex(index);
        let bundle: CT.DeleteMessage = {
            delId: deletedId
        };

        this.dt.delete(bundle);

        let networkPacket: NT.NetworkPacket = {
            o: this.id,
            t: 'd',
            b: bundle
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
if (!this.DISABLE_INTERFACE) {
        this.interface.setContent(this.charArray.join(''));
}
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

}

export default Client;