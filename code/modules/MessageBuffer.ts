import * as NT from '../types/NetworkTypes';
import * as T from '../types/Types';
import * as Helper from './Helper';

export default class MessageBuffer {

    private dependencyMap;
    private containsMap;
    private buffer;


    constructor() {
        this.dependencyMap = {};    // map from client ID to [delta, [origin, seq num]][]
        this.containsMap = {};      // simple map from origin to seq num to see what we have since we can't use new [origin, seq num] to look up in buffer
        this.buffer = new Map();    // map from [origin, seq num] to [number, [msg, action]], number is how many dependencies in total are to be fulfilled
    }

    // takes a client ID for which to decrement all dependents
    // and a pointer to the vector clock that must be updated on delayed delivery
    public update(toDecrement: T.ClientId, vclockReference: NT.VectorClock): void {
        if (this.dependencyMap[toDecrement] === undefined) {
            return;
        }

        for (let i = this.dependencyMap[toDecrement].length - 1; i >= 0; i--) {
            let value = this.dependencyMap[toDecrement][i]; // [num dependencies on toDecrement, key]
            value[0]--;
            let key = value[1];

            // remove this dependency if fulfiled
            if (value[0] == 0) {
                Helper.remove(this.dependencyMap[toDecrement], i);  //splice out array location
            }

            let vals = this.buffer.get(key);
            vals[0]--;  //decrement total dependencies by one
            if (vals[0] === 0) {    // if all dependenciesare fulfilled
                console.log("Dependencies fulfilled for msg from " + key[0] + ", with seq num: " + key[1]);
                vals[1][1]();       // execute action!
                this.buffer.delete(key);    // remove it from the buffer
                this.containsMap[key[0]].delete(key[1]);   //remove it from the quick access origin:Set(seq numbers) map

                vclockReference[key[0]]++;
                this.update(key[0], vclockReference);    //check if further dependencies have been satisfied
            }
        }
    }

    // delta is all the packets are are required to arrive before this msg can be delivered
    // all the negative values in the difference between local clock and incoming vector
    // identical in form to vector clock
    public add(msg: NT.NetworkPacket, action: () => void, delta: NT.VectorClock) {
        if (this.containsMap[msg.origin] === undefined) {
            this.containsMap[msg.origin] = new Set();
        }
        this.containsMap[msg.origin].add(msg.vector[msg.origin]);

        let key = [msg.origin, msg.vector[msg.origin]];

        let totalDependents = 0;
        for (let dependencyId in delta) {
            let missing = -1 * delta[dependencyId];
            if (this.dependencyMap[dependencyId] === undefined) {
                this.dependencyMap[dependencyId] = [[missing, key]];
            } else {
                this.dependencyMap[dependencyId].push([missing, key]);
            }
            // this.dependencyMap[dependencyId][0] = missing;
            totalDependents += missing;
        }
        
        this.buffer.set(key, [totalDependents,[msg, action]]);

    }


    public contains(origin: T.ClientId, vector: NT.VectorClock): boolean {
        return this.containsMap[origin] !== undefined && this.containsMap[origin].has(vector[origin]);        
    }



}