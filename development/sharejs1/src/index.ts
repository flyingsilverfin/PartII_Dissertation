
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

    let experimentResult = main(experiment, false, function() {

        console.log("-----Completed running experiment: " + name);
        
        // post() stringifies the json internally
        postObject(
            "http://localhost:3001/otResult",
            {
                'name': name,
                'result': experimentResult
            }
        );
    });
}
  
getNextExperiment();

// only runs 1 now! Then chrome is restarted for more consistent memory measurement
