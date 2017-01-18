import * as tsUnit from 'tsunit.external/tsUnit';
import MinHeap from '../modules/MinHeap';
import {HeapElement} from '../types/Types';



class MinHeapTests extends tsUnit.TestClass {
    
    private heap: MinHeap;


    whenEmptyPeekTake() {
        this.heap = new MinHeap();
        let expected = null;
        this.areIdentical(expected, this.heap.peek());
        this.areIdentical(expected, this.heap.take());
    }

    oneElementInsertPeekTake() {
        this.heap = new MinHeap();
        let key = 10;
        let action = function() {
            console.log('oneElement test');
            return 10;
        }

        let heapElement: HeapElement = {
            key: key,
            payload: action
        }

        this.heap.insert(heapElement);
        this.areIdentical(1, this.heap.size());


        // these should really trivially pass since we insert and take without any changes like decrease keys
        let peekElem: HeapElement = this.heap.peek();
        this.areIdentical(1, this.heap.size());
        this.areIdentical(heapElement, peekElem);
        this.areIdentical(key, peekElem.key);
        this.areIdentical(action(), peekElem.payload());

        let takeElem: HeapElement = this.heap.take();
        this.areIdentical(0, this.heap.size());
        this.areIdentical(heapElement, takeElem);

    }

    multipleElementInsertPeekTake() {
        this.heap = new MinHeap();

        let heapElementGenerator = function(key) {
            let elem: HeapElement = {
                    key: key,
                    payload: function() { return key; }
            };
            return elem;
        }

        // insert in reverse order
        for (let i = 5; i >= 0; i--) {
            this.heap.insert(heapElementGenerator(i));
        }

        // expected to come out in order
        let expected = 0;
        while (!this.heap.empty()) {
            let taken = this.heap.take();
            this.areIdentical(expected, taken.payload());
            expected++;
        }
    }


    initializeWithArray() {
        let heapElementGenerator = function(key) {
            let elem: HeapElement = {
                    key: key,
                    payload: function() { return key; }
            };
            return elem;
        }

        // create array of HeapElements
        let arr: HeapElement[] = [];
        for (let i = 0; i < 5; i++) {
            arr.push(heapElementGenerator(i));
        }

        this.heap = new MinHeap(arr);

        // expected to come out in order
        let expected = 0;
        while (!this.heap.empty()) {
            let taken = this.heap.take();
            this.areIdentical(expected, taken.payload());
            expected++;
        }
    }

    decreaseAllKeysBy() {
        let heapElementGenerator = function(key) {
            let elem: HeapElement = {
                    key: key,
                    payload: function() { return key; }
            };
            return elem;
        }

        // create array of HeapElements
        let arr: HeapElement[] = [];
        for (let i = 50; i < 100; i+= 10) {
            arr.push(heapElementGenerator(i));
        }

        this.heap = new MinHeap(arr);
        this.heap.decreaseAllKeysBy(50);

        // expected to come out in order, offset by 50 now
        let expected = 0;
        while (!this.heap.empty()) {
            let taken = this.heap.take();
            this.areIdentical(expected, taken.key);
            this.areIdentical(expected+50, taken.payload());
            expected += 10;
        }
    }

    sequenceOfOperations() {
        let heapElementGenerator = function(key) {
            let elem: HeapElement = {
                    key: key,
                    payload: function() { return key; }
            };
            return elem;
        }
        // create array of HeapElements
        let arr: HeapElement[] = [];
        for (let i = 50; i < 100; i+= 10) {
            arr.push(heapElementGenerator(i));
        }

        this.heap = new MinHeap(arr);

        this.heap.take();
        this.heap.insert(heapElementGenerator(10));
        this.heap.insert(heapElementGenerator(110));

        this.heap.decreaseAllKeysBy(10);
        
        let elem = this.heap.take();
        this.areIdentical(0, elem.key);
        this.areIdentical(10, elem.payload());
        this.heap.take();
        this.heap.take();
        this.areIdentical(70, this.heap.take().key);
    }

}

export default MinHeapTests;