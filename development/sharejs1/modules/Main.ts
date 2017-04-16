
import Logger from './Logger';
import Client from './Client';
import RealtimeScheduler from './RealtimeScheduler';
import * as T from '../types/Types';

export function main(experimentSetup, graph=true, finishedCallback) {

    let logger = new Logger();
    logger.logMemory("pre-experiment");

    let statsDiv = <HTMLDivElement>document.getElementById('stats-pane');
    let scheduler = new RealtimeScheduler();
    let numClients = experimentSetup.clients.length;

    for (let i = 0; i < numClients; i++) {
        let iframe = document.createElement('iframe');

        iframe.id = i.toString();
        iframe.src = "http://localhost:9000/client-index.html";
        document.body.appendChild(iframe);
    }




    let numReady = 0;
    let numTookSetup = 0;

    let docSeed = Math.floor(Math.random()*1000000);

    // to be accessed from iframes
    // we add a Random number to the experiment name
    // so we (probably) get a fresh document that doesn't contain any data from an old experiment
    (<any>window).getClientSetup = function(id: number):T.ExperimentSetup  {
        let s: T.ExperimentSetup  = {
            experimentName: experimentSetup.experiment_name + "-" + docSeed,
            scheduler: scheduler,
            events: (<T.ScheduledEvents>experimentSetup.events[id]),
            logger: logger,
            whenToJoin: parseFloat(experimentSetup.clients[id])
        };
        numTookSetup++;
        if (numTookSetup === numClients) {
            logger.logMemory("post-clients-create")
            scheduler.run();
        }
        return s;
    };

    (<any>window).clientReady = function() {

        //numReady++;
        //console.log(numReady, numClients);
        //if (numReady === numClients) {
        //    logger.logMemory("post-clients-init")
        //    scheduler.run();
        //}
    }

    /*
    Hardly elegant, but should work
    Once the Scheduler is emptied out, wait two seconds for all the in flight packets to arrive
    then return the result of the experiment
    */
    scheduler.onEmpty = function() {

        setTimeout(function() {
            if (!scheduler.isEmpty()) {
                return;
            }
            let log = logger.getLog();
            let result = {
                experiment_name: experimentSetup.experiment_name,
                log: log
            }
            logger.logMemory("post-experiment");
            finishedCallback(result);
        }, 2000);
    }

}

