import * as NT from '../types/NetworkTypes';

// last flag sets greater than or equal to
export function gt(v1: NT.VectorClock, v2: NT.VectorClock, gte=false): boolean {

    let l1 = Object.keys(v1).length;
    let l2 = Object.keys(v2).length;

    // if second vector contains something we've not seen, expand v1 with the missing elements, making local copy first to avoid side effects
    let missingElements = {};
    if (l2 > l1) {
        for (let id in v2) {
            if (v1[id] == undefined) {
                missingElements[id] = 0;
            }
        }
    }
    v1 = Object.assign({}, v1, missingElements);
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

export function areConcurrent(v1: NT.VectorClock, v2: NT.VectorClock): boolean {

    let k1 = Object.keys(v1);
    let k2 = Object.keys(v2);
    let allKeys = new Set(k1.concat(k2));

    // booleans to track if we have found an element from each which is greater than the corresponding one in the other vector
    let v1Greater = false;
    let v2Greater = false;


    for (let id of allKeys) {
        if (v1[id] === undefined && v2[id] > 0) {
            v2Greater = true;
            continue;
        }
        if (v2[id] === undefined && v1[id] > 0) {
            v1Greater = true;
            continue;
        }

        if (v1[id] > v2[id]) {
            v1Greater = true;
        } else if (v2[id] > v1[id]) {
            v2Greater = true;
        }
        
        
        if (v1Greater && v2Greater) {   // found one of each, DONE, abort loop early
            return true;
        }
    }
    return v1Greater && v2Greater;  // since we could have finished loop without the check inside
}