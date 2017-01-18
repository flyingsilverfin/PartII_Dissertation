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

    private interface: EditableText;
    public network: NetworkInterface;

    // state variables
    // parallel lists of char array and CRDT IDs of chars
    private charArray: string[];
    private idArray: string[];


    constructor(networkInterface: NetworkInterface, id: T.ClientId, scheduler: EventDrivenScheduler, events: T.ScheduledEvents) {

        this.dt = new MapCRDT();

        this.network = networkInterface;
        this.network.insertPacketReceived = this.insertReceived.bind(this);
        this.network.deletePacketReceived = this.deleteReceived.bind(this);
        this.id = "" + id;


        let interfaceContainer = <HTMLDivElement>document.getElementById('clients-container');

        this.interface = new EditableText(interfaceContainer);
        this.interface.setId(this.id);
        this.interface.insertCallback = this.charInsertedLocal.bind(this);
        this.interface.deleteCallback = this.charDeletedLocal.bind(this);

        this.updateParallelArrays();

        // 'events' are stored as a map between time and items to insert and delete
 
        for (let eventTime in events.insert) {
            let time = parseFloat(eventTime);
            let insert = events.insert[time];

            let self = this;

            for (let i = 0; i < insert.chars.length; i++) {
                scheduler.addEvent(time, i, function() {
                    self.interface.mockInsert(insert.chars[i], insert.after + i);
                });
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

    }


    // interesting it doesn't type check this automatically with the required structure of this.interface.insertCallback
    private charInsertedLocal(char: string, after: number): void {

        let nextT = this.dt.getNextTs().toString();
        let opId = nextT + '.' + this.id;

        let idOfAfter = this.getIdOfStringIndex(after);
        let bundle: CT.InsertMessage = {
            id: opId,
            char: char,
            after: idOfAfter
        };

        this.dt.insert(bundle);

        // TODO add UNIT TEST in dt.insert

        let networkPacket: NT.NetworkPacket = {
            origin: this.id,
            type: 'i',
            bundle: bundle
        }

        this.network.send(networkPacket);


        // this is bad - does a O(N) retrieval each insert!
        //  #optmize potential
        this.updateParallelArrays();
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
            this.interface.incrementCursorPosition();
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
        this.network.send(networkPacket);
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