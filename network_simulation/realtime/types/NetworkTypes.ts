import * as CRDTTypes from './CRDTTypes';
import * as T from './Types';
import NetworkInterface from '../modules/NetworkInterface';

export interface NetworkPacket {
    origin: string,
    type: "i" | "d",    // insert or delete
    bundle: CRDTTypes.InsertMessage | CRDTTypes.DeleteMessage
}

export interface ClientMap {
    // [i: T.ClientId]: NetworkInterface;   // unfortunately can't do i: T.ClientId even though are same type underneath
    [i: number]: NetworkInterface;
}

export interface ClientLogicalCounterMap {
    [i: number]: number;
}