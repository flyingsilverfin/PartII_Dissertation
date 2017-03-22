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
// SWITCHING back from JS Map native
// but adding wrapper to support [1,2] as key


export interface UniquePairMap<K, V> {
    get(K): V,
    set(K, V): void,
    has(K): boolean,
    keys(): [number, number][],
    size(): number
}

export type MapCRDTStore = UniquePairMap<id, MapEntry>;

export type id = [number, T.ClientId];

export interface MapEntry {
    c: string,  // character
    n: id,      // next link
    d?: boolean // deleted
}