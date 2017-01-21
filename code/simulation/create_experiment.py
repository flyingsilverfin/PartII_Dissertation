import json
import os
import random
import latency_models


experiment_setup = {
    "experiment_name": "",  # name of experiment
    "execution": "",        # realtime or event-driven
    "nClients": None,       # number of clients
    "topology": ["fully-connected", "star"],    # always run all types of topologies, current setup of latency generation works well for this
    "latency_model": {      # how distribution of latencies is calculated, not really used later
        "type": "",
        "center": None
    },
    "network": {            # actual latencies of each node
    },
    "events":{              # events to run per node, at which times
    },
    "init": ""              # initial document contents
}



EXPERIMENT_SETUP_OPTIONS = {
    "execution" : {
        "type": "list",
        "text": "Choose simulation type",
        "choices": ["realtime", "event-driven"]
    },
    "nClients": {
        "type": "int",
        "text": "How many clients to generate (int)"
    },
    "latency_model-type": {
        "type": "list",
        "text": "Choose a latency model to follow when generating latencies for links",
        "choices": ["constant", "normally distributed"]
    },
    "latency_model-center": {
        "type": "float",
        "text": "Enter the mean latency (float)"
    },
    "init": {
        "type": "str|int",
        "text": "Enter string that is initial document content "
                "or number that indicates length of random string"
    }
}


wordsList = [word.strip() for word in open('/usr/share/dict/words').readlines() if word.strip().isalpha()]
def pickRandomWord():
    n = random.random()
    word = wordsList[int(n*len(wordsList))]
    return word


def printChoicesFor(item):
    choices = EXPERIMENT_SETUP_OPTIONS[item]
    choiceType = choices["type"]
    choiceText = choices["text"]
    print "\n" + choiceText
    if choiceType == "list":
        choiceOptions = choices["choices"]
        for i in range(len(choiceOptions)):
            print "%d. " %(i+1) + choiceOptions[i]
    elif choiceType == "int" or choiceType == "float" or choiceType == "str|int":
        return
    else:
        print("Unknown choice type, check setup options or update code")
        raise Exception()

# - indicates a sub-index
order = ["execution", "nClients", "latency_model-type", "latency_model-center", "init"]

i = 0
while i < len(order):
    item = order[i]
    subindices = item.split('-')
    typeRequired = EXPERIMENT_SETUP_OPTIONS[item]["type"]
    try:
        printChoicesFor(item)
    except Exception:
        break
    #assign the value for this choice
    value = raw_input("\n$ ")
    assign = experiment_setup
    for j in range(len(subindices)-1):
        assign = assign[subindices[j]]

    if typeRequired == "int":
        try:
            assign[subindices[-1]] = int(value)
        except Exception:
            print "excception"
            continue
    elif typeRequired == "float":
        try:
            assign[subindices[-1]] = float(value)
        except Exception:
            continue
    elif typeRequired == "list":
        choices = EXPERIMENT_SETUP_OPTIONS[item]["choices"]
        value = int(value)
        assign[subindices[-1]] = choices[value-1]
    elif typeRequired == "str|int":
        if len(value) == 0:
            value = ""
        elif value.isdigit():   # generate random string of words at least that len
            value = int(value)
            s = ""
            while len(s) < value:
                s += pickRandomWord() + " "
            value = s[:-1] # remove last space
        # otherwise, just use the string entered
        assign[subindices[-1]] = value
    i += 1



expType = experiment_setup["latency_model"]["type"]
center = float(experiment_setup["latency_model"]["center"])
if expType == "constant":
    model = latency_models.LatencyModelConstant(center)
elif expType == "normally distributed":
    stddev = float(raw_input("Standard deviation for normally distributed model: "))
    model = latency_models.LatencyModelNormal(center, stddev)
else:
    raise Exception("unknown latency model type")

# here I'm going to generate the client's average latency, then the simulation will average
# a node's value and the neighbor's value. This is also a better model of say a cell phone
# with high latency which then factors into all of it's neighboring connections
for i in range(int(experiment_setup["nClients"])):
    id = i
    latency = model.getLatency(id)
    experiment_setup["network"][id] = {
        "latency": latency
    }


# now need to schedule some events for the experiment
for i in range(int(experiment_setup["nClients"])):
    experiment_setup["events"][i] = {
        "insert" : {},
        "delete": {}
    }
    toInsert = pickRandomWord()
    when = i*15
    experiment_setup["events"][i]["insert"][when] = {
        "chars": toInsert,
        "after": 0
    }

existingExperiments = os.listdir(os.path.join('.', 'experiments'))
existingExperiments.sort()
try:
    nextNum = int(existingExperiments[-1].split('_')[-1]) + 1
except Exception: #any sort of error
    nextNum = 0

experiment_name = "experiment_" + str(nextNum)

#set up directories for this experiment
os.mkdir(os.path.join('.', 'experiments', experiment_name))
#os.mkdir(os.path.join('.', 'experiments', experiment_name, 'crdt'))
#os.mkdir(os.path.join('.', 'experiments', experiment_name, 'ot'))

experiment_setup["experiment_name"] = experiment_name

open(os.path.join('.', 'experiments', experiment_name,
                  'setup.json'), 'w').write(json.dumps(experiment_setup))


print "Experiment generated successfully"