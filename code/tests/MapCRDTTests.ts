import * as tsUnit from 'tsunit.external/tsUnit';
import MapCRDT from '../modules/MapCRDT';
import * as CT from '../types/CRDTTypes';


class MapCRDTTester extends tsUnit.TestClass {

    private crdt: MapCRDT;

    readEmptyCRDT() {
        this.crdt = new MapCRDT();
        let linearizedCRDT = this.crdt.read();
        let crdtString = linearizedCRDT.charArray.join('');
        let expectedString = '';

        let crdtIDArray = linearizedCRDT.idArray;
        let expectedCRDTIdArray = ['0'];

        this.areIdentical(expectedString, crdtString);
        this.areCollectionsIdentical(expectedCRDTIdArray, crdtIDArray);
    }

    deleteUndefinedId() {
        this.crdt = new MapCRDT();
        let toDelete: CT.DeleteMessage = {
            deleteId: '2.1'
        }

        this.throws(() =>
            this.crdt.delete(toDelete), "Deleting nonexistant ID did not throw an error!");
    }

    deleteDefinedId() {
        this.crdt = new MapCRDT();
        let insert1: CT.InsertMessage = {
            after: '0',
            char: 'a',
            id: '1.1'
        };     
        let insert2: CT.InsertMessage = {
            after: '1.1',
            char: 'b',
            id: '2.1'
        };

        let toDelete: CT.DeleteMessage = {
            deleteId: '1.1'
        }

        this.crdt.insert(insert1);
        this.crdt.insert(insert2);
        this.crdt.delete(toDelete);

        let expectedCharArray = ['', 'b'];
        let expectedIdArray = ['0', '2.1'];

        let actual = this.crdt.read();
        this.areCollectionsIdentical(expectedCharArray, actual.charArray);
        this.areCollectionsIdentical(expectedIdArray, actual.idArray);
    }
    
    insertSingleCharacter() {
        this.crdt = new MapCRDT();
        let bundle: CT.InsertMessage = {
            after: '0',
            char: 'a',
            id: '1.1'
        };

        let expectedCharArray = ['', 'a'];
        let expectedIdArray = ['0', '1.1'];
  
        this.crdt.insert(bundle);
        let actual = this.crdt.read();

        this.areCollectionsIdentical(expectedCharArray, actual.charArray);
        this.areCollectionsIdentical(expectedIdArray, actual.idArray);
    }

    // standard case, one client inserts one character, followed by
    // same client entering another character
    insertConsecutiveTimestampsAfterEachOther() {
        this.crdt = new MapCRDT();
        let bundle1: CT.InsertMessage = {
            after: '0',
            char: 'a',
            id: '1.1'
        };
        let bundle2: CT.InsertMessage = {
            after: '1.1',
            char: 'b',
            id: '2.1'
        };

        let expectedCharArray = ['', 'a', 'b'];
        let expectedIdArray = ['0', '1.1', '2.1'];

        this.crdt.insert(bundle1);
        this.crdt.insert(bundle2);
        let actual = this.crdt.read();

        this.areCollectionsIdentical(expectedCharArray, actual.charArray);
        this.areCollectionsIdentical(expectedIdArray, actual.idArray);
    }

    // this case might arise when client 2 inserts far away with t = 1,
    // followed by an insert at '0' with t = 2
    // these events happen over a high latency link so that
    // client 1 does not update it's clock to t = 2 or t = 3
    // and concurrently inserts with t = 1 into '0'
    insertConsecutiveTimestampsConcurrently() {
        this.crdt = new MapCRDT();
        // time 1, from client 1
        let bundle1: CT.InsertMessage = {
            after: '0',
            char: 'a',
            id: '1.1'
        };
        // time 2, from client 2
        let bundle2: CT.InsertMessage = {
            after: '0',
            char: 'b',
            id: '2.2'
        };

        let expectedCharArray = ['', 'b', 'a'];
        let expectedIdArray = ['0', '2.2', '1.1'];

        this.crdt.insert(bundle1);
        this.crdt.insert(bundle2);
        let actual = this.crdt.read();

        this.areCollectionsIdentical(expectedCharArray, actual.charArray);
        this.areCollectionsIdentical(expectedIdArray, actual.idArray);
    }


    // following two tests model the case where
    // client 1 and client 2 insert into the same spot concurrently
    // this test makes sure that client 1's local crdt ends up correct
    insertSameTimestampsLowerIdFirst() {
        this.crdt = new MapCRDT();
        
        let bundle1: CT.InsertMessage = {
            after: '0',
            char: 'a',
            id: '1.1'
        };
        let bundle2: CT.InsertMessage = {
            after: '0',
            char: 'b',
            id: '1.2'
        };

        let expectedCharArray = ['','b','a'];
        let expectedIdArray = ['0', '1.2', '1.1'];

        this.crdt.insert(bundle1);
        this.crdt.insert(bundle2);
        let actual = this.crdt.read();

        this.areCollectionsIdentical(expectedCharArray, actual.charArray);
        this.areCollectionsIdentical(expectedIdArray, actual.idArray);
    }

