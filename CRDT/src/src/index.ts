"use strict"


import Client from '../modules/Client';
import NetworkManager from '../modules/NetworkManager';

import MapCRDTTester from '../tests/MapCRDTTests';
import CRDTComparatorTester from '../tests/CRDTComparatorTests';
import * as tsUnit from 'tsunit.external/tsUnit'


// for some reason I need this log for it all to compile haha
console.log(tsUnit);



// testing modules
let tests = [MapCRDTTester, CRDTComparatorTester];
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



// run main code
let nm = new NetworkManager();

for (let i = 0; i < 2; i++) {
    new Client(nm);
}

