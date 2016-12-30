import {HeapElement} from '../types/Types';


export default class MinHeap {

    private heap: HeapElement[];

    constructor(initialElements: HeapElement[] = []) {
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
        if (this.heap.length === 0) {
            return null;
        }
        return this.heap[0];
    }

    public take(): HeapElement {
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
            if (rc < this.heap.length && this.heap[rc].key < this.heap[smallest].key) {
                smallest = rc;
            }
            if (lc < this.heap.length && this.heap[lc].key < this.heap[smallest].key){
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


//NOT WORKING // TODO
    private bubbleUp(index: number): void {

        let val = this.heap[index].key;
        let parent = this.parent(index);
        // base case: parent = index => equality and exit loop
        while (this.heap[parent].key > val) {
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
        return Math.max(0,Math.floor((index-1)/2));
    }

    private leftChild(index: number): number {
        return 2*index + 1;
    }

    private rightChild(index: number): number {
        return 2*index + 2;
    }
}