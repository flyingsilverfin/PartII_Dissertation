"use strict"

import TopologyFullyConnected from '../modules/topology/TopologyFullyConnected';
import GraphVisualizer from '../modules/GraphVisualizer';
import NetworkManager from '../modules/NetworkManager';
import NetworkInterface from '../modules/NetworkInterface';
import LatencyModelConstant from '../modules/topology/LatencyModelConstant';

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


