export interface CRDT {
    insert(bundle: InsertMessage): boolean;    // insert char after loc with id
    delete(bundle: DeleteMessage): boolean;    // delete some id (need to give id for deletion?)
    
    read(): ParallelStringArrays;     // return entire string contained within
    getNextTs(): number;    //next valid timestamp
}

export interface ParallelStringArrays {
    charArray: string[],
    idArray: string[]
}

export interface InsertMessage {
    id: string,
    char: string,
    after: string
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
    char: string,
    next: string,
    deleted?: boolean
}