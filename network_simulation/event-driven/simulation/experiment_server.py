import json
import os
from flask import Flask
from flask import request



# ---------------

from datetime import timedelta
from flask import make_response, current_app
from functools import update_wrapper


def crossdomain(origin=None, methods=None, headers=None,
                max_age=21600, attach_to_all=True,
                automatic_options=True):
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))
    if headers is not None and not isinstance(headers, basestring):
        headers = ', '.join(x.upper() for x in headers)
    if not isinstance(origin, basestring):
        origin = ', '.join(origin)
    if isinstance(max_age, timedelta):
        max_age = max_age.total_seconds()

    def get_methods():
        if methods is not None:
            return methods

        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        def wrapped_function(*args, **kwargs):
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                resp = make_response(f(*args, **kwargs))
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers

            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            h['Access-Control-Max-Age'] = str(max_age)
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            return resp

        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)
    return decorator

# ---------------


app = Flask(__name__)


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
@crossdomain(origin='*')
def nextCRDTExperiment():
    experimentName = getNextIncompleteCRDTExperiment()
    if experimentName == None:
        return ""
    setup = open(os.path.join('.','experiments',experimentName, 'setup.json')).read()
    return setup

@app.route('/nextOTExperiment', methods=['GET'])
@crossdomain(origin='*')
def nextOTExperiment():
    experimentName = getNextIncompleteOTExperiment()
    if experimentName == None:
        return ""
    setup = open(os.path.join('.', 'experiments', experimentName, 'setup.json')).read()
    return json.loads(setup)

@app.route('/crdtResult', methods=['POST'])
def receiveCRDTResult():
    experimentName = request.form['name']
    experimentResult = request.form['result']
    os.mkdir(os.path.join('.', 'experiments', experimentName, 'crdt'))
    resultLog = open(os.path.join('.', 'experiments', experimentName, 'crdt', 'log.txt'), w)

    for line in experimentResult['log']:
        resultLog.write(line + '\n')

    resultLog.close()
    
    #TODO add other results that may be added into the results json later

@app.route('/otResult', methods=['POST'])
def receiveOTResult():
    experimentName = request.form['name']
    experimentResult = request.form['result']
    os.mkdir(os.path.join('.', 'experiments', experimentName, 'ot'))
    resultLog = open(os.path.join('.', 'experiments', experimentName, 'ot', 'log.txt'), w)

    for line in experimentResult['log']:
        resultLog.write(line + '\n')

    resultLog.close()
    
    #TODO add other results that may be added into the results json later





app.run(host="localhost", port="3001")