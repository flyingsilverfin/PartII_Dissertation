"use strict"


import Client from '../modules/Client';
import NetworkManager from '../modules/NetworkManager';

let nm = new NetworkManager();

let c = new Client(nm);
let d = new Client(nm);