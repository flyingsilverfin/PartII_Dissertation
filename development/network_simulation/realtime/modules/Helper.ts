import * as T from '../types/Types';


export class ComparatorException implements T.Exception {
    msg: string;
    constructor(msg) {
        this.msg = msg;
    }
}

class CRDTException implements T.Exception {
    msg: string;
    constructor(msg) {
        this.msg = msg;
    }
}

export class DeleteNullIdCRDTException extends CRDTException {
    constructor(nullId) {
        super('Tried to delete nonexistent id: ' + nullId);
    }
}

export class FixedSizeTopologyException implements T.Exception {
    msg: string;
    constructor(msg) {
        this.msg = msg;
    }
}

export function now(): number { 
    return Date.now();
}

export function within(x:number, y:number, tolerance:number): boolean{
    return (Math.abs(x - y) <= tolerance);
}

export function initArrayWith(n: number, initWith: number): number[] {
    let arr = [];
    for (let i = 0; i < n; i++) {
        arr.push(initWith);
    }
    return arr;

    // not too worried about speed, more about readability and correctness and below isn't working...
    // return Array.apply(null, Array(n)).map(Number.prototype.valueOf,initWith);
}