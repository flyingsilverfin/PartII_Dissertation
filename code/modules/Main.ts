//import GraphVisualizer from './GraphVisualizer';
import NetworkManager from './NetworkManager';
import EventDrivenScheduler from './EventDrivenScheduler';

import NetworkInterface from './NetworkInterface';
import Time from './Time';
import Logger from './Logger';
import LatencyModel from './topology/LatencyModel';
import Client from './Client';

import TopologyFullyConnected from './topology/TopologyFullyConnected';
import TopologyStar from './topology/TopologyStar';

import * as tsUnit from 'tsunit.external/tsUnit';
import DualKeyMinHeapTests from '../tests/DualKeyMinHeapTests';

declare var gc;


export function main(experimentSetup, graph=true, finishedCallback, noLogMemoryUsageCallback) {



    let time = new Time();
    let logger = new Logger(time);

    let optimized = experimentSetup.optimized;

    gc();
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



    //let networkStats = new NetworkStatsManager(topology, statsDiv);
    let graphVisualizer = null;
    if (graph) {
        /*
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
        */
    }


    let scheduler = new EventDrivenScheduler(time);


    let manager = new NetworkManager(topology, 
                                     null,
                                     graphVisualizer, 
                                     scheduler, 
                                     logger, 
                                     function() {
                                        // END OF EXPERIMENT
                                        let log = logger.getLog();
                                        let result = {
                                            experiment_name: experimentSetup.experiment_name,
                                            log: log
                                        }
                                        logger.logMemory("post-experiment");
                                        finishedCallback(result); 

                                        result = null;
                                        log = null;

                                        // clear log to lose any references to it
                                        logger.freeLog();
                                        //delete experimentSetup.events;    // don't gc this! already included in pre-experiment so just subtract it out
                                        //gc();

                                        // delayed GC
                                        setTimeout(function() {
                                            gc();
                                            let mem = (<any>window.performance).memory.usedJSHeapSize;
                                            console.log("Mem after GC: " + mem);
                                            noLogMemoryUsageCallback((<any>window.performance).memory.usedJSHeapSize);
                                        }, 1000);
                                     }
    );


    let mockClients: Client[] = [];
    this.clients = mockClients;
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

    scheduledEvents = null; // gc later


    //(<any>window).runEvents = manager.runSimulation.bind(manager);
    
    let pauseplay = function() {
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

    let onSpeedEditBlur = function() {
        try {
            let speed = parseFloat((<HTMLInputElement>document.getElementById('speed-control')).value);
            console.log(speed);
            manager.setSimulationSpeed(speed);
        } catch (Exception) {
            console.error("Invalid speed multiplier, using old one");
        }
    };

    (<any>window).pauseplay = pauseplay;
    (<any>window).onSpeedEditBlur = onSpeedEditBlur;

    pauseplay()

    logger.logMemory("post-clients-init");
}

