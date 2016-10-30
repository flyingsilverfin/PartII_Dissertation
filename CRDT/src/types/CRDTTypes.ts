export interface CRDTDatastructure {
    insert(bundle: InsertMessage): void;    // insert char after loc with id
    delete(bundle: DeleteMessage): void;    // delete some id (need to give id for deletion?)
    
    read(): string;     // return entire string contained within
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


// --- MapCRDTDatastructure ---
export interface MapCRDT {
    [id: string]: MapEntry
}

interface MapEntry {
    char: string,
    next: string,
    deleted?: boolean
}