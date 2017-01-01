import TopologyFullyConnected from './topology/TopologyFullyConnected';
import GraphVisualizer from './GraphVisualizer';
import NetworkManager from './NetworkManager';
import NetworkStatsManager from './NetworkStatsManager';
import NetworkInterface from './NetworkInterface';
import Time from './Time';
import Logger from './Logger';
import LatencyModel from './topology/LatencyModel';
import ClientMock from './ClientMock';

import * as tsUnit from 'tsunit.external/tsUnit';
import MinHeapTests from '../tests/MinHeapTests';
import DualKeyMinHeapTests from '../tests/DualKeyMinHeapTests';


export function main(experimentSetup) {


    let statsDiv = <HTMLDivElement>document.getElementById('stats-pane');
    let svg = <SVGElement><any>document.getElementById('graph_container');

    let latencyModel = new LatencyModel(experimentSetup.latency_model, experimentSetup.network);

    let topology = new TopologyFullyConnected(latencyModel, experimentSetup.nClients);

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


    let manager = new NetworkManager(topology, networkStats, graphVisualizer, time, logger); 



    let mockClients: ClientMock[] = [];

    for (let i = 0; i < 10; i++) {
        let ni = new NetworkInterface();
        let id = manager.register(ni);
        ni.setClientId(id);
        ni.setManager(manager);

        mockClients.push(new ClientMock(ni, id));
    }




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

