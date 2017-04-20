export type ClientId = number;

export interface Exception {
    msg: string
}


export interface HeapElement {
    key: number;
    payload: any;
}

export interface DualKeyHeapElement {
    pKey: number;
    sKey: number;
    payload: any;
}


export interface ScheduledEvents {
    insert: ScheduledInsertEvents;
    delete: ScheduledDeleteEvents;
    undo: number[];     //list of times to execute an undo
    redo: number[];     //list of times to execute an undo
}

export interface ScheduledInsertEvents {
    [time: number] : ScheduledInsert;
}

export interface ScheduledInsert {
    chars: string,  // word to insert
    after: number   // at what index to insert at
}

// at each time, which indices to delete in visible char array
// may be better to go through CRDT but those ID's are internal
export interface ScheduledDeleteEvents {
    [time: number]: ScheduledDelete[]
}

export type ScheduledDelete  = number
