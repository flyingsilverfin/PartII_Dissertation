"use strict"

import TopologyFullyConnected from '../modules/topology/TopologyFullyConnected';
import GraphVisualizer from '../modules/GraphVisualizer';
import NetworkManager from '../modules/NetworkManager';
import NetworkInterface from '../modules/NetworkInterface';

let topology = new TopologyFullyConnected(100);
let manager = new NetworkManager(topology);
let graphVisualizer = new GraphVisualizer(<SVGElement><any>document.getElementById('graph_container'),
                                          topology);


for (let i = 0; i < 100; i++) {
    let ni = new NetworkInterface();
    let id = manager.register(ni);
    ni.setClientId(id);
}

graphVisualizer.updateGraph();


