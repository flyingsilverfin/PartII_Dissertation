import * as CRDTTypes from './CRDTTypes';
import * as T from './Types';
import NetworkInterface from '../modules/NetworkInterface';

export interface NetworkPacket extends PreparedPacket {
    v: VectorClock,
    o: number
}

export interface PreparedPacket {
    t: "bi" | "i" | "d"  | "ui" | "ud" | "ri" | "rd" |  "reqCRDT" | "retCRDT",    // insert or delete or request CRDT or return CRDT
    b: CRDTTypes.BundledInsertMessage | CRDTTypes.InsertMessage | CRDTTypes.DeleteMessage | CRDTTypes.UndoMessage | RequestCRDTMessage | ReturnCRDTMessage;
}

export interface RequestCRDTMessage {

}

export interface ReturnCRDTMessage {
    crdt: CRDTTypes.MapCRDTStore, //complicated CRDT Json but yay Typescript is working nicely here
    currentVector: VectorClock;
}

export interface VectorClock  {
    [i : number] : number;
}

// for network manager to map to NetworkInterface objects
export interface ClientMap {
    // [i: T.ClientId]: NetworkInterface;   // unfortunately can't do i: T.ClientId even though are same type underneath
    [i: number]: NetworkInterface;
}

// for network manager, guarantees inorder delivery
export interface ClientLogicalCounterMap {
    [i: number]: number;
}

export interface NodeLatencies {
    [i: number]: Latency;
}

export interface Latency {
    latency: number
}