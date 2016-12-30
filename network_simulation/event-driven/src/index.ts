"use strict"

import TopologyFullyConnected from '../modules/topology/TopologyFullyConnected';
import GraphVisualizer from '../modules/GraphVisualizer';
import NetworkManager from '../modules/NetworkManager';
import NetworkStatsManager from '../modules/NetworkStatsManager';
import NetworkInterface from '../modules/NetworkInterface';
import Time from '../modules/Time';
import Logger from '../modules/Logger';
import LatencyModelConstant from '../modules/topology/LatencyModelConstant';
import ClientMock from '../modules/ClientMock';

import * as tsUnit from 'tsunit.external/tsUnit'
import MinHeapTests from '../tests/MinHeapTests';
import DualKeyMinHeapTests from '../tests/DualKeyMinHeapTests';


// testing modules
let tests = [MinHeapTests, DualKeyMinHeapTests];
// execute and display tests
for (let i = 0; i < tests.length; i++) {
    let test = tests[i];
    let t = new tsUnit.Test(test);
    let result = t.run();
    let div = document.createElement('div');
    div.id = "results-" + i;
    div.className = "results-section"
    document.getElementById('testing-results').appendChild(div);
    result.showResults("results-" + i);
} 


let statsDiv = <HTMLDivElement>document.getElementById('stats-pane');

let latencyModel = new LatencyModelConstant(1000);
let topology = new TopologyFullyConnected(latencyModel);

let networkStats = new NetworkStatsManager(topology, statsDiv);
let graphVisualizer = new GraphVisualizer(<SVGElement><any>document.getElementById('graph_container'),
                                          topology,
                                          networkStats,
                                          {
                                              height: document.body.clientHeight,
                                              width: document.body.clientWidth - 100,
                                              charge: -10000,
                                              linkDistance: 400,
                                              radius: 25
                                            });


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



graphVisualizer.graphTopologyChanged();


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
/*
let i = Math.floor(Math.random() * mockClients.length);
let c = mockClients[i];
let j = Math.floor(Math.random() * (122 - 97)) + 97;
let char = String.fromCharCode(j);
c.sendMockInsertPacket(char);
*/


//setInterval(sendRandomPackets, 1000);
sendRandomPackets();

manager.runSimulation();

logger.writeLogToConsole();

/*

attempting to get d3 to show loads on graph...


function d(){
    setTimeout(function() {
        networkStats.incrementLoad(0);
        networkStats.incrementLoad(1);
        networkStats.incrementLoad(2);
        console.log("incrememting");
        other();
        graphVisualizer.updateLoads();
    }, 1000); }
function other() {
    networkStats.decrementLoad(0);
    networkStats.decrementLoad(1);
    networkStats.decrementLoad(2);
    d();
}

d();
*/


