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
    // WARNING: RELATIVE TIME ie. adds event in 'time' timesteps from now!
    public addEvent(time: number, logicalClock: number, action: any) {

        let heapElem: DualKeyHeapElement = {
            // pKey: time + this.getTime(),
            pKey: time,
            sKey: logicalClock,
            payload: action
        };
        this.heap.insert(heapElem);


        // this.runReadyEvents();
    }


    /*
        Run those events with t <= 0
    */
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
        debugger
        this.time.forward(dt);
        this.heap.decreaseAllPrimaryKeysBy(dt);
        elem.payload();
        //this.runReadyEvents();
    }

    public areEventsScheduled() {
        return !this.heap.empty();
    }

    public getTime(): number {
        return this.time.time();
    }
}