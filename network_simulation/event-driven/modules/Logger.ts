import {now} from './Helper';
import Time from './Time';

import * as T from '../types/Types';
import * as NT from '../types/NetworkTypes';
import * as CRDTTypes from '../types/CRDTTypes';


export default class Logger {

    private t: Time;
    private l: string[];

    constructor(time=null) {
        if (time!==null) {
            this.t = time;
        } else {
            this.t = null;
        }
        this.l = [];
    }

    public log(tag: "join", msg: string) {
        let time = this.getTime();

        this.l.push( "[" + time + "]    " + "[" + tag + "]    " + msg);
    }


    public logPacket(sender: T.ClientId, receiver: T.ClientId, type: "sent" | "received", packet: NT.NetworkPacket) {
        let time = this.getTime();

        let packetType = packet.type;
        let bundle = packet.bundle;
        
        let msg;
        if (packetType === "i") {
            msg = 
                "Insert " + 
                (<CRDTTypes.InsertMessage>bundle).char + 
                " with id " +
                (<CRDTTypes.InsertMessage>bundle).id + 
                " after id " +
                (<CRDTTypes.InsertMessage>bundle).after;

        } else if (packetType === "d") {
            msg = 
                "Delete id " + 
                (<CRDTTypes.DeleteMessage>bundle).deleteId;

        } else {
            console.error("Logging a packet of neither insert nor delete type...");
            this.l.push("");
            return;
        }

        this.l.push(
            "[" + time + "]" +
            "[" + type + "]    " +
            sender + "    " +
            receiver + "    " +
            packetType + "    " +
            msg);
            
    }

    public writeLogToConsole(): void {
        console.log(JSON.stringify(this.l, null, 4));
    }

    private getTime(): string {
        let time;
        if (this.t === null) {
            time = now();
        } else {
            time = this.t.time();
        }
        return "" + time;
    }
}