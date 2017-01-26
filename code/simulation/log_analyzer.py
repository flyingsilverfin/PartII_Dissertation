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

        if self.crdt:
            self.total_insert_packets_sent = 0
            self.total_delete_packets_sent = 0
            self.total_insert_packets_size = 0
            self.total_delete_packets_size = 0
            self.active_insert_packets = {}    # map (payload id, dest) => time packet was sent
            self.active_delete_packets = {}    # map (payload id, dest) => time packet was sent
        else:
            self.total_packets_sent = 0
            self.total_packets_size = 0
            self.total_packets_size_nometa = 0
            self.active_packets = {}    # map (doc version, dest) => time packet was sent
            self.serve_id = None

        self.active_join_packets = {} # map (dest) => time packet was sent
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

        msg_type = log_msg[4]
        if self.crdt:
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

        else:   #case sharejs
            assert msg_type == "sharejs-op"
            payload = json.loads(log_msg[6])
            version = payload['v']
            length = len(log_msg[6])
            self.active_packets[(version, receiver)] = when
            self.total_packets_sent += 1
            self.total_packets_size += length

            #if this client is the server can subtract how much data the 'meta' is consuming
            if 'meta' in payload.keys():
                payload.pop('meta')
                len_no_meta = len(json.dumps(payload))
                self.total_packets_size_nometa += len_no_meta
            

    def msgArrived(self, log_msg):
        """
        Every msg which indicates this client has sent a packet and it has arrived is parsed here
        """
        when = float(log_msg[0])

        sender = int(log_msg[2])
        assert sender == self.client_id
        receiver = int(log_msg[3])

        msg_type = log_msg[4]
        if self.crdt:
            if msg_type == 'insert':
                insert_id = log_msg[7]
                sent_at = self.active_insert_packets[(insert_id, receiver)]
                actual_latency = when - sent_at

                current_totals = self.get_actual_link_latency(receiver) 
                current_totals[0] += 1
                current_totals[1] += actual_latency
                self.actual_link_latencies[receiver] = current_totals

            elif msg_type == 'delete':
                delete_id = log_msg[6]
                sent_at = self.active_delete_packets[(delete_id, receiver)]
                actual_latency = when - sent_at

                current_totals = self.get_actual_link_latency(receiver)
                current_totals[0] += 1
                current_totals[1] += actual_latency
                self.actual_link_latencies[receiver] = current_totals
            else:
                print "Unknown msg type (not insert/delete): " + msg_type
        else:   # case sharejs
            assert msg_type == "sharejs-op"
            payload = json.loads(log_msg[6])
            version = payload['v']

            sent_at = self.active_insert_packets[(version, receiver)]
            actual_latency = when - sent_at

            current_totals = self.get_actual_link_latency(receiver)
            current_totals[0] += 1
            current_totals[1] += actual_latency
            self.actual_link_latencies[receiver] = current_totals

    def joinSent(self, log_msg):
        # sender = int(log_msg[2])
        if not self.crdt:
            self.total_packets_sent += 1
            self.total_packets_size += len(log_msg[3])
        else:
            #TODO no packet sent here yet (might have on join/get state later)
            pass

    #only relevant for server 'client' analyzer
    def joinReceived(self, log_msg):
        #nothing really interesting here
        pass

    #only relevant for server 'client' analyzer
    def joinAckSent(self, log_msg):
        #nothing really interesting here
        self.total_packets_sent += 1
        self.total_packets_size += len(log_msg[3])

    #IMPORTANT - provides mapping between ID and serve-id
    def joinAckReceived(self, log_msg):
        payload = json.loads(log_msg[3])
        self.serve_id = payload['serveId']


    def get_actual_link_latency(self, receiver):
        try:
            return self.actual_link_latencies[receiver]
        except KeyError:
            self.actual_link_latencies[receiver] = [0, 0]
            return self.actual_link_latencies[receiver]

    def getResult(self):
        result = {}
        result["link_latencies"] = self.actual_link_latencies
        if self.crdt:
            result["total_insert_packets"] = self.total_insert_packets_sent
            result["total_delete_packets"] = self.total_delete_packets_sent
            result["total_insert_packets_size"] = self.total_insert_packets_size
            result["total_delete_packets_size"] = self.total_delete_packets_size
        else:
            result["total_packets"] = self.total_packets_sent
            result["total_packets_size"] = self.total_packets_size
            result["total_packets_size_nometa"] = self.total_packets_size_nometa

        return result


