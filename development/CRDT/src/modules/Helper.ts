import * as ST from '../types/SharedTypes';


export class ComparatorException implements ST.Exception {
    msg: string;
    constructor(msg) {
        this.msg = msg;
    }
}

class CRDTException implements ST.Exception {
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

