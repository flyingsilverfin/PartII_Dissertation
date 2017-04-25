import * as T from './Types';
import * as NT from './NetworkTypes';

export interface CRDT {
    insert(bundle: InsertMessage): void;    // insert char after loc with id
    delete(bundle: DeleteMessage, when: NT.VectorClock, mergedVector: NT.VectorClock): void;    // delete some id
    undoInsert(bundle: UndoMessage): void;
    undoDelete(bundle: UndoMessage, when: NT.VectorClock, mergedVector: NT.VectorClock): void;
    redoInsert(bundle: UndoMessage): void;
    redoDelete(bundle: UndoMessage, when: NT.VectorClock, mergedVector: NT.VectorClock): void;

    getCRDTCopy(): any; // need some sort of mechanism for extracting crdt datastructure
    
    read(): ParallelStringArrays;     // return entire string contained within
    getNextTs(): number;    //next valid timestamp
}

export interface ParallelStringArrays {
    charArray: string[],
    idArray: string[]
}


/*
    The messages are really built wrong: messages should contain tag for type of message
    rather than relying on the embedding to take care of it
*/
export interface InsertMessage {
    i: string,
    c: string,
    a: string
}

export interface BundledInsertMessage {
    inserts: InsertMessage[]
}


// built in support for multiple undos of the same type in case I decide to do batching
export interface UndoMessage {
    id: string[]
}

export interface DeleteMessage {
    // id: string   // unsure exactly how to implement this
    delId: string,
}


// --- MapCRDT ---
export interface MapCRDTStore {
    [id: string]: MapEntry
}

export interface MapEntry {
    c: string,  // character
    n: string,  // next link
    d?: [boolean, NT.VectorClock],  // [deleted, when]
    v?: boolean  // visible, used for creator to undo
}