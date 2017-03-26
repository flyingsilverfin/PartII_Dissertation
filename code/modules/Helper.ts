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

export class NoUndosAvailableException implements T.Exception {
    msg: string;
    constructor(msg) {
        this.msg = msg;
    }
}

export class NoRedosAvailableException implements T.Exception {
    msg: string;
    constructor(msg) {
        this.msg = msg;
    }
}


export function now(): number { 
    return Date.now();
}


export function assert(condition, message): void {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
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

export function remove(arr: any[], index: number) {
    arr.splice(index, 1);
    return arr;
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