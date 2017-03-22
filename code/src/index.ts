"use strict"

import {main} from '../modules/Main';
import {fetchJSONFile, postObject} from '../modules/Helper';

import * as tsUnit from 'tsunit.external/tsUnit'
import DualKeyMinHeapTests from '../tests/DualKeyMinHeapTests';
import MapCRDTTests from '../tests/MapCRDTTests';


/*

set some stuff up

*/

Map.prototype.toString = function():string  {
    /*
    let mapping = [...this];
    let s = "";
    let k,v; // just to satisfy typescript which doesn't seem to know this quite yet
    for ( [k, v] of this.entries()) {
        s += `[${k}] : ${v}, `
    }
    return s.substr(0, s.length-2);
    */

    let mapping = [...this];
    return JSON.stringify(mapping);
}



/*
--- end setup
*/


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

    main(experiment, true, function(experimentResult) {

        console.log("-----Completed running experiment with topology: " + name + " " + experiment.topology);
        
        // post() stringifies the json internally
        postObject(
            "http://localhost:3001/crdtResult",
            {
                'name': name,
                'topology': experiment.topology,
                'result': experimentResult,
                'optimized': experiment.optimized
            }
        );
    });
}
  
getNextExperiment();

// only runs 1 now! Then chrome is restarted for more consistent memory measurement
 