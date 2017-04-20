import json
import os
import random
import latency_models
import glob


experiment_setup = {
    "experiment_name": "",  # name of experiment
    "execution": "",        # realtime or event-driven
    "clients": None,         # list of times clients join the network (client 0 always joins at time 0)
    "topology": ["fully-connected", "star"],    # always run all types of topologies, current setup of latency generation works well for this
    "latency_model": {      # how distribution of latencies is calculated, not really used later
        "type": "",
        "center": None
    },
    "network": {            # actual latencies of each node
    },
    "events":{              # events to run per node, at which times
    },
    "init": "",             # initial document contents
    "optimized": False,     #toggled by the experiment server when serving experiments
    "description": "",
    "repeat": 1
}



EXPERIMENT_SETUP_OPTIONS = {
    "description": {
        "type": "str",
        "text": "Experiment description"
    },
    "execution" : {
        "type": "list",
        "text": "Choose simulation type",
        "choices": ["realtime", "event-driven"]
    },
    "clients": {
        "type": "int",
        "text": "How many clients to generate (int) - manually edit join times"
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
    },
    'repeat' : {
        'type': 'int',
        'text': "Number of repetitions for this experiment"
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
    elif choiceType == "int" or choiceType == "float" or choiceType == "str|int" or choiceType == "str":
        return
    else:
        print("Unknown choice type, check setup options or update code")
        raise Exception()

# - indicates a sub-index
order = ["description", "repeat", "execution", "clients", "latency_model-type", "latency_model-center", "init"]

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
            if experiment_setup[item] != None:
                pass
            else:
                print "exception with no default"
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
    elif typeRequired == 'str':
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

numClients = int(experiment_setup["clients"])
experiment_setup["clients"] = [0]
for i in range(numClients-1):
    experiment_setup["clients"].append(0)

# here I'm going to generate the client's average latency, then the simulation will average
# a node's value and the neighbor's value. This is also a better model of say a cell phone
# with high latency which then factors into all of it's neighboring connections
for i in range(numClients):
    id = i
    latency = model.getLatency(id)
    experiment_setup["network"][id] = {
        "latency": latency
    }


# now need to schedule some events for the experiment
# just does one word per client for now

num_inserts_per_client = raw_input("Number of insert events per client (default 1): ")
num_inserts_per_client = 1 if len(num_inserts_per_client) == 0 else int(num_inserts_per_client)

insert_spacing = 0
if (num_inserts_per_client > 0):
    tmp = raw_input("Insert event spacing (default 0): ")
    if len(tmp) > 0: insert_spacing = int(tmp)

num_deletes_per_client = raw_input("Number of delete events per client (default 0): ")
num_deletes_per_client = 0 if len(num_deletes_per_client) == 0 else int(num_deletes_per_client)

deletes_spacing = 0
if (num_deletes_per_client > 0):
    tmp = raw_input("Insert event spacing (default 0): ")
    if len(tmp) > 0: deletes_spacing = int(tmp)

num_undo = raw_input("Number of undos (default 0): ")
num_undo = 0 if len(num_undo) == 0 else int(num_undo)
undo_spacing = insert_spacing
if (num_undo > 0):
    tmp = raw_input("Undo Event spacing (default = insert spacing): ")
    if len(tmp) > 0: undo_spacing = int(tmp)

num_redo = raw_input("Number of redos (default 0): ")
num_redo = 0 if len(num_redo) == 0 else int(num_redo)
redo_spacing = num_redo
if (num_redo > 0):
    tmp = raw_input("Redo Event spacing (default = event spacing): ")
    if len(tmp) > 0: redo_spacing = int(tmp)

wordlen = raw_input("Length per insert (default random dictionary word: ")
wordlen = -1 if len(wordlen) == 0 else int(wordlen)


for i in range(numClients):
    experiment_setup["events"][i] = {
        "insert" : {},
        "delete": {},
        "undo": [],
        "redo": []
    }
    for j in range(num_inserts_per_client):

        if (wordlen == -1):
            toInsert = pickRandomWord()
        else:
            s = [chr(random.randint(97,122)) for i in range(wordlen)]
            toInsert = "".join(s)
        when = j*insert_spacing
        experiment_setup["events"][i]["insert"][when] = {
            "chars": toInsert,
            "after": 0
        }
    for j in range(num_deletes_per_client):
        #toDelete = random.randint(1,num_inserts_per_client)    
        toDelete = 0    #always delete first character, only one guaranteed to be there
        when = j*deletes_spacing
        experiment_setup["events"][i]["delete"][when] = [toDelete]
    
    for j in range(num_undo):
        experiment_setup["events"][i]["undo"].append(j * undo_spacing)
    for j in range(num_redo):
        experiment_setup["events"][i]["redo"].append(j * redo_spacing)


existingExperimentNums = [int(exp.split('_')[1]) for exp in glob.glob('./experiments/experiment_*')]
existingExperimentNums.sort()
try:
    nextNum = existingExperimentNums[-1] + 1
except Exception: #any sort of error
    nextNum = 0

experiment_name = "experiment_" + str(nextNum)

#set up directories for this experiment
os.mkdir(os.path.join('.', 'experiments', experiment_name))

experiment_setup["experiment_name"] = experiment_name

open(os.path.join('.', 'experiments', experiment_name,
                  'setup.json'), 'w').write(json.dumps(experiment_setup, indent=4))


print "Experiment generated successfully"