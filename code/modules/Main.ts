import GraphVisualizer from './GraphVisualizer';
import NetworkManager from './NetworkManager';
import EventDrivenScheduler from './EventDrivenScheduler';

import NetworkStatsManager from './NetworkStatsManager';
import NetworkInterface from './NetworkInterface';
import Time from './Time';
import Logger from './Logger';
import LatencyModel from './topology/LatencyModel';
import Client from './Client';

import TopologyFullyConnected from './topology/TopologyFullyConnected';
import TopologyStar from './topology/TopologyStar';

import * as tsUnit from 'tsunit.external/tsUnit';
import DualKeyMinHeapTests from '../tests/DualKeyMinHeapTests';


export function main(experimentSetup, graph=true) {



    let time = new Time();
    let logger = new Logger(time);

    let optimized = experimentSetup.optimized;

    logger.logMemory("pre-experiment");


    let statsDiv = <HTMLDivElement>document.getElementById('stats-pane');
    let svg = <SVGElement><any>document.getElementById('graph_container');

    let latencyModel = new LatencyModel(experimentSetup.latency_model, experimentSetup.network);


    let top = experimentSetup.topology;
    let numClients = experimentSetup.clients.length;
    let topology;
    if (top === "fully-connected") {
        topology = new TopologyFullyConnected(latencyModel, numClients);
    } else  if (top === "star") {
        topology = new TopologyStar(latencyModel, numClients);
    } else {
        console.error("Unknown topology type: " + top);
        console.error('Quitting');
        return;
    }

    logger.logMemory("post-topology-init");



    let networkStats = new NetworkStatsManager(topology, statsDiv);
    let graphVisualizer = null;
    if (graph) {
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
        
        logger.logMemory("post-graph-init");

    }


    let scheduler = new EventDrivenScheduler(time);


    let manager = new NetworkManager(topology, networkStats, graphVisualizer, scheduler, logger); 
    (<any>window).runEvents = manager.runSimulation.bind(manager);


    let mockClients: Client[] = [];
    let scheduledEvents = experimentSetup.events;
    let clients = experimentSetup.clients;

    for (let i = 0; i < numClients; i++) {
        let timeToCreate = parseInt(numClients[i]);
        let action = function() {
            let ni = new NetworkInterface();
            let id = manager.register(ni);
            ni.setClientId(id);
            ni.setManager(manager);
            mockClients.push(new Client(ni, id, scheduler, experimentSetup.events[id], optimized));
        }
        scheduler.addEvent(timeToCreate, 0, action);
    }

    logger.logMemory("post-clients-init");



    manager.runSimulation();

    let log = logger.getLog();
    let result = {
        experiment_name: experimentSetup.experiment_name,
        log: log
    }

    logger.logMemory("post-experiment");

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