class ExperimentAnalzer(object):
    """
    Entry point for analyzing an experiment which generated a given log
    """

    def __init__(self, experiment_name, identifier, logPath):

        self.identifier = identifier
        self.log = [s.strip() for s in open(os.path.join(*logPath)).readlines()]
        self.logPath = logPath

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

        self.clients = {}

        for i in range(num_clients):
            self.clients[i] = ClientAnalyzer(i, self.crdt)
        if not self.crdt:
            self.clients[-1] = ClientAnalyzer(-1, self.crdt)


        #set up variables and things we want to track later in one central place
        self.start_time = None
        self.end_time = None
        self.intended_average_link_latency = None   # set const
        self.actual_total_link_time = None
        self.furthest_hops = None                    # set const

        if self.crdt:
            self.total_inserts_packet_size = None
            self.total_deletes_packet_size = None
            self.total_inserts_packets = None
            self.total_deletes_packets = None
        else:
            self.total_packets = None
            self.total_packets_size = None
            self.total_packets_size_nometa = None

        #this is the number of insert or delete events generated
        self.total_inserts_events = None            # set const
        self.total_deletes_events = None            # set const
        self.total_expected_packets_naiive = None   # set const
        self.total_expected_packets_best = None     # set const

        self.memory_stamps = [] # [memory, msg]

        # write the '# set const' values
        self.setKnownValues()

    def setKnownValues(self):

        (self.total_expected_packets_naiive, self.total_expected_packets_best) \
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
        self.start_time = float(self.log[0].split('    ')[0])
        self.end_time = float(self.log[-1].split('    ')[0])
        run_later = []
        id_map = {} #only needed for non-crdt but whatever

        for msg in self.log:
            msg = msg.split('    ')
            msg_type = msg[1]
            if msg_type == 'join':
                sender = int(msg[2])
                self.clients[sender].joinReceived(msg)
            elif msg_type == 'join-ack':
                # receiver is written at [2], out of norm behavior
                receiver = int(msg[2])
                self.clients[receiver].joinAckReceived(msg)
                id_map[self.clients[receiver].serve_id] = self.clients[receiver].client_id
            elif msg_type == 'memory':
                self.memory_stamps.append((int(msg[2]), msg[3]))
            elif msg_type == 'sent' or msg_type == 'received':
                sender = int(msg[2])
                if msg_type == 'sent':
                    self.clients[sender].sentMessage(msg)
                else: # msg_type == 'receiver' -- guaranteed
                    # stick the msg_arrived into a lambda to run later
                    # since we need to parse the server send equivalents before the clients ClientAnalyzer
                    # be able to account for the packets that are sent from the server
                    run_later.append(lambda m=msg, s=sender: self.clients[s].msgArrived(m))
            else:
                print "--Ignoring: Unknown log msg type: " + msg
                continue

        # if we're in a shareJS experiment log:
        # we have to build the mapping between clients and serveIds
        # then open the server log file and parse it similarly

        if not self.crdt:
            id_map["-1"] = -1
            print id_map

            server_log_path = self.logPath[:-2] + ["sharejs-server.log"]
            server_log = [s.strip() for s in open(os.path.join(*server_log_path)).readlines()]

            # now all from perspective of server
            for msg in server_log:
                msg = msg.split('    ')
                msg_type = msg[1]
                if msg_type == 'join':
                    #caution: reversed again
                    receiver = msg[2]
                    self.clients[id_map[receiver]].joinReceived(msg)
                    print id_map
                elif msg_type == 'join-ack':
                    # sender is always server here
                    sender = -1
                    self.clients[sender].joinAckSent(msg)
                elif msg_type == 'sent' or msg_type == 'received':
                    sender = id_map[msg[2]]
                    if msg_type == 'sent':
                        self.clients[sender].sentMessage(msg)
                    else: # msg_type == 'receiver' -- guaranteed
                        msg[2] = id_map[msg[2]]
                        self.clients[sender].msgArrived(msg)
                else:
                    print "--Ignoring: Unknown sever log msg type: " + msg
                    continue

        for func in run_later:
            func()


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
            """
            Protocol:
                Send msg to server
                Server sends op to all other clients, and returns a sort of Ack
                so N + 1 messages per action

                To open a document, it's 2N for open/ack

                Problem: sharejs can compose operations to reduce number of packets
                => maybe less than the number given here in certain situations
            """
            return (num_actions * (num_clients + 1) + 2*num_clients, num_actions * (num_clients + 1) + 2*num_clients)

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
                    inserts_at_this_time = events[client]["insert"][insert_event_time]
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
        get, format results and return as a string
        """

        result = ""

        average_measured_link_latencies = {}
        total_insert_packets = 0
        total_delete_packets = 0
        total_insert_packets_size = 0
        total_delete_packets_size = 0

        for id in self.clients:
            client = self.clients[id]
            result = client.getResult()

            latencies = result["link_latencies"]
            for dest in latencies.keys():
                average_measured_link_latencies[(client.client_id, dest)] = \
                    float(latencies[dest][1]) / latencies[dest][0]

            total_insert_packets += result["total_insert_packets"]
            total_delete_packets += result["total_delete_packets"]
            total_insert_packets_size += result["total_insert_packets_size"]
            total_delete_packets_size += result["total_delete_packets_size"]

        av_insert_packet_size = 0 if total_insert_packets == 0 else \
                                float(total_insert_packets_size)/total_insert_packets
        av_delete_packet_size = 0 if total_delete_packets == 0 else \
                                float(total_delete_packets_size)/total_delete_packets


        initial_memory = self.memory_stamps[0][0]
        memory_checkpoints = [self.formatResultEntry(m[1], m[0] - initial_memory) for m in self.memory_stamps]
        # skip latencies for now 
        # TODO
        #self.intended_average_link_latency 

        return self.buildResult(
            self.formatResultEntry('Total simulation duration', self.end_time - self.start_time),


            self.formatResultEntry('Total insert events', self.total_inserts_events),
            self.formatResultEntry('Total delete events', self.total_deletes_events),

            self.formatResultEntry('Total insert packets sent', total_insert_packets),
            self.formatResultEntry('Total size of insert packets sent', total_insert_packets_size),
            self.formatResultEntry('Average insert packet payload size', av_insert_packet_size),

            self.formatResultEntry('Total delete packets sent', total_delete_packets),
            self.formatResultEntry('Total size of delete packets sent', total_delete_packets_size),
            self.formatResultEntry('Average delete packet payload size', av_delete_packet_size),

            self.formatResultEntry('Total number of packets sent', total_insert_packets + total_delete_packets),
            self.formatResultEntry('Expected number of packets sent - given naiive broadcast in a p2p network', self.total_expected_packets_naiive),
            self.formatResultEntry('Expected number of packets sent - give optimal p2p network', self.total_expected_packets_best),


            *memory_checkpoints
        )


    def formatResultEntry(self, name, value):
        return "\t" + name + ": " + str(value)

    def buildResult(self, *strings):
        res = ""
        for s in strings:
            res += s + '\n'
        return res

class MainAnalyzer(object):
    """
    Entry point for analyzing an entire experiment
    """

    def __init__(self, experiment_name):
        self.experiment_name = experiment_name

        self.log_analyzers = []

        logs = self.findAllLogs()
        for logPath in logs:
            self.log_analyzers.append(ExperimentAnalzer(experiment_name, logPath[-2], logPath))

        results = []
        for analyzer in self.log_analyzers:
            analyzer.analyze()
            results.append("---" + analyzer.identifier + "---")
            results.append(analyzer.getResult())

        summary = open(os.path.join('.', 'experiments', experiment_name, 'summary.txt'), 'w')
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

