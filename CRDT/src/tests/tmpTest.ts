import * as tsUnit from 'tsunit.external/tsUnit';
import MapCRDT from '../modules/MapCRDT';

class MapCRDTTester extends tsUnit.TestClass {

    private emptyCRDT = new MapCRDT('1');

    readEmptyCRDT() {
            let linearizedCRDT = this.emptyCRDT.read();
            let crdtString = linearizedCRDT.charArray.join('');
            let expectedString = '';

            let crdtIDArray = linearizedCRDT.idArray;
            let expectedCRDTIdArray = ['0'];
            this.areIdentical(crdtString, expectedString);
            this.areIdentical(crdtIDArray, expectedCRDTIdArray);
        }

}

export default MapCRDTTester;