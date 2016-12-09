"use strict"

import TopologyFullyConnected from '../modules/topology/TopologyFullyConnected';
import GraphVisualizer from '../modules/GraphVisualizer';
import NetworkManager from '../modules/NetworkManager';
import NetworkInterface from '../modules/NetworkInterface';
import LatencyModelConstant from '../modules/topology/LatencyModelConstant';

import * as tsUnit from 'tsunit.external/tsUnit'
import MinHeapTests from '../tests/MinHeapTests';
import RealtimeSchedulerTests from '../tests/RealtimeSchedulerTests';


// testing modules
let tests = [MinHeapTests,RealtimeSchedulerTests];
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


let latencyModel = new LatencyModelConstant(100);

let topology = new TopologyFullyConnected(latencyModel);
let manager = new NetworkManager(topology);
let graphVisualizer = new GraphVisualizer(<SVGElement><any>document.getElementById('graph_container'),
                                          topology, 
                                          {
                                              height: document.body.clientHeight,
                                              width: document.body.clientWidth,
                                              charge: -10000,
                                              linkDistance: 400,
                                              radius: 25
                                            });


for (let i = 0; i < 10; i++) {
    let ni = new NetworkInterface();
    let id = manager.register(ni);
    ni.setClientId(id);
}

graphVisualizer.updateGraph();


