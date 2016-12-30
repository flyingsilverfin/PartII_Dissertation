import json
import latency_models
import os

experiment_setup = {
    "execution": "",
    "nClients": None,
    "latency_model": {
        "type": "",
        "center": None
    },
    "network": {
    },
    "preprogrammed":{
    }
}    



experiment_setup_options = {
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
    }
}

def printChoicesFor(item):
    choices = experiment_setup_options[item]
    choiceType = choices["type"]
    choiceText = choices["text"]
    print "\n" + choiceText
    if choiceType == "list":
        choiceOptions = choices["choices"]
        for i in range(len(choiceOptions)):
            print "%d. " %(i+1) + choiceOptions[i]
    elif choiceType == "int" or choiceType == "float":
        return
    else:
        print("Unknown choice type, check setup options or update code")
        raise Exception()

# - indicates a sub-index
order = ["execution", "nClients", "latency_model-type", "latency_model-center"]

i = 0
while i < len(order):
    item = order[i]
    subindices = item.split('-')
    typeRequired = experiment_setup_options[item]["type"]
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
        choices = experiment_setup_options[item]["choices"]
        value = int(value)
        assign[subindices[-1]] = choices[value-1]
    i += 1



expType = experiment_setup["latency_model"]["type"]
center = float(experiment_setup["latency_model"]["center"])
if expType == "constant":
    model = latency_models.LatencyModelConstant(center)
elif expType == "normally distributed":

    stddev = float(raw_input("Standard deviation for model: "))

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


# now need to init what packets/things to do first
print "using hard coded actions for clients"
for i in range(int(experiment_setup["nClients"])):
    experiment_setup["preprogrammed"][i]= {
        i*10: list(str(i))
    }


existingExperiments = os.listdir('./experiments')
existingExperiments.sort()
try:
    nextNum = int(existingExperiments[-1].split('_')[-1])
except IndexError:
    nextNum = 0

open("./experiments/experiment_" + str(nextNum+1), 'w').write(json.dumps(experiment_setup))
