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

    public addEvent(time: number, action: any) {

        time = time/this.speed;

        let heapElem: HeapElement = {
            key: time,
            payload: action
        };
        this.heap.insert(heapElem);


        // check this time against getTime - lastIntervalSetAt
        let n = now();
        let self = this;    // for scoping

        // start a new timer if there wasn't one before
        if (this.currentTimeoutHandle === null) {
            this.scheduleNextEvent();
        } else {
            let remaining = this.nextTimeoutAt - n;

            // if this new event is to occur cancelTimerTolerance before the reminaing time
            // then delete the timer and add a new one for this event


            // TODO
            // this will break in some cases - ie schedule for 30 ms from now, queue has one for 10 ms from now.
            // solution: decrease key in queue by scheduled event's key as usual
            //           then run all events at top of queue with negative keys
            //           ??? somehow handle those in queue with same timestamp and the actual event
            if (time + this.cancelTimerTolerance < remaining) {
                clearTimeout(this.currentTimeoutHandle);
                this.currentTimeoutHandle = setTimeout(
                    function() {
                        self.timerExpired(time);
                        self.scheduleNextEvent();
                    }, time);
                this.nextTimeoutAt = n + time;
            }
        }
    }

    private timerExpired(timeElapsed): void {
        this.heap.decreaseAllKeysBy(timeElapsed);
        this.runReadyEvents();
    }

    private scheduleNextEvent() {
        let self = this;

        if (this.heap.empty()) {
            this.nextTimeoutAt = null;
            this.currentTimeoutHandle = null;
            return;
        }

        let toutIn = this.heap.peek().key;
        this.nextTimeoutAt = now() + toutIn;

        this.currentTimeoutHandle = setTimeout( 
            function() {
                self.timerExpired(toutIn);
                self.scheduleNextEvent();
            }, toutIn);

    }

    private runReadyEvents() {
        // process any other events from the queue that need to be run
        while (!this.heap.empty() && this.heap.peek().key <= 0) {
            let elem = this.heap.take();
            elem.payload();
        }
    }
}