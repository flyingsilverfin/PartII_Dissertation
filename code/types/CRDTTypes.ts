import * as T from './Types';

export interface CRDT {
    insert(bundle: InsertMessage): void;    // insert char after loc with id
    delete(bundle: DeleteMessage): void;    // delete some id (need to give id for deletion?)
    undoInsert(bundle: UndoMessage): void;
    undoDelete(bundle: UndoMessage): void;
    redoInsert(bundle: UndoMessage): void;
    redoDelete(bundle: UndoMessage): void;

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
    id: string,
    char: string,
    after: string
}

// built in support for multiple undos of the same type in case I decide to do batching
export interface UndoMessage {
    id: string[]
}

export interface DeleteMessage {
    // id: string   // unsure exactly how to implement this
    deleteId: string
}


// --- MapCRDT ---
export interface MapCRDTStore {
    [id: string]: MapEntry
}

export interface MapEntry {
    c: string,  // character
    n: string,  // next link
    d?: number,  // deleted
    v?: boolean  // visible, used for creator to undo
}