import * as CT from '../types/CRDTTypes';
import * as CC from './CRDTComparator';
import * as Helper from './Helper';


class MapCRDT implements CT.CRDT {

    private nextCounter: number;

    private map: CT.MapCRDTStore;

    constructor(map?: CT.MapCRDTStore) {
        this.nextCounter = 1;

        if (map === undefined) {
            // keep '0' as as an anchorpoint
            this.map = {
                '0' : {
                    n: null,
                    c: ''
                }
            };
        } else {
            this.map = map;
            // need to find max timestamp used in CRDT already to set our own nextCounter
            let t = 0;
            for (let key in this.map) {
                let usedT = parseInt(key.split('.')[0])
                if (usedT > t) {
                    t = usedT;
                }
            }
            this.nextCounter = t + 1;
        }
    }


    // don't allow any references to the actual object to escape
    public getCRDTCopy(): CT.MapCRDTStore {
        return JSON.parse(JSON.stringify(this.map));
    }

    // implements interface
    // return false if this ID is already used
    public insert(bundle: CT.InsertMessage): boolean {

        if (this.map.hasOwnProperty(bundle.i)) {
            return false
        }

        // ASSERT NEEDED:
        //  this.map[bundle.id] === undefined 

        let startId = bundle.i;     // id.timestamp to insert this char with
        let startIdTimestamp = parseInt(startId.split('.')[0]);
        let startIdClient = startId.split('.')[1];

        let char = bundle.c;
        let after = bundle.a;   // id.timestamp to insert this char after

        // implement core CRDT insert algorithm here
        // may want to abstract out into separate class to plug into other datastructures if desired
        let entryBeforeId = after;
        let entryBefore = this.map[after];


        // move forward until hit a next element which is less than id
        // entryBefore.next may be null! (will often be null)
        while (CC.compare(startId, entryBefore.n) < 0) {      //ERROR HERE - comparison is wrong somehow...
            entryBeforeId = entryBefore.n;
            entryBefore = this.map[entryBeforeId];
        }

        console.log('Inserting after: ' + entryBeforeId + ' with id ' + startId);


        // now capable of adding words at a time given a start ID and a string
        let lastLink = entryBefore.n;
        for (let i = 0; i < char.length; i++) {
            let charToInsert = char[i];
            let t = startIdTimestamp + i;
            let id = t + "." + startIdClient;

            // insert new entry into linked list
            let newEntry: CT.MapEntry = {
                c: charToInsert,
                n: null  // will be added next iteration
            }

            entryBefore.n = id;
            this.map[id] = newEntry;


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
        let idToDelete = bundle.delId;
        if (this.map[idToDelete] === undefined ) {
            throw new Helper.CRDTException("Trying to delete CRDT ID that doesn't exist... something is very broken");
        }
        if (this.map[idToDelete].d) {
            return false;
        }
        this.map[idToDelete]['d'] = true;
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