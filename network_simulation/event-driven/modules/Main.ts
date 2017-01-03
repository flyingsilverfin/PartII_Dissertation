import TopologyFullyConnected from './topology/TopologyFullyConnected';
import GraphVisualizer from './GraphVisualizer';
import NetworkManager from './NetworkManager';
import EventDrivenScheduler from './EventDrivenScheduler';

import NetworkStatsManager from './NetworkStatsManager';
import NetworkInterface from './NetworkInterface';
import Time from './Time';
import Logger from './Logger';
import LatencyModel from './topology/LatencyModel';
import ClientMock from './ClientMock';

import * as tsUnit from 'tsunit.external/tsUnit';
import DualKeyMinHeapTests from '../tests/DualKeyMinHeapTests';


export function main(experimentSetup) {


    let statsDiv = <HTMLDivElement>document.getElementById('stats-pane');
    let svg = <SVGElement><any>document.getElementById('graph_container');

    let latencyModel = new LatencyModel(experimentSetup.latency_model, experimentSetup.network);

    let topology = new TopologyFullyConnected(latencyModel, parseInt(experimentSetup.nClients));

    let networkStats = new NetworkStatsManager(topology, statsDiv);
    let graphVisualizer = new GraphVisualizer(
                                            svg, 
                                            topology,
                                            networkStats,
                                            {
                                                height: document.body.clientHeight,
                                                width: document.body.clientWidth - 100,
                                                charge: -10000,
                                                linkDistance: 400,
                                                radius: 25
                                            }
                            );

    graphVisualizer.draw();

    let time = new Time();
    let logger = new Logger(time);

    let scheduler = new EventDrivenScheduler(time);

    let manager = new NetworkManager(topology, networkStats, graphVisualizer, scheduler, logger); 



    let mockClients: ClientMock[] = [];
    let scheduledEvents = experimentSetup.events;
    let numClients = parseInt(experimentSetup.nClients);

    for (let i = 0; i < numClients; i++) {
        let ni = new NetworkInterface();
        let id = manager.register(ni);
        ni.setClientId(id);
        ni.setManager(manager);

        mockClients.push(new ClientMock(ni, id, scheduler, experimentSetup.events[id]));
    }

    /*

    ****** THIS BIT IS IMPORTANT *****

        The experimentSetup comes with a list of scheduled events per client
        because this is just the network simulation and it's easier right now,
        I will insert events straight into the scheduler...
        HOWEVER, when the full CRDT client comes into effect, I will probably
        want to hand each full client a schedule of events to run, which are then inserted into the scheduler from there...

    */

  



    manager.runSimulation();

    let log = logger.getLog();
    let result = {
        experiment_name: experimentSetup.experiment_name,
        log: log
    }

    return result;


    /*

    function sendRandomPackets() {
        console.log('sending 2 packets');
        for (let i = 0; i < 20; i++) {
            let i = Math.floor(Math.random() * mockClients.length);
            let c = mockClients[i];
            let j = Math.floor(Math.random() * (122 - 97)) + 97;
            let char = String.fromCharCode(j);
            c.sendMockInsertPacket(char);
        }
    }
    
    let i = Math.floor(Math.random() * mockClients.length);
    let c = mockClients[i];
    let j = Math.floor(Math.random() * (122 - 97)) + 97;
    let char = String.fromCharCode(j);
    c.sendMockInsertPacket(char);
    


    //setInterval(sendRandomPackets, 1000);
    sendRandomPackets();

    manager.runSimulation();

    logger.writeLogToConsole();
*/
}

