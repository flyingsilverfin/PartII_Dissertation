import * as CT from '../types/CRDTTypes';
import {ComparatorException} from './Helper';

export function compare(id1: CT.id, id2: CT.id) {

    if (id2 === null) {
        return 1;
    }


    let t1 = id1[0];
    let c1 = id1[1];
    let t2 = id2[0];
    let c2 = id2[1];
    
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
