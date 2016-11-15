"use strict"


import Client from '../modules/Client';
import NetworkManager from '../modules/NetworkManager';

import MapCRDTTester from '../tests/tmpTest';
import * as tsUnit from 'tsunit.external/tsUnit'


// prepare tests
let test = new tsUnit.Test(MapCRDTTester);
// Run the test
let result = test.run();

// Display in the element with id="results"
result.showResults('Testing-results');




// run main code
let nm = new NetworkManager();

for (let i = 0; i < 2; i++) {
    new Client(nm);
}

