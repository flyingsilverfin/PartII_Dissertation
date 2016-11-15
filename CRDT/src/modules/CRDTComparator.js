"use strict";
function compare(id1, id2) {
    if (id2 === null) {
        return 1;
    }
    var split1 = id1.split('.');
    var split2 = id2.split('.');
    var t1 = parseInt(split1[0]);
    var c1 = parseInt(split1[1]);
    var t2 = parseInt(split2[0]);
    var c2 = parseInt(split2[1]);
    // actual compare method
    if (t1 < t2) {
        return -1;
    }
    else if (t1 > t2) {
        return 1;
    }
    else {
        if (c1 < c2) {
            return -1;
        }
        else if (c1 > c2) {
            return 1;
        }
        else {
            console.error('[Comparator] identical IDs: ' + id1 + ', ' + id2);
            throw new ComparatorException('got an equal case in CRDT comparator - should be globally unique!');
        }
    }
}
exports.compare = compare;
var ComparatorException = (function () {
    function ComparatorException(msg) {
        this.msg = msg;
    }
    return ComparatorException;
}());
