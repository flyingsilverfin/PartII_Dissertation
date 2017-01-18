import {DualKeyHeapElement} from '../types/Types';


// returns True if first elem is less than second, False if greater than or equal to
function dualKeyHeapElemLessThan(x: DualKeyHeapElement, y: DualKeyHeapElement) {
    if (x.pKey < y.pKey || (x.pKey === y.pKey && x.sKey < y.sKey)) {
        return true;
    } else {
        return false;
    }
}

export default class DualKeyMinHeap {

    private heap: DualKeyHeapElement[];

    constructor(initialElements: DualKeyHeapElement[] = []) {
        this.heap = initialElements;
        this.heapify();
    }

    public clear(): void {
        this.heap = [];
    }

    public empty(): boolean {
        return this.heap.length === 0;
    }

    public size(): number {
        return this.heap.length;
    }

    public insert(elem: DualKeyHeapElement) {
        this.heap.push(elem);
        this.bubbleUp(this.heap.length-1);
    }

    public decreaseAllPrimaryKeysBy(t: number) {
        for (let elem of this.heap) {
            elem.pKey -= t;
        }
    }

    public peek(): DualKeyHeapElement {
        if (this.heap.length === 0) {
            return null;
        }
        return this.heap[0];
    }

    public take(): DualKeyHeapElement {
        if (this.heap.length === 0) {
            return null;
        }
        let elem = this.heap[0];
        this.swap(0, this.heap.length-1);
        //delete this.heap[this.heap.length-1];
        this.heap.splice(this.heap.length-1, 1);
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
        let smallest = index;
        let rc = this.rightChild(index);
        let lc = this.leftChild(index);
        while (true) {
            if (rc < this.heap.length && dualKeyHeapElemLessThan(this.heap[rc], this.heap[smallest])) {
                smallest = rc;
            }
            if (lc < this.heap.length && dualKeyHeapElemLessThan(this.heap[lc], this.heap[smallest])) {
                smallest = lc;
            }
            if (smallest != index) {
                this.swap(smallest, index);
                // repeat
                index = smallest;    
                rc = this.rightChild(index);
                lc = this.leftChild(index);
            } else {
                break;
            }
        }
    }

    private bubbleUp(index: number): void {

        let parent = this.parent(index);
        // base case: parent = index => equality and exit loop
        while (dualKeyHeapElemLessThan(this.heap[index], this.heap[parent])) {
            this.swap(index, parent);
            index = parent;
            parent = this.parent(index);
        }
    }

    private swap(i,j): void {
        let tmp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = tmp;
    }

    private parent(index: number): number {
        return Math.max(0,Math.floor((index-1)/2));
    }

    private leftChild(index: number): number {
        return 2*index + 1;
    }

    private rightChild(index: number): number {
        return 2*index + 2;
    }
}