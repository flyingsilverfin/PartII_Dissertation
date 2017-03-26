import * as NT from '../types/NetworkTypes';
import * as T from '../types/Types';

export default class CausalDeliveryLayer {


    // local vector clock
    private vclock: NT.VectorClock;
    private clientId: T.ClientId;
    private n: number;  // tracks size of vclock;
    private bufferedMessages: any;

    constructor(id: T.ClientId) {
        this.clientId = id;
        this.vclock = {};
        this.vclock[id] = 0;
        this.n = 1;
        this.bufferedMessages = [];
    }

    // returns true if the message is new and needs to be broadcast again
    // false otherwise
    public receive(message: NT.NetworkPacket, action: () => void): boolean {
        console.log('Received message: ' + JSON.stringify(message));
        debugger
        if (message.origin === this.clientId) {
            return false;
        }

        if (!this.isNewMessage(message.origin, message.vector)) {
            return false;
        }

        if (Object.keys(message.vector).length === 0) { //unicast, just handle it here
            action();
            return true;
        }

        if (this.acceptNow(message.origin, message.vector)) {
            action();
            this.vclock[message.origin]++;  // update our vector to include this message
            this.checkForDeliveries();
        } else {
            this.bufferedMessages.push([message, action]);
        }


        return true;
    }

    // returns next vector
    public getNextVector(): NT.VectorClock {
        this.vclock[this.clientId]++;
        return this.copyVector();
    }

    public setVector(v: NT.VectorClock): void {
        if (v[this.clientId] === undefined) {
            v[this.clientId] = 0;
        }
        this.vclock = v;
    }

    public copyVector(): NT.VectorClock {
        let copy = {};
        for (let k in this.vclock) {
            copy[k] = this.vclock[k];
        }
        return copy;
    }

    // horribly inefficient right now, but whatever
    private checkForDeliveries(): void {
        let changed = true;
        while (changed) {
            changed = false;
            for (let [msg, action] of this.bufferedMessages) {
                if (this.acceptNow(msg.origin, msg.vector)) {
                    action();
                    this.vclock[msg.origin]++;  // update our vector to include this message
                    changed = true;
                }
            }
        }
    }

    private isNewMessage(origin: T.ClientId, vector: NT.VectorClock): boolean {
        if (this.vclock[origin] === undefined) {
            this.vclock[origin] = 0;
            this.n++;
        }

        if (Object.keys(vector).length === 0) {    //unicast
            return true;
        }



        if (this.isLaterThan(vector)) {
            return false;
        }

        return true;
    }


    // accept now or buffer
    private acceptNow(origin: T.ClientId, vector: NT.VectorClock): boolean {

        if (Object.keys(vector).length === 0) {    // unicast, accept immediately
            return true;
        }


        // accept now if this is the next expected message from origin and 
        // local is greater in all other things

        // we need the incoming vector to be + 1 of ours for 'origin'
        // and otherwise less than or equal to
        this.vclock[origin]++;
        let accept = this.vclock[origin] === vector[origin] && this.gt(this.vclock, vector, true);

        this.vclock[origin]--;

        return accept;
    }
    
    // mostly going to be used to reject seen-before messages
    // read as 'this(.)isgreaterthan a given vector'
    private isLaterThan(vector: NT.VectorClock): boolean {
        return this.gt(this.vclock, vector, true);
    }

    // last flag sets greater than or equal to
    private gt(v1: NT.VectorClock, v2: NT.VectorClock, gte=false): boolean {

        let l1 = Object.keys(v1).length;
        let l2 = Object.keys(v2).length;

        // if second vector contains something we've not seen, we can't be greater
        if (l2 > l1) {
            return false;
        }
        // at this point they must have equal size or v1 has more contents
        for (let id in v1) {
            // fail if any element in v1 is less than or if equals-to enabled, equal to
            if (v2[id] === undefined || v1[id] > v2[id] || (gte && v1[id] === v2[id])) {
               continue
            }
            return false;
        }
        return true;
    }


}