    // works with previous test where
    // client 1 and client 2 insert into the same spot concurrently
    // this test makes sure that client 2's local crdt ends up the same
    insertSameTimestampsLowerIdSecond() {
        this.crdt = new MapCRDT();
        
        let bundle1: CT.InsertMessage = {
            after: '0',
            char: 'a',
            id: '1.1'
        };
        let bundle2: CT.InsertMessage = {
            after: '0',
            char: 'b',
            id: '1.2'
        };

        let expectedCharArray = ['','b','a'];
        let expectedIdArray = ['0', '1.2', '1.1'];

        this.crdt.insert(bundle2);
        this.crdt.insert(bundle1);
        let actual = this.crdt.read();

        this.areCollectionsIdentical(expectedCharArray, actual.charArray);
        this.areCollectionsIdentical(expectedIdArray, actual.idArray);
    }


    // following two tests model the case where 
    // client 2 has a large latency from client 1, client 1 has written
    // quite a lot of things in the meantime, and then client 2's
    // insert arrives at '0'
    insertDelayedLowerTimestamp() {
        this.crdt = new MapCRDT();
        
        let bundle1: CT.InsertMessage = {
            after: '0',
            char: 'a',
            id: '1.1'
        };
        let bundle2: CT.InsertMessage = {
            after: '1.1',
            char: 'b',
            id: '2.1'
        };
        let bundle3: CT.InsertMessage = {
            after: '2.1',
            char: 'c',
            id: '3.1'
        };
        let bundle4: CT.InsertMessage = {
            after: '0',
            char: 'z',
            id: '1.2'
        };

        let expectedCharArray = ['','z','a', 'b', 'c'];
        let expectedIdArray = ['0', '1.2', '1.1', '2.1', '3.1'];

        this.crdt.insert(bundle1);
        this.crdt.insert(bundle2);
        this.crdt.insert(bundle3);
        this.crdt.insert(bundle4);
        let actual = this.crdt.read();

        this.areCollectionsIdentical(expectedCharArray, actual.charArray);
        this.areCollectionsIdentical(expectedIdArray, actual.idArray);

    }
    
    // works with above case where 
    // client 1 has a large latency from client 2, client 1 has written
    // quite a lot of things but in the meantime client 2 has written at '0'
    // then client 1's inserts arrive at '0' with higher Timestamps
    // both cases should result in the same thing
    insertDelayedHigherTimestamp() {
        this.crdt = new MapCRDT();
        
        let bundle1: CT.InsertMessage = {
            after: '0',
            char: 'a',
            id: '1.1'
        };
        let bundle2: CT.InsertMessage = {
            after: '1.1',
            char: 'b',
            id: '2.1'
        };
        let bundle3: CT.InsertMessage = {
            after: '2.1',
            char: 'c',
            id: '3.1'
        };
        let bundle4: CT.InsertMessage = {
            after: '0',
            char: 'z',
            id: '1.2'
        };

        let expectedCharArray = ['','z','a', 'b', 'c'];
        let expectedIdArray = ['0', '1.2', '1.1', '2.1', '3.1'];

        this.crdt.insert(bundle4);
        this.crdt.insert(bundle1);
        this.crdt.insert(bundle2);
        this.crdt.insert(bundle3);
        let actual = this.crdt.read();

        this.areCollectionsIdentical(expectedCharArray, actual.charArray);
        this.areCollectionsIdentical(expectedIdArray, actual.idArray);

    }

    insertOneWord() {
        this.crdt = new MapCRDT();
        
        let bundle1: CT.InsertMessage = {
            after: '0',
            char: 'Hello',
            id: '1.1'
        };

        let expectedCharArray = ['','H','e','l','l','o'];
        let expectedIdArray = ['0', '1.1', '2.1', '3.1', '4.1', '5.1'];

        this.crdt.insert(bundle1);
        let actual = this.crdt.read();

        this.areCollectionsIdentical(expectedCharArray, actual.charArray);
        this.areCollectionsIdentical(expectedIdArray, actual.idArray);
    }

    insertTwoWordsConcurrently() {
        this.crdt = new MapCRDT();
        
        let bundle1: CT.InsertMessage = {
            after: '0',
            char: 'Hello',
            id: '1.1'
        }; 
        let bundle2: CT.InsertMessage = {
            after: '0',
            char: 'World',
            id: '1.2'
        };

        let expectedCharArray = ['','W','o','r','l','d', 'H','e','l','l','o'];
        let expectedIdArray = ['0', '1.2','2.2','3.2','4.2','5.2', '1.1', '2.1', '3.1', '4.1', '5.1'];

        this.crdt.insert(bundle1);
        this.crdt.insert(bundle2);
        let actual = this.crdt.read();

        this.areCollectionsIdentical(expectedCharArray, actual.charArray);
        this.areCollectionsIdentical(expectedIdArray, actual.idArray);
    }

}

export default MapCRDTTester;