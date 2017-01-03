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
}

export interface ScheduledInsertEvents {
    [time: number] : string
}

// at each time, which indices to delete in visible char array
// may be better to go through CRDT but those ID's are internal
export interface ScheduledDeleteEvents {
    [time: number]: number[]
}