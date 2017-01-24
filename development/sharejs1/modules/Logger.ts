import {now} from './Helper';
import * as T from '../types/Types';
import Time from '../modules/Time'; // dummy 


export default class Logger {

    private l: string[];
    private t: Time;

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


    public logPacket(sender: T.ClientId, receiver: T.ClientId, type: "sent" | "received", data: any) {
        let time = this.getTime();

        let version = data.v;
        let readablePacketType = 'sharejs-op';
        
        let msg = JSON.stringify(data);

        let bundleSize = msg.length;

        this.l.push(
            time + "    " +
            type + "    " +
            sender + "    " +
            receiver + "    " +
            readablePacketType + "    " +
            bundleSize + "    " +
            msg);
    }


    public logMemory(when: "pre-experiment" |
                           "post-topology-init" | 
                           "post-graph-init" |
                           "post-clients-create" |
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