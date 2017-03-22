import * as CT from '../types/CRDTTypes';


/*
Got lazy writing it fully generically, now assumes keys are [number, number]

*/
export default class UniquePairMap<K,V> implements CT.UniquePairMap<K,V> {

    private map: Map<string, V>;

    // K needs to be a list of length 1
    constructor(x: any) {
        this.map = new Map<string, V>(x);
    }

    public get(p: K): V {
        let key = p[0] + '.' + p[1];
        return this.map.get(key);
    }

    public set(p: K, val: V): void {
        let key = p[0] + '.' + p[1];
        this.map.set(key, val);
    }

    public has(p: K): boolean {
        let key = p[0] + '.' + p[1];
        return this.map.has(key);
    }

    // got lazy here
    public keys(): [number, number][] {
        let keys = this.map.keys();
        let arr: [number, number][] = [];
        for (let k of keys) {
            let tmp = k.split('.');
            arr.push([parseInt(tmp[0]), parseInt(tmp[1])]);
        }
        return arr;
    }

    public size(): number {
        return this.map.size;
    }
}