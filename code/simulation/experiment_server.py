import json
import os
from flask import Flask
from flask import request
import glob
import threading
import time

app = Flask(__name__)

print "---Current dir---"
print os.getcwd()

# --- async stuff for restarting chrome for next experiment when experiment finishes ---

class AsyncRunIn(threading.Thread):
    def __init__(self, startIn, function):
        threading.Thread.__init__(self)
        self.toRun = function
        self.startIn = startIn
        self.start()

    def run(self):
        time.sleep(self.startIn)
        self.toRun()



# flask is threaded so this should be fine
def restartChrome():
    os.system('./restart_chrome_script.sh')

def restartShareServer():
    os.system('./restart_share_server.sh')

# --- END stuff for restarting chrome when experiment finishes ---


def getNextIncompleteCRDTExperiment():
    existingExperiments = glob.glob('./experiments/experiment_*')
    existingExperiments.sort()  #impose order

    for experimentPath in existingExperiments:
        setup = json.loads(open(os.path.join(experimentPath, 'setup.json')).read())
        topologies = setup["topology"]

        experimentFolderSubDirs = os.listdir(experimentPath)
        # if experiment not started at all yet, send first topology of this experiment
        if 'crdt' not in experimentFolderSubDirs:
            return (experimentPath, topologies[0], "optimized")

        topology_dirs = os.listdir(os.path.join(experimentPath, 'crdt'))
        topology_dirs.sort() # impose order
        for top in topologies:
            if top in topology_dirs:
                completed_options = os.listdir(os.path.join(experimentPath, 'crdt', top))
                if "optimized" not in completed_options:
                    return (experimentPath, top, "optimized")
                if "nonoptimized" not in completed_options:
                    return (experimentPath, top, "nonoptimized")
            else:
                return (experimentPath, top, "optimized")

    return None

def getNextIncompleteOTExperiment():
    existingExperiments = glob.glob('./experiments/experiment_*')
    existingExperiments.sort()

    for experimentFolder in existingExperiments:
        experimentFolderSubDirs = os.listdir(experimentFolder)
        if 'ot' not in experimentFolderSubDirs:
            return experimentFolder
        if 'log.txt' not in os.listdir(os.path.join(experimentFolder, 'ot')):
            return experimentFolder
    return None

@app.route('/nextCRDTExperiment', methods=['GET'])
def nextCRDTExperiment():
    (experimentPath, topology, optimization) = getNextIncompleteCRDTExperiment()
    print "Next experiment: " + experimentPath + ", topology: " + topology + ", optimization: " + optimization
    if experimentPath == None:
        return "{}"
    setup = json.loads(open(os.path.join(experimentPath, 'setup.json')).read())
    setup["topology"] = topology  # only operate on this one topology for now
    if optimization == "optimized":
        setup["optimized"] = True
    elif optimization == "nonoptimized":
        setup["optimized"] = False
    else:
        print "Unknown optimization choice: " + optimization
        return
    return json.dumps(setup)

@app.route('/nextOTExperiment', methods=['GET'])
def nextOTExperiment():
    experimentPath = getNextIncompleteOTExperiment()
    if experimentPath == None:
        return "{}"
    print "returning: " + experimentPath
    setup = open(os.path.join(experimentPath, 'setup.json')).read()
    return setup

@app.route('/crdtResult', methods=['POST'])
def receiveCRDTResult():

    data = request.get_json()

    experimentName = data['name']
    experimentResult = data['result']
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

    for line in experimentResult['log']:
        resultLog.write(line + '\n')

    resultLog.close()
    
    return ""

@app.route('/crdtMemoryNoLog', methods=['POST'])
def receiveCRDTMemory():
    data = request.get_json()

    experimentName = data['name']
    memory = str(data['memory'])
    top = data['topology']
    optimized = data['optimized']
    #required directories must already exist
    optimized_folder_name = "optimized" if optimized else "nonoptimized"

    resultLog = open(os.path.join('.', 'experiments', experimentName, 'crdt', top, optimized_folder_name, 'log.txt'), 'a+')    #append and read

    numTrialsCompleted = len(resultLog.readlines())
    
    print "Memory received: " + memory
    resultLog.write(memory + '\n')
    
    resultLog.close()

    #delete the log so it gets rerun if the number of lines in the resultLog is less than the intended number of trials
    setup = json.loads(open(os.path.join('.','experiments',experimentName,'setup.json')).read())
    numTrialsNeeded = int(setup['repeat'])

    if numTrialsCompleted < numTrialsNeeded:
        os.remove(os.path.join('.','experiments',experimentName,'crdt', top, optimized_folder_name,'log.txt'))

    AsyncRunIn(3, restartChrome)
    return ""


@app.route('/otResult', methods=['POST'])
def receiveOTResult():

    data = request.get_json()
    
    experimentName = data['name']
    experimentResult = data['result']
    try:
        os.mkdir(os.path.join('.', 'experiments', experimentName, 'ot'))
    except Exception:
        pass
    resultLog = open(os.path.join('.', 'experiments', experimentName, 'ot', 'log.txt'), 'w')

    for line in experimentResult['log']:
        resultLog.write(line + '\n')

    resultLog.close()
    
    return ""

@app.route('/otMemoryNoLog', methods=['POST'])
def receiveOTMemory():
    data = request.get_json()

    experimentName = data['name']
    memory = str(data['memory'])
    #required directories must already exist

    resultLog = open(os.path.join('.', 'experiments', experimentName, 'ot', 'final_memory_usage.txt'), 'a+')    #append and read

    numTrialsCompleted = len(resultLog.readlines())
    
    print "Memory received: " + memory
    resultLog.write(memory + '\n')
    
    resultLog.close()

    #delete the log so it gets rerun if the number of lines in the resultLog is less than the intended number of trials
    setup = json.loads(open(os.path.join('.','experiments',experimentName,'setup.json')).read())
    numTrialsNeeded = int(setup['repeat'])

    if numTrialsCompleted < numTrialsNeeded:
        os.remove(os.path.join('.','experiments',experimentName,'ot','log.txt'))
        os.remove(os.path.join('.','experiments',experimentName,'sharejs-server.log'))

    AsyncRunIn(2, restartShareServer)
    AsyncRunIn(5, restartChrome)
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
