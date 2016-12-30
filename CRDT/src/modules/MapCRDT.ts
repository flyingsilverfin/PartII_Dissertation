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

        let id = bundle.id;     // id.timestamp to insert this char with
        let char = bundle.char;
        let after = bundle.after;   // id.timestamp to insert this char after

        // implement core CRDT insert algorithm here
        // may want to abstract out into separate class to plug into other datastructures if desired
        let entryBeforeId = after;
        let entryBefore = this.map[after];


        // move forward until hit a next element which is less than id
        // entryBefore.next may be null! (will often be null)
        while (CC.compare(id, entryBefore.next) < 0) {      //ERROR HERE - comparison is wrong somehow...
            entryBeforeId = entryBefore.next;
            entryBefore = this.map[entryBeforeId];
        }

        console.log('Inserting after: ' + entryBeforeId + ' with id ' + id);



        // insert new entry into linked list
        let newEntry: CT.MapEntry = {
            char: char,
            next: entryBefore.next
        }

        entryBefore.next = id;
        this.map[id] = newEntry;


        // update local lamport timestamp
        let t = parseInt(id.split('.')[0]);
        // ASSERT NEEDED
        //  t >= this.nextCounter
        this.nextCounter = t+1; 

        return true;
    }

    // implements interface
    public delete(bundle: CT.DeleteMessage): boolean {
        let idToDelete = bundle.deleteId;
        if (this.map[idToDelete] === undefined) {
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