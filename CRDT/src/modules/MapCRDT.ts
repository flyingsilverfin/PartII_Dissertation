import * as CT from '../types/CRDTTypes';
import * as CC from './CRDTComparator';



class MapCRDT implements CT.CRDT {

    private nextCounter: number;
    private id: string;

    private map: CT.MapCRDTStore;

    constructor(id: string) {
        this.id = id;
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
    insert(bundle): void {

        // ASSERT NEEDED:
        //  this.map[bundle.id] === undefined 

        let id = bundle.id;     // id.timestamp to insert this char with
        let char = bundle.char;
        let after = bundle.after;   // id.timestamp to insert this char after



        // implement core CRDT insert algorithm here
        // may want to abstract out into separate class to plug into other datastructures if desired
        let entryBeforeId = after;
        let entryBefore = this.map[after];

        // move forward until hit a next element which is less in lamport clock
        while (CC.compare(id, entryBefore.next) > 0) {
            entryBeforeId = entryBefore.next;
            entryBefore = this.map[entryBeforeId];
        }

        console.log('Inserting after: ' + entryBeforeId);



        // insert new entry into linked list
        let newEntry: CT.MapEntry = {
            char: char,
            next: entryBefore.next
        }

        entryBefore.next = id;
        this.map[id] = newEntry;
    }

    // implements interface
    delete(bundle): void {
        // TODO
    }

    // implements interface
    read(): string {
        // writing to array then joining seems to be fastest way of doing this

        let arr = [];
        let entry = this.map[0];
        while (entry.next !== null) {
            if (!entry.deleted) {
                arr.push(entry.char);
            }
            entry = this.map[entry.next]
        }

        return arr.join('');
    }

}

export default MapCRDT;