import * as T from './Types';

export interface CRDT {
    insert(bundle: InsertMessage): void;    // insert char after loc with id
    delete(bundle: DeleteMessage): void;    // delete some id (need to give id for deletion?)

    getCRDTCopy(): any; // need some sort of mechanism for extracting crdt datastructure
    
    read(): ParallelStringArrays;     // return entire string contained within
    getNextTs(): number;    //next valid timestamp
}

export interface ParallelStringArrays {
    charArray: string[],
    idArray: id[]
}

export interface InsertMessage {
    id: id,
    char: string,
    after: id
}


export interface DeleteMessage {
    // clock value, client ID
    del: id
}


// --- MapCRDT ---
// SWITCHING to JS Map native as it supports keys that are objects like [1,2] etc.



export type MapCRDTStore = Map<id, MapEntry>;


export type id = [number, T.ClientId];

export interface MapEntry {
    c: string,  // character
    n: id,      // next link
    d?: boolean // deleted
}