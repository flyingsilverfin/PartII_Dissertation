
import Logger from './Logger';
import Client from './Client';
import RealtimeScheduler from './RealtimeScheduler';

export function main(experimentSetup, graph=true, finishedCallback) {

    let logger = new Logger();

    logger.logMemory("pre-experiment");


    let statsDiv = <HTMLDivElement>document.getElementById('stats-pane');

    let scheduler = new RealtimeScheduler();

    let numClients = parseInt(experimentSetup.nClients);



    for (let i = 0; i < numClients; i++) {
        let iframe = document.createElement('iframe');

        iframe.id = i.toString();
        iframe.src = "http://localhost:9000/client-index.html";
        document.body.appendChild(iframe);
    }


    logger.logMemory("post-clients-init")


    let numReady = 0;

    // to be accessed from iframes
    (<any>window).getClientSetup = function(id: number) {
        return {
            experimentName: experimentSetup.experiment_name,
            scheduler: scheduler,
            events: experimentSetup.events[id]
        }
    };

    (<any>window).clientReady = function() {

        numReady++;
        console.log(numReady, numClients);
        if (numReady === numClients) {
            setTimeout(function() {
                scheduler.run();
                let log = logger.getLog();
                let result = {
                    experiment_name: experimentSetup.experiment_name,
                    log: log
                }
                logger.logMemory("post-experiment");
                finishedCallback();

            }, 500)
        }
        
    }

}

