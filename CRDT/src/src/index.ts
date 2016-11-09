"use strict"


import Client from '../modules/Client';
import NetworkManager from '../modules/NetworkManager';

let nm = new NetworkManager();

for (let i = 0; i < 2; i++) {
    new Client(nm);
}
/*
let tester = new Client(nm);
nm.broadcast(tester.network,{
    'type': 'i',
    'bundle': {
        after: '0',
        char: 'a',
        id: '1.3'
    }
});
nm.broadcast(tester.network,{
    'type': 'i',
    'bundle': {
        after:'0',
        char:'2',
        id: '2.0'
    }
});
nm.broadcast(tester.network,{
    'type': 'i',
    'bundle': {
        after: '0',
        char: 'c',
        id: '1.0'
    }
});
*/