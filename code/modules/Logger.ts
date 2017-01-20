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

    public log(tag: "join" | "memory", msg: string) {
        let time = this.getTime();
        this.l.push(time + "    " + tag + "    " + msg);
    }


    // logs [time] [type] sender receiver type id __msg__
    public logPacket(sender: T.ClientId, receiver: T.ClientId, type: "sent" | "received", packet: NT.NetworkPacket) {
        let time = this.getTime();

        let packetType = packet.type;
        let readablePacketType;
        let bundle = packet.bundle;
        
        let msg;
        if (packetType === "i") {
            readablePacketType = "insert"; // for logging
            msg = 
                (<CRDTTypes.InsertMessage>bundle).char +
                "    " +
                (<CRDTTypes.InsertMessage>bundle).id +
                "    " +
                (<CRDTTypes.InsertMessage>bundle).after;
        } else if (packetType === "d") {
            readablePacketType = "delete"; // for logging
            msg = 
                (<CRDTTypes.DeleteMessage>bundle).deleteId
        } else {
            console.error("Logging a packet of neither insert nor delete type...");
            this.l.push("");
            return;
        }

        this.l.push(
            time + "    " +
            type + "    " +
            sender + "    " +
            receiver + "    " +
            readablePacketType + "    " +
            msg);
            
    }

    public logMemory(when: "pre-experiment" |
                           "post-topology-init" | 
                           "post-graph-init" |
                           "post-clients-init" |
                           "post-experiment"
                    ): void {
        // note: must now be a chrome > 20 instance running experiment
        let memory = (<any>window.performance).memory.usedJSHeapSize;
        this.log("memory", memory + "    " + when);
    }

    public writeLogToConsole(): void {
        console.log(JSON.stringify(this.l, null, 4));
    }

    public getLog(): string[] {
        return this.l;
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