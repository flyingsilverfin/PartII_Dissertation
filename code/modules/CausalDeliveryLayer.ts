import * as NT from '../types/NetworkTypes';
import * as T from '../types/Types';

export default class CausalDeliveryLayer {


    // local vector clock
    private vclock: NT.VectorClock;
    private clientId: T.ClientId;
    private bufferedMessages: any;

    constructor(id: T.ClientId) {
        this.clientId = id;
        this.vclock = {};
        this.vclock[id] = 0;
        this.bufferedMessages = [];
    }

    // returns true if the message is new and needs to be broadcast again
    // false otherwise
    public receive(message: NT.NetworkPacket, action: () => void): boolean {
        if (message.origin === this.clientId) {
            return false;
        }


    }

    public getVector(): NT.VectorClock {

    }

    public setVector(v: NT.VectorClock): void {

    }

    public copyVector(): NT.VectorClock {

    }

    private isNewMessage(origin: T.ClientId, vector: NT.VectorClock): boolean {
        if (vector === {}) {    //unicast
            return true;
        }

        if (this.vclock[origin] === undefined) {
            this.vclock[origin] = vector[origin];
            return true;
        }

        if (this.isLaterThan(vector)) {
            return false;
        }

        return true;
    }

    private acceptNow(origin: T.ClientId, vector: NT.VectorClock): boolean {
        // accept now if what you've seen is exactly one more thing than what I've seen
        return this.vclock[this.clientId] + 1=== vector[origin];
    }

    private isCausallySatisfied(origin: T.ClientId, vector: NT.VectorClock): boolean {
        //
        return this.vclock[this.clientId] + 1 === vector[origin];
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

        if (l1 > l2) {
            return true;
        }
        if (l2 > l1) {
            return false;
        }
        // at this point they must have equal size
        for (let id in v1) {
            if (v1[id] > v2[id] || (gte && v1[id] === v2[id])) {
                return false;
            }
        }
        return true;
    }


}