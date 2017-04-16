import {now} from './Helper';
import {DualKeyHeapElement} from '../types/Types';
import DualKeyMinHeap from './DualKeyMinHeap';


/*
    This scheduler uses setTimeout to make the simulation run at a certain (adjustable) speed
*/
export default class RealtimeScheduler {

    private heap: DualKeyMinHeap;
    private nextTimeoutAt: number = null;
    private currentTimeoutHandle = null; 
    private cancelTimerTolerance: number;

    private speed: number;
    private running: boolean;

    public onEmpty: () => void;

    /*
        At speed 1, all 'times' represent milliseconds
    */

    constructor(timerTolerance = 40.0, simulationSpeed = 1.0) {
        this.heap = new DualKeyMinHeap();
        this.speed = simulationSpeed;
        //timerTolerance comes in "unscaled" units
        // divide by speed to "scale" it into simulation speed equivalent
        this.cancelTimerTolerance = timerTolerance/simulationSpeed; // simulationSpeed scales everything

        this.running = false;
    }

    public isEmpty(): boolean {
        return this.heap.size() === 0;
    }

    public clear() {
        clearTimeout(this.currentTimeoutHandle);
        this.currentTimeoutHandle = null;
        this.nextTimeoutAt = null;
        this.heap.clear();
    }

    public run() {
        if (this.running) {
            console.log('Realtime scheduler is already running');
            return;
        }
        this.running = true;
        this.scheduleNextEvent();
    }

    // logical clock is for resolving packets to correct order if they were sent in same millisecond
    public addEvent(time: number, logicalClock: number, action: any) {

        time = time/this.speed;

        let heapElem: DualKeyHeapElement = {
            pKey: time,
            sKey: logicalClock,
            payload: action
        };
        this.heap.insert(heapElem);


        // check this time against getTime - lastIntervalSetAt
        let n = now();
        let self = this;    // for scoping

        // start a new timer if there wasn't one before and running
        if (this.running) {
            console.log("scheduler is running");
            if (this.currentTimeoutHandle === null) {
                this.scheduleNextEvent();
            } else {
                let remaining = this.nextTimeoutAt - n;

                // if this new event is to occur cancelTimerTolerance before the reminaing time
                // then delete the timer and add a new one for this event

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
    }

    private timerExpired(timeElapsed): void {
        this.heap.decreaseAllPrimaryKeysBy(timeElapsed);
        this.runReadyEvents();
    }

    private scheduleNextEvent() {
        let self = this;

        if (this.heap.empty()) {
            this.nextTimeoutAt = null;
            this.currentTimeoutHandle = null;

            this.onEmpty();

            return;
        }

        let toutIn = this.heap.peek().pKey;
        this.nextTimeoutAt = now() + toutIn;

        this.currentTimeoutHandle = setTimeout( 
            function() {
                self.timerExpired(toutIn);
                self.scheduleNextEvent();
            }, toutIn);

    }

    private runReadyEvents() {
        // process any other events from the queue that need to be run
        while (!this.heap.empty() && this.heap.peek().pKey <= 0) {
            let elem = this.heap.take();
            elem.payload();
        }
    }
}