import * as CT from '../types/CRDTTypes';
import * as C from '../types/ClientTypes';
import MapCRDT from '../modules/MapCRDT';

class Client implements C.Client {

    private id: string;
    private ds: CT.CRDT;

    constructor() {

        // 1 in a million collision... Would probably have the bootstrapping server hand out unique ID's
        this.id = Math.round(Math.random()*1000000).toString();

        this.ds = new MapCRDT(this.id);
    }

    


}


export default Client;