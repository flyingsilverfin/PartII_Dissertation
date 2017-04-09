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


export function main(experimentSetup, graph=true, finishedCallback) {



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
        graphVisualizer = new GraphVisualizer(
                                                svg, 
                                                topology,
                                                networkStats,
                                                {
                                                    height: document.body.clientHeight,
                                                    width: document.body.clientWidth/2,
                                                    charge: -10000,
                                                    linkDistance: 400,
                                                    radius: 25
                                                }
                                );

        graphVisualizer.draw();
        
        logger.logMemory("post-graph-init");

    }


    let scheduler = new EventDrivenScheduler(time);


    let manager = new NetworkManager(topology, 
                                     networkStats,
                                     graphVisualizer, 
                                     scheduler, 
                                     logger, 
                                     function() {
                                        // END OF EXPERIMENT
                                        //let log = logger.getLog();
                                        let result = {
                                            experiment_name: experimentSetup.experiment_name,
                                            log: "",
                                            totalLines: logger.getTotalLines()
                                        }
                                        logger.logMemory("post-experiment");
                                        finishedCallback(result); 
                                     }
    );

    //(<any>window).runEvents = manager.runSimulation.bind(manager);
    (<any>window).pauseplay = function() {
        if (manager.isPaused()) {
            console.log('playing');
            (<any>window).onSpeedEditBlur();
            document.getElementById('pauseplay-button').innerHTML = "Pause";
            manager.start();
        } else {
            console.log('pausing');
            document.getElementById('pauseplay-button').innerHTML = "Play";
            manager.pause();
        }
    };

    (<any>window).onSpeedEditBlur = function() {
        try {
            let speed = parseFloat((<HTMLInputElement>document.getElementById('speed-control')).value);
            console.log(speed);
            manager.setSimulationSpeed(speed);
        } catch (Exception) {
            console.error("Invalid speed multiplier, using old one");
        }
    }


    let mockClients: Client[] = [];
    let scheduledEvents = experimentSetup.events;
    let clients = experimentSetup.clients;

    for (let i = 0; i < numClients; i++) {
        let timeToCreate = parseInt(clients[i]);
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
}

