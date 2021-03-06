"use strict"

import {main} from '../modules/Main';
import {fetchJSONFile, postObject} from '../modules/Helper';

/*
// clunky way of disabling testing during experiments...

import * as tsUnit from 'tsunit.external/tsUnit'
import DualKeyMinHeapTests from '../tests/DualKeyMinHeapTests';
import MapCRDTTests from '../tests/MapCRDTTests';

if (TESTING) {
    // testing modules
    let tests = [DualKeyMinHeapTests, MapCRDTTests];
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
}
*/

// --- bit that fetches and runs experiments --- 


function getNextExperiment() {

    console.log("Getting experiment");

    fetchJSONFile(
        "http://localhost:3001/nextCRDTExperiment", 
        runExperiment
    );

}

function runExperiment(experiment) {

    let name = experiment.experiment_name;
    console.log("-----Fetched and running experiment with topology: " + name + " " + experiment.topology);

    let topology = experiment.topology;
    let optimized = experiment.optimized;

    main(experiment, false, function(experimentResult) {

        console.log("-----Completed running experiment with topology: " + name + " " + experiment.topology);
        
        // postObject() stringifies the json internally
        postObject(
            "http://localhost:3001/crdtResult",
            {
                'name': name,
                'topology': experiment.topology,
                'result': experimentResult,
                'optimized': experiment.optimized
            }
        );
    }, function(noLogMemory) {
        setTimeout(function() { // delay to ensure it arrives after crdtResult
            postObject(
                "http://localhost:3001/crdtMemoryNoLog",
                {
                    'name': name,
                    'topology': experiment.topology,
                    'memory': noLogMemory,
                    'optimized': experiment.optimized
                }
            )
        }, 2000);
    });
}
  
getNextExperiment();

// only runs 1 now! Then chrome is restarted for more consistent memory measurement
 