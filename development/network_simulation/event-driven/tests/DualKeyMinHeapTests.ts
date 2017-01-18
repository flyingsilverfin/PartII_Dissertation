import * as tsUnit from 'tsunit.external/tsUnit';
import DualKeyMinHeap from '../modules/DualKeyMinHeap';
import {DualKeyHeapElement} from '../types/Types';



class DualKeyMinHeapTests extends tsUnit.TestClass {
    
    private heap: DualKeyMinHeap;


    whenEmptyPeekTake() {
        this.heap = new DualKeyMinHeap();
        let expected = null;
        this.areIdentical(expected, this.heap.peek());
        this.areIdentical(expected, this.heap.take());
    }

    oneElementInsertPeekTake() {
        this.heap = new DualKeyMinHeap();
        let pKey = 10;
        let sKey = 0;
        let action = function() {
            console.log('oneElement test');
            return [pKey, sKey];
        }

        let heapElement: DualKeyHeapElement = {
            pKey: pKey,
            sKey: sKey,
            payload: action
        }

        this.heap.insert(heapElement);
        this.areIdentical(1, this.heap.size());


        // these should really trivially pass since we insert and take without any changes like decrease keys
        let peekElem: DualKeyHeapElement = this.heap.peek();
        this.areIdentical(1, this.heap.size());
        this.areIdentical(heapElement, peekElem);
        this.areIdentical(pKey, peekElem.pKey);
        this.areIdentical(sKey, peekElem.sKey)
        this.areCollectionsIdentical(action(), peekElem.payload());

        let takeElem: DualKeyHeapElement = this.heap.take();
        this.areIdentical(0, this.heap.size());
        this.areIdentical(heapElement, takeElem);

    }

    multipleElementInsertPeekTake() {
        this.heap = new DualKeyMinHeap();

        let heapElementGenerator = function(pKey, sKey) {
            let elem: DualKeyHeapElement = {
                    pKey: pKey,
                    sKey: sKey,
                    payload: function() { return [pKey, sKey]; }
            };
            return elem;
        }

        // insert in reverse order
        for (let i = 5; i >= 0; i--) {
            this.heap.insert(heapElementGenerator(i,i));
        }

        // expected to come out in order
        let expected = 0;
        while (!this.heap.empty()) {
            let taken = this.heap.take();
            this.areCollectionsIdentical([expected, expected], taken.payload());
            expected++;
        }
    }


    initializeWithArray() {
        let heapElementGenerator = function(pKey, sKey) {
            let elem: DualKeyHeapElement = {
                    pKey: pKey,
                    sKey: sKey,
                    payload: function() { return [pKey, sKey]; }
            };
            return elem;
        }

        // create array of DualKeyHeapElements
        let arr: DualKeyHeapElement[] = [];
        for (let i = 0; i < 5; i++) {
            arr.push(heapElementGenerator(i,0));
        }

        this.heap = new DualKeyMinHeap(arr);

        // expected to come out in order
        let expected = 0;
        while (!this.heap.empty()) {
            let taken = this.heap.take();
            this.areCollectionsIdentical([expected, 0], taken.payload());
            expected++;
        }
    }

    decreaseAllPrimaryKeysBy() {
        let heapElementGenerator = function(pKey, sKey) {
            let elem: DualKeyHeapElement = {
                    pKey: pKey,
                    sKey: sKey,
                    payload: function() { return [pKey, sKey]; }
            };
            return elem;
        }

        // create array of DualKeyHeapElements
        let arr: DualKeyHeapElement[] = [];
        for (let i = 50; i < 100; i+= 10) {
            arr.push(heapElementGenerator(i,0));
        }

        this.heap = new DualKeyMinHeap(arr);
        this.heap.decreaseAllPrimaryKeysBy(50);

        // expected to come out in order, offset by 50 now
        let expected = 0;
        while (!this.heap.empty()) {
            let taken = this.heap.take();
            this.areCollectionsIdentical([expected, 0], [taken.pKey, taken.sKey]);
            this.areCollectionsIdentical([expected+50, 0], taken.payload());
            expected += 10;
        }
    }

    sequenceOfOperations() {
        let heapElementGenerator = function(pKey, sKey) {
            let elem: DualKeyHeapElement = {
                    pKey: pKey,
                    sKey: sKey,
                    payload: function() { return [pKey, sKey]; }
            };
            return elem;
        }
        // create array of DualKeyHeapElements
        let arr: DualKeyHeapElement[] = [];
        for (let i = 50; i < 100; i+= 10) {
            arr.push(heapElementGenerator(i,0));
        }

        this.heap = new DualKeyMinHeap(arr);

        this.heap.take();
        this.heap.insert(heapElementGenerator(10,0));
        this.heap.insert(heapElementGenerator(110,0));

        this.heap.decreaseAllPrimaryKeysBy(10);
        
        let elem = this.heap.take();
        this.areIdentical(0, elem.pKey);
        this.areCollectionsIdentical([10,0], elem.payload());
        this.heap.take();
        this.heap.take();
        this.areIdentical(70, this.heap.take().pKey);
    }

    primaryKeysIdentical() {
        let heapElementGenerator = function(pKey, sKey) {
            let elem: DualKeyHeapElement = {
                    pKey: pKey,
                    sKey: sKey,
                    payload: function() { return [pKey, sKey]; }
            };
            return elem;
        }

        let elem1 = heapElementGenerator(10, 0);
        let elem2 = heapElementGenerator(10, 1);

        this.heap = new DualKeyMinHeap();
        this.heap.insert(elem1);
        this.heap.insert(elem2);

        this.areIdentical(0, this.heap.take().sKey);
        this.areIdentical(1, this.heap.take().sKey);
        this.areIdentical(null, this.heap.take());
    }


}

export default DualKeyMinHeapTests;