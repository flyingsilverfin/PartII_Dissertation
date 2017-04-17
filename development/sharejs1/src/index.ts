
import {main} from '../modules/Main';
import {fetchJSONFile, postObject} from '../modules/Helper';


function getNextExperiment() {

    fetchJSONFile(
        "http://localhost:3001/nextOTExperiment", 
        runExperiment
    );

}

function runExperiment(experiment) {

    let name = experiment.experiment_name;
    console.log("-----Fetched and running OT Experiment: " + name);

    main(experiment, false, function(experimentResult) {

        console.log("-----Completed running experiment: " + name);
        
        // post() stringifies the json internally
        postObject(
            "http://localhost:3001/otResult",
            {
                'name': name,
                'result': experimentResult
            }
        );
    }, function(noLogMemory) {
        setTimeout(function() { //delay to ensure it arrives after otResult
            // post() stringifies the json internally
            postObject(
                "http://localhost:3001/otMemoryNoLog",
                {
                    'name': name,
                    'memory': noLogMemory
                }
            );
        }, 1000);
    });
}
  
getNextExperiment();

// only runs 1 now! Then chrome is restarted for more consistent memory measurement
