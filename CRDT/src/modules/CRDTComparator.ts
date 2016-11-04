import * as ST from '../types/SharedTypes';

export function compare(id1: string, id2: string) {

    if (id2 === null) {
        return 1;
    }

    let split1 = id1.split('.');
    let split2 = id2.split('.');
    let t1 = parseInt(split1[0]);
    let c1 = parseInt(split1[1]);
    let t2 = parseInt(split2[0]);
    let c2 = parseInt(split2[1]);
    
    // actual compare method
    if (t1 < t2) {
        return -1;
    } else if (t1 > t2) {
        return 1;
    } else {
        if (c1 < c2) {
            return -1;
        } else if (c1 > c2) {
            return 1;
        } else {
            console.error('[Comparator] identical IDs: ' + id1 + ', ' + id2);
            throw new ComparatorException('got an equal case in CRDT comparator - should be globally unique!');
        }
    }   
}


class ComparatorException implements ST.Exception {
    msg: string;
    constructor(msg) {
        this.msg = msg;
    }
}

