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

    def __init__(self, client_id, crdt=True):
        self.client_id = client_id
        self.crdt = crdt

        self.total_insert_packets_sent = 0
        self.total_delete_packets_sent = 0
        self.total_insert_packets_size = 0
        self.total_delete_packets_size = 0

        self.active_insert_packets = {}    # map (payload id, dest) => time packet was sent
        self.active_delete_packets = {}    # map (payload id, dest) => time packet was sent

        self.actual_link_latencies = {}     # map destination => [#packets, total time taken]


    def sentMessage(self, log_msg):
        """
        Every msg which indicates this client has sent a packet is parsed here
        """
        when = float(log_msg[0])
        sender = int(log_msg[2])

        assert sender == self.client_id

        receiver = int(log_msg[3])
        payload_size_chars = int(log_msg[5])

        if self.crdt:
            msg_type = log_msg[4]
            if msg_type == 'insert':
                insert_id = log_msg[7]
                self.active_insert_packets[(insert_id, receiver)] = when
                self.total_insert_packets_size += payload_size_chars
                self.total_insert_packets_sent += 1

            elif msg_type == 'delete':
                delete_id = log_msg[6]
                self.active_delete_packets[(delete_id, receiver)] = when
                self.total_delete_packets_size += payload_size_chars
                self.total_delete_packets_sent += 1

            else:
                print "Unknown msg type (not insert/delete): " + msg_type

        else:

            #TODO
            # as sharejs bit isn't done yet, can't create log analysis :o
            pass

    def msgArrived(self, log_msg):
        """
        Every msg which indicates this client has sent a packet and it has arrived is parsed here
        """
        when = float(log_msg[0])

        sender = int(log_msg[2])
        assert sender == self.client_id
        receiver = int(log_msg[3])

        if self.crdt:
            msg_type = log_msg[4]
            if msg_type == 'insert':
                insert_id = log_msg[7]
                sent_at = self.active_insert_packets[(insert_id, receiver)]
                actual_latency = when - sent_at

                current_totals = self.actual_link_latencies[receiver]
                current_totals[0] += 1
                current_totals[1] += actual_latency
                self.actual_link_latencies[receiver] = current_totals

            elif msg_type == 'delete':
                delete_id = log_msg[6]
                sent_at = self.active_delete_packets[(delete_id, receiver)]
                actual_latency = when - sent_at

                current_totals = self.actual_link_latencies[receiver]
                current_totals[0] += 1
                current_totals[1] += actual_latency
                self.actual_link_latencies[receiver] = current_totals

            else:
                print "Unknown msg type (not insert/delete): " + msg_type


        else:

            #TODO
            # as sharejs bit isn't done yet, can't create log analysis :o
            pass


class ExperimentAnalzer(object):
    """
    Entry point for analyzing an experiment which generated a given log
    """

    def __init__(self, experiment_name, identifier, log):
        self.identifier = identifier
        self.log = log

        # used for filling various datapoints later
        if identifier != "fully-connected" and identifier != "star":
            self.network_type = "sharejs"
            self.crdt = False
        else:
            self.network_type = identifier
            self.crdt = True


        experiment_setup = json.loads(
            open(os.path.join('.', 'experiments', experiment_name, 'setup.json')).read()
        )

        self.experiment_setup = experiment_setup

        num_clients = int(experiment_setup['nClients'])

        self.clients = []

        for i in range(num_clients):
            self.clients.append(ClientAnalyzer(i, self.crdt))


        #set up variables and things we want to track later in one central place
        self.start_time = None
        self.end_time = None
        self.intended_average_link_latency = None   # set const
        self.actual_total_link_time = None
        self.furthest_hops = None           # set const
        self.total_inserts_packet_size = None
        self.total_deletes_packet_size = None

        #this is the number of insert or delete events generated
        self.total_inserts_events = None    # set const
        self.total_deletes_events = None    # set const

        self.total_inserts_packets = None
        self.total_deletes_packets = None
        self.total_expected_packets_naiive = None   # set const
        self.total_expected_packets_best = None     # set const

        self.memory_stamps = {} # map time -- memory, msg

        # write the '# set const' values
        self.setKnownValues()

    def setKnownValues(self):

        (self.expected_total_packets_naiive, self.total_expected_packets_best) \
            = self.calcExpectedNumberOfPackets()

        # actually this is only true for non-sharejs methods, but hey
        self.intended_average_link_latency = float(self.experiment_setup["latency_model"]["center"])
        self.total_inserts_events = self.getNumberOfInsertEvents()
        self.total_deletes_events = self.getNumberOfDeleteEvents()


        if self.network_type == "fully-connected":
            self.furthest_hops = 1
        elif self.network_type == "star":
            self.furthest_hops = 2
        elif self.network_type == "sharejs":
            self.furthest_hops = 2



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
                if msg_type == 'sent':
                    self.clients[sender].sentMessage(msg)
                else: # msg_type == 'receiver' -- guaranteed
                    self.clients[sender].msgArrived(msg)

            else:
                print "Unknown log msg type: " + msg
                print "--Ignoring--"
                continue

        for analyzer in self.clients:
            # get each client's results
            pass



    def calcExpectedNumberOfPackets(self):
        """
        calculates an expected number of packets sent across the network
        assuming the naiive broadcast implementation (if p2p)

        also returns expected number of packets sent across network
        if the naiive broadcast had been done using multicast/proper protocol
        """

        num_clients = len(self.clients)
        inserts = self.getNumberOfInsertEvents()
        deletes = self.getNumberOfDeleteEvents()
        num_actions = inserts + deletes

        if self.network_type == 'fully-connected':
            return (
                num_actions *
                ((num_clients - 1) + (num_clients - 1) * (num_clients - 1)) # this is O(n^2)
                ,
                num_actions * (num_clients - 1)
            )

        elif self.network_type == 'star':
            return (2 * num_actions * (num_clients - 1), num_actions * (num_clients - 1))

        elif self.network_type == 'sharejs':
            # note: sharejs can insert words at a time...
            # thus will consider each word insert as 1 message for now
            # TODO need to think about this more...
            return (num_actions * (num_clients-1), num_actions * (num_clients-1))

        else:
            print "Unknown network type, cannot calculate expected number" \
                  "of packets: " + self.network_type
            return (-1, -1)


    def getNumberOfInsertEvents(self):
        events = self.experiment_setup["events"]
        insert_events = 0
        if self.network_type == 'fully-connected' or self.network_type == 'star':
            for client in events.keys():
                for insert_event_time in events[client]["insert"].keys():
                    inserts_at_this_time = events[client]["delete"][insert_event_time]
                    insert_events += len(inserts_at_this_time["chars"])
        elif self.network_type == 'sharejs':
            for client in events.keys():
                for insert_event_time in events[client]["insert"].keys():
                    insert_events += 1
        else:
            print "unknown network type: " + self.network_type
            return -1

        return insert_events

    def getNumberOfDeleteEvents(self):
        events = self.experiment_setup["events"]
        delete_events = 0
        if self.network_type == 'fully-connected' or self.network_type == 'star':
            for client in events.keys():
                for delete_event_time in events[client]["delete"].keys():
                    deletes_at_this_time = events[client]["delete"][delete_event_time]
                    delete_events += len(deletes_at_this_time)
        elif self.network_type == 'sharejs':
            for client in events.keys():
                for delete_event_time in events[client]["delete"].keys():
                    delete_events += 1
        else:
            print "unknown network type: " + self.network_type
            return -1
        return delete_events

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

