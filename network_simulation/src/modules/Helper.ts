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