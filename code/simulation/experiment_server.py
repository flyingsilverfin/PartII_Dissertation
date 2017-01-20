import json
import os
from flask import Flask
from flask import request

app = Flask(__name__)

print "---Current dir---"
print os.getcwd()

def getNextIncompleteCRDTExperiment():
    existingExperiments = os.listdir(os.path.join('.', 'experiments'))
    existingExperiments.sort()

    for experimentFolder in existingExperiments:
        experimentFolderSubDirs = os.listdir(os.path.join('.','experiments',experimentFolder))
        if 'crdt' not in experimentFolderSubDirs:
            return experimentFolder

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
    experimentName = getNextIncompleteCRDTExperiment()
    if experimentName == None:
        return "{}"
    setup = open(os.path.join('.','experiments',experimentName, 'setup.json')).read()
    return setup

@app.route('/nextOTExperiment', methods=['GET'])
def nextOTExperiment():
    experimentName = getNextIncompleteOTExperiment()
    if experimentName == None:
        return ""
    setup = open(os.path.join('.', 'experiments', experimentName, 'setup.json')).read()
    return json.loads(setup)

@app.route('/crdtResult', methods=['POST'])
def receiveCRDTResult():

    data = request.get_json()

    experimentName = data['name']
    experimentResult = data['result']
    top = data['topology']
    try:
        os.mkdir(os.path.join('.', 'experiments', experimentName, 'crdt'))
    except Exception:
        pass
    os.mkdir(os.path.join('.', 'experiments', experimentName, 'crdt', top))
    resultLog = open(os.path.join('.', 'experiments', experimentName, 'crdt', top, 'log.txt'), 'w')

    for line in experimentResult['log']:
        resultLog.write(line + '\n')

    resultLog.close()
    
    return ""

@app.route('/otResult', methods=['POST'])
def receiveOTResult():
    experimentName = request.form['name']
    experimentResult = request.form['result']
    os.mkdir(os.path.join('.', 'experiments', experimentName, 'ot'))
    resultLog = open(os.path.join('.', 'experiments', experimentName, 'ot', 'log.txt'), 'w')

    for line in experimentResult['log']:
        resultLog.write(line + '\n')

    resultLog.close()
    


# CORS hack

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response


app.run(host="localhost", port="3001")