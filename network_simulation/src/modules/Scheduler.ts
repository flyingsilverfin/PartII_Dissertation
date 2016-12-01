import {HeapElement} from '../types/Types';
import {now} from './Helper';

class Scheduler {

    private heap;
    private lastIntervalSetAt: number;

    constructor() {
        this.heap = new MinHeap();
    }


/*
    How to handle, if we already have a setTimeout running
    and a new event arrives with shorter timeout that the original (what about if it's about to expire and run?)

    probably want to use current actual time somehow here


*/
    public addEvent( time: number, action: any) {
        let heapElem: HeapElement = {
            key: time,
            payload: action
        };
        this.heap.insert(heapElem);

        // check this time against getTime - lastIntervalSetAt
    }

}

class MinHeap {

    private heap: HeapElement[];

    constructor(initialElements: HeapElement[] = []) {
        this.heap = initialElements;
        this.heapify();
    }

    public insert(elem: HeapElement) {
        this.heap.push(elem);
        this.bubbleUp(this.heap.length-1);
    }

    public decreaseAllKeysBy(t: number) {
        for (let elem of this.heap) {
            elem.key -= t;
        }
    }

    public peek(): HeapElement {
        return this.heap[0];
    }

    public take(): HeapElement {
        let elem = this.heap[0];
        this.swap(0, this.heap.length-1);
        delete this.heap[this.heap.length-1];
        this.siftDown(0);
        return elem;
    }

    private heapify(): void {
        // first parent that might not satisfy heap property
        // is parent(lastIndex) = (n-1)/2
        for (let i = this.parent(this.heap.length) - 1; i >= 0; i--) {
            this.siftDown(i);
        }
    }

    private siftDown(index: number): void {
        let largest = index;
        let rc = this.rightChild(index);
        let lc = this.leftChild(index);
        while (true) {
            if (rc < this.heap.length && this.heap[rc].key > this.heap[largest].key) {
                largest = rc;
            }
            if (lc < this.heap.length && this.heap[lc].key > this.heap[largest].key){
                largest = lc;
            }
            if (largest != index) {
                this.swap(largest, index);
                // repeat
                index = largest;    
                rc = this.rightChild(index);
                lc = this.leftChild(index);
            }
        }
    }

    private bubbleUp(index: number): void {
        let val = this.heap[index].key;
        let parent = this.parent(index);
        // base case: parent = index => equality and exit loop
        while (this.heap[parent].key < val) {
            this.swap(index, parent);
            index = parent;
            val = this.heap[index].key;
            parent = this.parent(index);
        }
    }

    private swap(i,j): void {
        let tmp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = tmp;
    }

    private parent(index: number): number {
        return Math.max(0,(index-1)/2);
    }

    private leftChild(index: number): number {
        return 2*index + 1;
    }

    private rightChild(index: number): number {
        return 2*index + 2;
    }
}