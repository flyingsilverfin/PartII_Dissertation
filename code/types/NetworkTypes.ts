import * as CRDTTypes from './CRDTTypes';
import * as T from './Types';
import NetworkInterface from '../modules/NetworkInterface';

export interface NetworkPacket {
    origin: string,
    type: "i" | "d"  | "ui" | "ud" | "ri" | "rd" |  "reqCRDT" | "retCRDT",    // insert or delete or request CRDT or return CRDT
    bundle: CRDTTypes.InsertMessage | CRDTTypes.DeleteMessage | CRDTTypes.UndoMessage | RequestCRDTMessage | ReturnCRDTMessage;
}

export interface RequestCRDTMessage {

}

export interface ReturnCRDTMessage {
    crdt: CRDTTypes.MapCRDTStore; //complicated CRDT Json but yay Typescript is working nicely here
}

export interface ClientMap {
    // [i: T.ClientId]: NetworkInterface;   // unfortunately can't do i: T.ClientId even though are same type underneath
    [i: number]: NetworkInterface;
}

export interface ClientLogicalCounterMap {
    [i: number]: number;
}

export interface NodeLatencies {
    [i: number]: Latency;
}

export interface Latency {
    latency: number
}