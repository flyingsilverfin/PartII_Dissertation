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