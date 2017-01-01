"use strict"

import {main} from '../modules/Main';
import {fetchJSONFile, post} from '../modules/Helper';

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



function getNextExperiment() {

    fetchJSONFile(
        "http://localhost/nextExperiment:3001", 
        runExperiment
    );

}

function runExperiment(experiment) {

    let resultOfExperiment = main(experiment);
    post(
        "http://localhost/experimentResult:3001",
        resultOfExperiment
    )

}


setInterval(getNextExperiment, 300);


