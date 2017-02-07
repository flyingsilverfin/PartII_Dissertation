import * as CT from '../types/CRDTTypes';
import * as CC from './CRDTComparator';
import * as Helper from './Helper';


class MapCRDT implements CT.CRDT {

    private nextCounter: number;

    private map: CT.MapCRDTStore;

    constructor() {
        this.nextCounter = 1;

        // keep '0' as as an anchorpoint
        this.map = {
            '0' : {
                next: null,
                char: ''
            }
        };

    }

    // implements interface
    // return false if this ID is already used
    public insert(bundle: CT.InsertMessage): boolean {

        if (this.map.hasOwnProperty(bundle.id)) {
            return false
        }

        // ASSERT NEEDED:
        //  this.map[bundle.id] === undefined 

        let startId = bundle.id;     // id.timestamp to insert this char with
        let startIdTimestamp = parseInt(startId.split('.')[0]);
        let startIdClient = startId.split('.')[1];

        let char = bundle.char;
        let after = bundle.after;   // id.timestamp to insert this char after

        // implement core CRDT insert algorithm here
        // may want to abstract out into separate class to plug into other datastructures if desired
        let entryBeforeId = after;
        let entryBefore = this.map[after];


        // move forward until hit a next element which is less than id
        // entryBefore.next may be null! (will often be null)
        while (CC.compare(startId, entryBefore.next) < 0) {      //ERROR HERE - comparison is wrong somehow...
            entryBeforeId = entryBefore.next;
            entryBefore = this.map[entryBeforeId];
        }

        console.log('Inserting after: ' + entryBeforeId + ' with id ' + startId);


        // now capable of adding words at a time given a start ID and a string
        let lastLink = entryBefore.next;
        for (let i = 0; i < char.length; i++) {
            let charToInsert = char[i];
            let t = startIdTimestamp + i;
            let id = t + "." + startIdClient;

            // insert new entry into linked list
            let newEntry: CT.MapEntry = {
                char: charToInsert,
                next: null  // will be added next iteration
            }

            entryBefore.next = id;
            this.map[id] = newEntry;


            // update local lamport timestamp
            // let t = parseInt(id.split('.')[0]);

            // ASSERT NEEDED
            //  t >= this.nextCounter
            this.nextCounter = t+1; 
            entryBefore = newEntry;
        }
        // connect last link
        entryBefore.next = lastLink;

        return true;
    }

    // implements interface
    // return false if ID already has been deleted - no need to pass on msg again
    public delete(bundle: CT.DeleteMessage): boolean {
        let idToDelete = bundle.deleteId;
        if (this.map[idToDelete] === undefined ) {
            throw new Helper.CRDTException("Trying to delete CRDT ID that doesn't exist... something is very broken");
        }
        if (this.map[idToDelete].deleted) {
            return false;
        }
        this.map[idToDelete]['deleted'] = true;
        return true;
    }

    // implements interface
    public read(): CT.ParallelStringArrays {
        // writing to array then joining seems to be fastest way of doing this

        let charArray = [];
        let idArray = [];
        let id = '0';
        let entry;
        while (id !== null) {
            entry = this.map[id];
            if (!entry.deleted) {
                // TODO unsure of how to handle deletion still!
                charArray.push(entry.char);
                idArray.push(id)
            }
            id = entry.next;
        }

        return {charArray: charArray, idArray: idArray};
    }


    public getNextTs(): number {
        return this.nextCounter;
    }
}

export default MapCRDT;