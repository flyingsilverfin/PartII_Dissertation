import * as tsUnit from 'tsunit.external/tsUnit';
import RealtimeScheduler from '../modules/RealtimeScheduler';
import {HeapElement} from '../types/Types';
import {now, within} from '../modules/Helper';


export default class RealtimeSchedulerTests extends tsUnit.TestClass {

    private scheduler = new RealtimeScheduler();
    private result: number[];

    
    events100ms() {
        let n = now();

        let self = this;
        this.scheduler.addEvent(100, function() {
            console.log(now()-n, " should be within 5 of 100");
            self.areIdentical(true, within(now()-n, 100, 5));

        });
        this.scheduler.addEvent(200, function() {
            console.log(now()-n, " should be within 5 of 200");

            self.areIdentical(true, within(now()-n, 200, 5))
        });
        this.scheduler.addEvent(300, function() {
            console.log(now()-n, " should be within 5 of 300");
            self.areIdentical(true, within(now()-n, 300, 5));
        })
    }

    /*
        this test is making sure that inserting many events to execute at the same time will execute in the order inserted...
        I can see this being an issue in the case where client 1 sends A followed by B in the same millisecond, 
        and the priority queue reorders this to arrive as B followed by A. This breaks our in-order requirement.
    */
    identicalTimestampOrderingTest() {
        let n = now();
        let self = this;
        this.scheduler.clear();

        for (let i = 0; i < 20; i++) {
            this.scheduler.addEvent(100, function() {
                console.log(i + ". This should print before messages with > " + i);
            })
        }
    }


    /*
        The scheduler has a bit of logic which allows it retain a scheduled task up to an indicated tolerance
        even if the new event is supposed to be run earlier. 

        I originally put this in since the setTimeout is only accurate to a certain degree, so clearing and restarting a timer if there 
        are only 10 ms left (compared to 5 with the new event) is pointless.
        However, we need to make sure we still execute the newer event before the originally scheduled one...
    */
    slightDelayOrderingTest() {

        let n = now();
        let self = this;
        this.scheduler.clear();

        console.log('-----Running slightDelayOrderingTest ----- ');

        for (let i = 5; i >= 0; i--) {
            this.scheduler.addEvent(i * 5, function() {
                console.log(i + ". This should print before messages with > " + i);
            })
        }
    }




}