import * as NT from '../types/NetworkTypes';
import * as T from '../types/Types';
import MessageBuffer from './MessageBuffer';
import * as Helper from './Helper';
import {gt} from './VectorComparators';

export default class CausalDeliveryLayer {


    // local vector clock
    private vclock: NT.VectorClock;
    private clientId: T.ClientId;
    private n: number;  // tracks size of vclock;
    private bufferedMessages: MessageBuffer;

    constructor(id: T.ClientId) {
        this.clientId = id;
        this.vclock = {};
        this.vclock[id] = 0;
        this.n = 1;
        this.bufferedMessages = new MessageBuffer(); 
    }

    // returns true if the message is new and needs to be broadcast again
    // false otherwise
    public receive(message: NT.NetworkPacket, action: () => void): boolean {
        //console.log('Received message: ' + JSON.stringify(message));
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

        let negativeDeltas = this.acceptNow(message.origin, message.vector);

        if (Object.keys(negativeDeltas).length === 0) {
            action();
            this.vclock[message.origin]++;  // update our vector to include this message
            this.bufferedMessages.update(message.origin, this.vclock);   // check for further messages to deliver efficiently
        } else {
            this.bufferedMessages.add(message, action, negativeDeltas);
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

    public peekNextVector(): NT.VectorClock {
        let copy = {};
        for (let k in this.vclock) {
            copy[k] = this.vclock[k];
        }
        copy[this.clientId]++;
        return copy;
    }

    // takes in the client id from which we just got an in order message
    private checkForDeliveries(newMessageFrom: T.ClientId): void {

        /*
        let changed = true;
        let newDelivery = 
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
        */
    }

    private isNewMessage(origin: T.ClientId, vector: NT.VectorClock): boolean {
        if (this.vclock[origin] === undefined) {
            this.vclock[origin] = 0;
            this.n++;
        }

        // update local vector clock with unseen client, set to 0
        for (let id in vector) {
            if (this.vclock[id] === undefined) {
                this.vclock[id] = 0;
            }
        }

        return Object.keys(vector).length === 0 || (!this.bufferedMessages.contains(origin, vector) && !this.isLaterThan(vector));

    }


    // accept now or buffer
    private acceptNow(origin: T.ClientId, vector: NT.VectorClock): NT.VectorClock {

        // accept now if this is the next expected message from origin and 
        // local is greater in all other things

        // we need the incoming vector to be + 1 of ours for 'origin'
        // and otherwise less than or equal to
        this.vclock[origin]++;
        let negDeltas = this.negativeDeltas(this.vclock, vector);

        //let accept = this.vclock[origin] === vector[origin] && !anyNegative;

        this.vclock[origin]--;

        return negDeltas;
    }



    // mostly going to be used to reject seen-before messages
    // read as 'this(.)isgreaterthan a given vector'
    private isLaterThan(vector: NT.VectorClock): boolean {
        return gt(this.vclock, vector, true);
    }


    // return the delta of any of that are < 0
    private negativeDeltas(v1: NT.VectorClock, v2: NT.VectorClock): NT.VectorClock {

        let vc: NT.VectorClock = {};

        let k1 = Object.keys(v1);
        let k2 = Object.keys(v2);
        // let all = new Set(k1.concat(k2));
        
        for (let id of k1) {
            //assume 0 for ones v1 doesn't contain
            if (v1[id] === undefined && v2[id] > 0) {
                vc[id] = -1 * v2[id];
            } else if (v1[id] !== undefined && v1[id] - v2[id] < 0) {
                vc[id] = v1[id] - v2[id];
            }
        }

        return vc;

    }


}