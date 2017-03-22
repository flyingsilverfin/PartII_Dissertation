import * as T from '../types/Types';


export class ComparatorException implements T.Exception {
    msg: string;
    constructor(msg) {
        this.msg = msg;
    }
}

export class CRDTException implements T.Exception {
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

export class NoMoreNodesToAllocateException implements T.Exception {
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

export function insertIntoString(toInsert: string, index: number, s: string) {
    return s.substring(0, index) + toInsert + s.substring(index);
}

export function deleteAt(str: string, index: number) {
    return str.substring(0, index) + str.substring(index+1);
}


/* new as of switch to native Map() for MapCRDT */


// need to parametrize function for this to work
// it should be able to do type inference on the call though
// 
export function mapToJsonCompatible<K,V>(map: Map<K,V>): [K,V][] {
    return [...map];
}

// and its inverse
export function jsonToMap<K,V>(json: [K,V][]): Map<K,V> {
    return new Map(json);
}





export function fetchJSONFile(path, callback) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200 || httpRequest.status === 304) {
                var data = JSON.parse(httpRequest.responseText);
                if (callback) callback(data);
            }
        }
    };
    httpRequest.open('GET', path);
    httpRequest.send(); 
    console.log("HTTP GET Sent");
}

export function postObject(path, object) {
    var httpRequest = new XMLHttpRequest();

    httpRequest.open('POST', path, true);
    httpRequest.setRequestHeader('Content-type', 'application/json');
    httpRequest.onload = function () {
        // do something to response
        console.log("Posted data: " + JSON.stringify(object));
    };
    httpRequest.send(JSON.stringify(object));
}