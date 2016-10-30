import * as CT from '../types/CRDTTypes';
import MapCRDTDatastructure from '../modules/MapCRDTDatastructure';

class Client {

    private ds: CT.CRDTDatastructure;

    constructor() {

        this.ds = new MapCRDTDatastructure(123);
    }



}


export default Client;