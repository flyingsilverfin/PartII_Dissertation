import * as tsUnit from 'tsunit.external/tsUnit';
import MapCRDT from '../modules/MapCRDT';


class MapCRDTTester extends tsUnit.TestClass {

    private emptyCRDT = new MapCRDT('1');

    readEmptyCRDT() {
            let crdtString = this.emptyCRDT.read();
            let expectedString = '';
            this.areIdentical(crdtString, expectedString);
        }

}

export default MapCRDTTester;