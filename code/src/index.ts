"use strict"

import {main} from '../modules/Main';
import {fetchJSONFile, postObject} from '../modules/Helper';

import * as tsUnit from 'tsunit.external/tsUnit'
import DualKeyMinHeapTests from '../tests/DualKeyMinHeapTests';


// testing modules
let tests = [DualKeyMinHeapTests];
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

// --- bit that fetches and runs experiments --- 


function getNextExperiment() {

    fetchJSONFile(
        "http://localhost:3001/nextCRDTExperiment", 
        runExperiment
    );

}

function runExperiment(experiment) {

    for (let topology of experiment.topology){
        let name = experiment.experiment_name;
        console.log("-----Fetched and running experiment with topology: " + name + " " + topology);

        experiment.topology = topology

        let experimentResult = main(experiment, false);

        console.log("-----Completed running experiment with topology: " + name + " " + topology);
        
        // post() stringifies the json internally
        postObject(
            "http://localhost:3001/crdtResult",
            {
                'name': name,
                'topology': topology,
                'result': experimentResult
            }
        );
    }
}

getNextExperiment();

//setInterval(getNextExperiment, 1000);


