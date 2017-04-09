import json
import os
import time
from flask import Flask
from flask import request
import logging

#turn off print statements in case of success, due to thousands of log lines being sent this kills performance otherwise
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)


app = Flask(__name__)


OPEN_EXPERIMENT_LOG = []


def getNextIncompleteCRDTExperiment():
    existingExperiments = os.listdir(os.path.join('.', 'experiments'))
    existingExperiments.sort()  #impose order

    for experimentFolder in existingExperiments:
        setup = json.loads(open(os.path.join('.', 'experiments', experimentFolder, 'setup.json')).read())
        topologies = setup["topology"]

        experimentFolderSubDirs = os.listdir(os.path.join('.','experiments', experimentFolder))
        # if experiment not started at all yet, send first topology of this experiment
        if 'crdt' not in experimentFolderSubDirs:
            return (experimentFolder, topologies[0], "optimized")

        topology_dirs = os.listdir(os.path.join('.', 'experiments', experimentFolder, 'crdt'))
        topology_dirs.sort() # impose order
        for top in topologies:
            if top in topology_dirs:
                completed_options = os.listdir(os.path.join('.', 'experiments', experimentFolder, 'crdt', top))
                if "optimized" not in completed_options:
                    return (experimentFolder, top, "optimized")
                if "nonoptimized" not in completed_options:
                    return (experimentFolder, top, "nonoptimized")
            else:
                return (experimentFolder, top, "optimized")

    return None

def getNextIncompleteOTExperiment():
    existingExperiments = os.listdir(os.path.join('.', 'experiments'))
    existingExperiments.sort()

    for experimentFolder in existingExperiments:
        experimentFolderSubDirs = os.listdir(os.path.join('.','experiments',experimentFolder))
        if 'ot' not in experimentFolderSubDirs:
            return experimentFolder
    return None

@app.route('/nextCRDTExperiment', methods=['GET'])
def nextCRDTExperiment():
    (experimentName, topology, optimization) = getNextIncompleteCRDTExperiment()
    print "Next experiment: " + experimentName + ", topology: " + topology + ", optimization: " + optimization
    if experimentName == None:
        return "{}"

    OPEN_EXPERIMENT_LOG = []

    setup = json.loads(open(os.path.join('.', 'experiments', experimentName, 'setup.json')).read())
    setup["topology"] = topology  # only operate on this one topology for now
    if optimization == "optimized":
        setup["optimized"] = True
    elif optimization == "nonoptimized":
        setup["optimized"] = False
    else:
        print "Unknown optimization choice: " + optimization
        return


    OPEN_EXPERIMENT_LOG = []


    return json.dumps(setup)

@app.route('/nextOTExperiment', methods=['GET'])
def nextOTExperiment():
    experimentName = getNextIncompleteOTExperiment()
    if experimentName == None:
        return "{}"
    setup = open(os.path.join('.', 'experiments', experimentName, 'setup.json')).read()


    OPEN_EXPERIMENT_LOG = []


    return setup

@app.route('/crdtResult', methods=['POST'])
def receiveCRDTResult():

    data = request.get_json()

    experimentName = data['name']
    #experimentResult = data['result']

    while int(data['result']['totalLines']) > len(OPEN_EXPERIMENT_LOG):
        # I hope the app is still interrupted for network requests... threading IS enabled so it should!
        time.sleep(0.5)
        print "sleeping, incomplete results"
    print "have %d of %d lines" %(len(OPEN_EXPERIMENT_LOG), int(data['result']['totalLines']))

    OPEN_EXPERIMENT_LOG.sort(key=lambda pair: pair[0])
    experimentResult = [x[1] for x in OPEN_EXPERIMENT_LOG]

    top = data['topology']
    optimized = data['optimized']
    try:
    # this must be created, just try it in case it doesn't exist
        os.mkdir(os.path.join('.', 'experiments', experimentName, 'crdt'))
    except Exception:
        pass
    try:
        # this must be created, just try it in case it doesn't exist
        os.mkdir(os.path.join('.', 'experiments', experimentName, 'crdt', top))
    except Exception:
        pass

    optimized_folder_name = "optimized" if optimized else "nonoptimized"
    os.mkdir(os.path.join('.', 'experiments', experimentName, 'crdt', top, optimized_folder_name))
    resultLog = open(os.path.join('.', 'experiments', experimentName, 'crdt', top, optimized_folder_name, 'log.txt'), 'w')

    for line in experimentResult:
        resultLog.write(line + '\n')

    resultLog.close()
    
    return ""

@app.route('/otResult', methods=['POST'])
def receiveOTResult():

    data = request.get_json()
    
    experimentName = data['name']
    #experimentResult = data['result']

    experimentResult = OPEN_EXPERIMENT_LOG


    os.mkdir(os.path.join('.', 'experiments', experimentName, 'ot'))
    resultLog = open(os.path.join('.', 'experiments', experimentName, 'ot', 'log.txt'), 'w')

    for line in experimentResult:
        resultLog.write(line + '\n')

    resultLog.close()
    
    return ""
    



@app.route('/log', methods=['POST'])
def receiveLogLine():
    data = request.get_json()
    line = data['line']
    n = data['counter']
    OPEN_EXPERIMENT_LOG.append([int(n),line])
    return ""



# CORS hack

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response

# need the threaded or it hangs with handling multiple requests
app.run(threaded=True, host="localhost", port="3001")
