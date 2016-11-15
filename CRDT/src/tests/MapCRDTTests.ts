import * as tsUnit from 'tsunit.external/tsUnit';
import MapCRDT from '../modules/MapCRDT';
import * as CT from '../types/CRDTTypes';


class MapCRDTTester extends tsUnit.TestClass {

    private crdt;

    readEmptyCRDT() {
        this.crdt = new MapCRDT('1');
        let linearizedCRDT = this.crdt.read();
        let crdtString = linearizedCRDT.charArray.join('');
        let expectedString = '';

        let crdtIDArray = linearizedCRDT.idArray;
        let expectedCRDTIdArray = ['0'];

        this.areIdentical(expectedString, crdtString);
        this.areCollectionsIdentical(expectedCRDTIdArray, crdtIDArray);
    }

    deleteUndefinedId() {
        this.crdt = new MapCRDT('1');
        let toDelete: CT.DeleteMessage = {
            deleteId: '2.1'
        }

        this.throws(() =>
            this.crdt.delete(toDelete), "Deleting nonexistant ID did not throw an error!");
    }

    

    // TODO
    //  insert and all it's variants
    


}

export default MapCRDTTester;