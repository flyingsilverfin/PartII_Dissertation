import * as CT from '../types/CRDTTypes';
import * as NT from '../types/NetworkTypes';
import * as CC from './CRDTComparator';
import * as Helper from './Helper';
import {areConcurrent} from './VectorComparators';


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
    public insert(bundle: CT.InsertMessage): void {

        // this is now checked by sequence numbers at network layer
        // keep this as a check
        if (this.map.hasOwnProperty(bundle.id)) {
            throw new Helper.CRDTException("Received an insert bundle which has already been inserted... network failed to reject already seen before packet");
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
        while (CC.compare(startId, entryBefore.n) < 0) { 
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

    }

    // implements interface
    // 
    public delete(bundle: CT.DeleteMessage, when: NT.VectorClock, mergedVector: NT.VectorClock): void {
        let idToDelete = bundle.deleteId;
        if (this.map[idToDelete] === undefined ) {
            throw new Helper.CRDTException("Trying to delete CRDT ID that doesn't exist... something is very broken");
        }
        if (idToDelete === "0") {
            throw new Helper.CRDTException("Not allowed to delete ID 0");
        }
        if (this.map[idToDelete].d === undefined) {
            this.map[idToDelete].d = [true, when] ;
        } else {
            let value = this.map[idToDelete].d;

            /*
            Defined semantics for immediate undo:
                If concurrent delete and undo, the make-visible operation (undo) wins
                So we discard the effect of this delete but update the timestamp
            */

            if (!areConcurrent(value[1], when)) { // because of causal delivery guarantee, if not concurrent, 'when' is newer
                value[0] = true;    // then set as deleted
            }    
            value[1] = mergedVector;   // in any case, update the when label
        }
    }


    // has capability for multi undo already
    public undoInsert(bundle: CT.UndoMessage): void {
        let undoTargets = bundle.id;
        for (let id of undoTargets) {
            this.map[id].v = false;
        }
    }

    // has capability for multi undo already
    // when: is the vector that came in the packet
    // mergedVector: is the vector that is the result of merging our and 'when' ie. causally after when
    public undoDelete(bundle: CT.UndoMessage, when: NT.VectorClock, mergedVector: NT.VectorClock): void {
        let undoTargets = bundle.id;
        // since this is undo, by causality each target ID must already have been deleted ie. have a tag
        for (let id of undoTargets) {
            let value = this.map[id].d;  //obtain a reference we can modify map with directly

            /*
            Defined semantics for immediate undo:
                If there is a concurrent delete and Undo Delete, the 'make-visible' action win.
                If there are concurrent Undo Delete's it doesn't really matter, idempotent

                basically, an Undo-Delete always wins
            */
            if (value[0]) { //if deleted currently, then undo
                value[0] = false;
            }   // else if already visible, then it's fine
            value[1] = mergedVector;
        }
    }

    // has capability for multi undo already
    public redoInsert(bundle: CT.UndoMessage): void {
        let undoTargets = bundle.id;
        for (let id  of undoTargets) {
            this.map[id].v = true;
        }
    }

    // has capability for multi undo already
    // when: is the vector that came in the packet
    // mergedVector: is the vector that is the result of merging our and 'when' ie. causally after when
    public redoDelete(bundle: CT.UndoMessage, when: NT.VectorClock, mergedVector: NT.VectorClock): void {
        let undoTargets = bundle.id;
        // since this is undo, by causality each target ID must already have been deleted ie. have a tag
        for (let id of undoTargets) {
            let value = this.map[id].d;  //obtain a reference we can modify map with directly

            /*
            Defined semantics for immediate undo:
                If concurrent redo'ing and undo-ing, the make-visible operation (undo) wins
                So we discard the effect of this redo but update the timestamp
            */

            if (!areConcurrent(value[1], when)) { // because of causal delivery guarantee, if not concurrent, 'when' is newer
                value[0] = true;    // then set as deleted
            }    
            value[1] = mergedVector;   // in any case, update the when label
        }
    }

    // implements interface
    public read(): CT.ParallelStringArrays {
        // writing to array then joining seems to be fastest way of doing this

        let charArray = [];
        let idArray = [];
        let id = '0';
        let entry: CT.MapEntry;
        while (id !== null) {
            entry = this.map[id];   // if only TS did inference on this too...
            // if 'visible' is undefined or true, and 'deleted' is undefined or 0
            if ((entry.v === undefined || entry.v) && (entry.d === undefined || entry.d[0] === false)) { // if == 0 should work just fine I think
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