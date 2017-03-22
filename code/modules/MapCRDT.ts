import * as CT from '../types/CRDTTypes';
import * as CC from './CRDTComparator';
import * as Helper from './Helper';

import UniquePairMap from './UniqueMap';


class MapCRDT implements CT.CRDT {

    /*
        Note: as of rewrite to use JS Maps, need to enforce unique keys myself
    */

    private nextCounter: number;

    private map: CT.MapCRDTStore;

    constructor(map?: CT.MapCRDTStore) {
        this.nextCounter = 1;

        if (map === undefined) {
            // keep '0' as as an anchorpoint
            this.map = new UniquePairMap();
            this.map.set([0, -1], {
                    n: null,
                    c: ''
                }
            );
        } else {
            this.map = map;
            // need to find max timestamp used in CRDT already to set our own nextCounter
            this.nextCounter = Math.max(...([...this.map.keys()].map( (value, index) => value[0]))) + 1;
        }
    }


    // don't allow any references to the actual object to escape
    public getCRDTCopy(): CT.MapCRDTStore {
        return new Map(this.map);
    }

    // implements interface
    // return false if this ID is already used
    public insert(bundle: CT.InsertMessage): boolean {

        if (this.map.has(bundle.id)) {
            return false
        }

        // ASSERT NEEDED:
        //  this.map[bundle.id] === undefined 

        let startId = bundle.id;     // id.timestamp to insert this char with
        let startIdTimestamp = startId[0];
        let startIdClient = startId[1];

        let char = bundle.char;
        let after = bundle.after;   // id.timestamp to insert this char after

        // implement core CRDT insert algorithm here
        // may want to abstract out into separate class to plug into other datastructures if desired
        let entryBeforeId = after;
        let entryBefore = this.map.get(after);


        // move forward until hit a next element which is less than id
        // entryBefore.next may be null! (will often be null)
        while (CC.compare(startId, entryBefore.n) < 0) {      //ERROR HERE - comparison is wrong somehow...
            entryBeforeId = entryBefore.n;
            entryBefore = this.map.get(entryBeforeId);
        }

        console.log('Inserting after: ' + entryBeforeId + ' with id ' + startId);


        // now capable of adding words at a time given a start ID and a string
        let lastLink = entryBefore.n;
        for (let i = 0; i < char.length; i++) {
            let charToInsert = char[i];
            let t = startIdTimestamp + i;
            let id: CT.id = [t, startIdClient];

            // insert new entry into linked list
            let newEntry: CT.MapEntry = {
                c: charToInsert,
                n: null  // will be added next iteration
            }

            entryBefore.n = id;
            this.map.set(id, newEntry);


            // update local lamport timestamp
            // let t = parseInt(id.split('.')[0]);

            // ASSERT NEEDED
            //  t >= this.nextCounter
            // this assert would not always hold, not sure why I almost had it
            this.nextCounter = Math.max(t+1, this.nextCounter);
            entryBefore = newEntry;
        }
        // connect last link
        entryBefore.n = lastLink;

        return true;
    }

    // implements interface
    // return false if ID already has been deleted - no need to pass on msg again
    public delete(bundle: CT.DeleteMessage): boolean {
        let idToDelete = bundle.del;
        if (!this.map.has(idToDelete)) {
            throw new Helper.CRDTException("Trying to delete CRDT ID that doesn't exist... something is very broken");
        }
        if (this.map.get(idToDelete).d) {
            return false;
        }
        this.map.get(idToDelete)['d'] = true;
        return true;
    }

    // implements interface
    public read(): CT.ParallelStringArrays {
        debugger
        // writing to array then joining seems to be fastest way of doing this

        let charArray = [];
        let idArray = [];
        let id:CT.id = [0,-1];  // rooting element
        let entry: CT.MapEntry;
        while (id !== null) {
            entry = this.map.get(id);
            if (!entry.d) {
                // TODO unsure of how to handle deletion still!
                charArray.push(entry.c);
                idArray.push(id)
            }
            id = entry.n;
        }

        return {charArray: charArray, idArray: idArray};
    }


    public getNextTs(): number {
        return this.nextCounter;
    }
}

export default MapCRDT;