import * as CRDTTypes from './CRDTTypes';

export interface NetworkPacket {
    origin: string,
    type: "i" | "d",    // insert or delete
    bundle: CRDTTypes.InsertMessage | CRDTTypes.DeleteMessage
}