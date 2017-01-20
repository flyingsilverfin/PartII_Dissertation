"""
    Python script which find and analyses logs for experiments which have been run,
    analyzes them and records summaries
"""
import os
import json


"""
    TODO
    create experiment which shows that it's actually generating correct strings
    might need more sophisticated experiment generation - including a sort of causal
    "insert ___ after word ___ arrives"
"""




class ClientAnalyzer(object):
    """
    Responsible for tracking one client's stats from the log
    """

    def __init__(self, client_id):
        self.client_id = client_id

    def addMessage(self, msg):
        pass


class ExperimentAnalzer(object):
    """
    Entry point for analyzing an experiment which generated a given log
    """

    def __init__(self, experiment_name, identifier, log):
        self.identifier = identifier
        self.log = log

        experiment_setup = json.loads(
            open(os.path.join('.', 'experiments', experiment_name, 'setup.json')).read()
        )

        self.experiment_setup = experiment_setup

        num_clients = int(experiment_setup['nClients'])

        self.clients = []

        for i in range(num_clients):
            self.clients.append(ClientAnalyzer(i))


        #set up variables and things we want to track later in one central place
        self.start_time = None
        self.end_time = None
        self.average_link_latency = None
        self.furthest_hops = None # will probably just hardcode depending on topology
        self.total_network_packets = None
        self.total_inserts = None
        self.total_deletes = None
        self.memory_stamps = {} # map time -- memory, msg



    def analyze(self):
        """
        Analyzes the log
        """
        for msg in self.log:
            msg = msg.split('    ')
            msg_type = msg[1]
            if msg_type == 'join':
                #not really that interesting...
                continue
            elif msg_type == 'memory':
                self.memory_stamps[msg[0]] = (msg[2], msg[3])
            elif msg_type == 'sent' or msg_type == 'received':
                sender = int(msg[2])
                receiver = int(msg[3])

                if msg_type == 'sent':
                    #TODO
                    pass
                else: # msg_type == 'received'
                    #TODO
                    pass
            else:
                print "Unknown log msg type: " + msg
                print "--Ignoring--"
                continue

        for analyzer in self.clients:
            # get each client's results
            pass

    def getResult(self):
        """
        format result and return as a string
        """
        pass


class MainAnalyzer(object):
    """
    Entry point for analyzing an entire experiment
    """

    def __init__(self, experiment_name):
        self.experiment_name = experiment_name

        self.log_analyzers = []

        logs = self.findAllLogs()
        for logLocation in logs:
            logPath = logLocation.split('/')
            logFile = [s.strip() for s in open(logLocation).readlines()]
            self.log_analyzers.append(ExperimentAnalzer(experiment_name, logPath[-2], logFile))

        results = []
        for analyzer in self.log_analyzers:
            analyzer.analyze()
            results.append("---" + analyzer.identifier + "---")
            results.append(analyzer.getResult())

        summary = open(os.path.join('.', 'experiments', experiment_name, 'summary.txt'))
        for res in results:
            summary.write(res + '\n')
        summary.close()


    def findAllLogs(self):
        logs = []
        for dirpath, dirnames, filenames in os.walk(os.path.join(".", 'experiments', self.experiment_name)):
            for filename in [f for f in filenames if f == "log.txt"]:
                logs.append(os.path.join(dirpath, filename))
        return [l.split('/') for l in logs]


def findReadyExperiments():
    experiments = []
    for exp in os.listdir(os.path.join('.', 'experiments')):
        if not os.path.isdir(os.path.join('.', 'experiments', exp)) or \
            'summary.txt' in os.listdir(os.path.join('.', 'experiments', exp)):
            continue
        experiments.append(['.', 'experiments', exp])
    return experiments


if __name__ == '__main__':
    readyExperiments = findReadyExperiments()
    for exp in readyExperiments:
        print "running new unfinished experiment analysis: " + exp[-1]
        MainAnalyzer(exp[-1])
    print "finished"

