import * as T from '../types/Types';



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

export function fetchJSONFile(path, callback) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200) {
                var data = JSON.parse(httpRequest.responseText);
                if (callback) callback(data);
            }
        }
    };
    httpRequest.open('GET', path);
    httpRequest.send(); 
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