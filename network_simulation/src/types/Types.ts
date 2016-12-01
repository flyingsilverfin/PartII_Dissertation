export type ClientId = number;

export interface Exception {
    msg: string
}


export interface HeapElement {
    key: number;
    payload: any;
}