import {HeapElement} from '../types/Types';
import {now} from './Helper';
import MinHeap from './MinHeap';


/*
    This scheduler uses setTimeout to make the simulation run at a certain (adjustable) speed
*/
export default class RealtimeScheduler {

    private heap: MinHeap;
    private nextTimeoutAt: number = null;
    private currentTimeoutHandle = null;
    private cancelTimerTolerance: number;

    private speed: number;

    /*
        At speed 1, everything is measured in milliseconds
    */

    constructor(timerTolerance = 40.0, simulationSpeed = 1.0) {
        this.heap = new MinHeap();
        this.speed = simulationSpeed;
        //timerTolerance comes in "unscaled" units
        // divide by speed to "scale" it into simulation speed equivalent
        this.cancelTimerTolerance = timerTolerance/simulationSpeed; // simulationSpeed scales everything
    }



    public clear() {
        clearTimeout(this.currentTimeoutHandle);
        this.currentTimeoutHandle = null;
        this.nextTimeoutAt = null;
        this.heap.clear();
    }

    public addEvent( time: number, action: any) {

        time = time/this.speed;

        let heapElem: HeapElement = {
            key: time,
            payload: action
        };
        this.heap.insert(heapElem);


        // check this time against getTime - lastIntervalSetAt
        let n = now();
        let self = this;    // for scoping


        if (this.currentTimeoutHandle === null) {
            this.scheduleNextEvent();
        } else {
            let remaining = this.nextTimeoutAt - n;

            // if this new event is to occur cancelTimerTolerance before the reminaing time
            // then delete the timer and add a new one for this event

            // TODO
            // this will break in some cases - ie scheduled for 30 ms from now, queue has one for 10 ms from now.
            // solution: decrease key in queue by scheduled event's key as usual
            //           then run all events at top of queue with negative keys
            //           ??? somehow handle those in queue with same timestamp and the actual event
            if (time + this.cancelTimerTolerance < remaining) {
                clearTimeout(this.currentTimeoutHandle);
                this.currentTimeoutHandle = setTimeout(
                    function() {
                        self.runEvent(action);
                        self.heap.decreaseAllKeysBy(time);
                        self.runReadyEvents();
                        self.scheduleNextEvent();
                    }, time);
                this.nextTimeoutAt = n + time;
            }
        }
    }

    private scheduleNextEvent() {
        let self = this;
        if (this.heap.empty()) {
            return;
        }
        let top = this.heap.take();
        this.currentTimeoutHandle = setTimeout( 
            function() {
                self.runEvent(top.payload);
                self.heap.decreaseAllKeysBy(top.key);
                self.runReadyEvents();
                self.scheduleNextEvent();
            }, top.key);
        this.nextTimeoutAt = now() + top.key;
    }

    private runEvent(action) {
        action();
    }

    private runReadyEvents() {
        // process any other events from the queue that need to be run
        while (!this.heap.empty() && this.heap.peek().key <= 0) {
            let elem = this.heap.take();
            elem.payload();
        }
    }
}