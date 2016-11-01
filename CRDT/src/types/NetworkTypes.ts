import * as CRDTTypes from './CRDTTypes';

export interface NetworkPacket {
    origin: string,
    bundle: CRDTTypes.InsertMessage | CRDTTypes.DeleteMessage
}