import * as tsUnit from 'tsunit.external/tsUnit';
import {compare} from '../modules/CRDTComparator';


/*
    Note that the lamport clock is defined as:
    "timestamp.clientId"
*/

class CRDTComparatorTester extends tsUnit.TestClass {
    
    nullSecondId() {
        let id1 = '1.0';
        let id2 = null;

        // define null to be less than any other
        // this is because we move forward until we hit a lesser ID
        let expected = 1;

        this.areIdentical(expected, compare(id1, id2));
    }

    firstTimestampLower() {
        let id1 = '1.0';
        let id2 = '2.0';

        // id1 is less than id2
        let expected = -1;
        this.areIdentical(expected, compare(id1, id2));
    }

    secondTimestampLower() {
        let id1 = '2.0';
        let id2 = '1.0';

        //id1 is greater than id2
        let expected = 1;
        this.areIdentical(expected, compare(id1, id2));
    }

    sameLamportValueThrowsError() {
        let id1 = '2.1';
        let id2 = '2.1';
        
        this.throws(() =>
            compare(id1, id2), 'Identical Lamport clocks did not throw error');
    }

    sameTimestampFirstClientLower() {
        let id1 = '1.1';
        let id2 = '1.2';

        let expected = -1;
        this.areIdentical(expected, compare(id1, id2));
    }

    sameTimestampSecondClientLower() {
        let id1 = '1.2';
        let id2 = '1.1';

        let expected = 1;
        this.areIdentical(expected, compare(id1, id2));
    }

}

export default CRDTComparatorTester;