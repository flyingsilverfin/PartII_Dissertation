import {DualKeyHeapElement} from '../types/Types';
import DualKeyMinHeap from './DualKeyMinHeap';
import Time from './Time';

export default class EventDrivenScheduler {

    private heap: DualKeyMinHeap;

    private time: Time;

    constructor(time) {
        this.heap = new DualKeyMinHeap();
        this.time = time;
    }


    public clear() {
        this.heap.clear();
    }

    // logical clock is for resolving packets to correct order if they were sent in same timestamp
    public addEvent(time: number, logicalClock: number, action: any) {

        let heapElem: DualKeyHeapElement = {
            pKey: time,
            sKey: logicalClock,
            payload: action
        };
        this.heap.insert(heapElem);


        // this.runReadyEvents();
    }


    public runReadyEvents() {
        // process any other events from the queue that need to be run
        while (!this.heap.empty() && this.heap.peek().pKey <= 0) {
            let elem = this.heap.take();
            elem.payload();
        }
    }

    public run() {
        let elem = this.heap.take();
        let dt = elem.pKey;
        this.time.forward(dt);
        this.heap.decreaseAllPrimaryKeysBy(dt);
        elem.payload();

    }

    public areEventsScheduled() {
        return this.heap.empty();
    }
}