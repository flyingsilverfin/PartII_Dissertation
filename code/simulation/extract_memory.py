import glob
import os
import json
import itertools
import sys


def extractMemoryLogs(path):
	exps = glob.glob(path + "/experiment_*")

	otMems = []
	crdtMems = []


	#ragged array of server memory usage
	#first element in row is title of data in it
	#will transpose later
	serverMems = []

	for expPath in exps:
		contents = os.listdir(expPath)
		if 'summary.json' not in contents:
			print "Did not find summary.json in: %s" %(expPath)
			continue

		name = expPath.split('/')[-1]

		summary = json.load(open(expPath + "/summary.json"))

		otMem = [name]
		crdtMem = [name]
		for variation in summary.keys():
			mem = eval(summary[variation]["MemoryCheckpointNoLog"])
			if 'ot' in variation:
				otMem += mem				
			else:
				crdtMem += mem	#combine all the CRDT experiment variations together for memry, should be similar. more dataaa
		otMems.append(otMem)
		crdtMems.append(crdtMem)

		sMems = [int(val.strip()) for val in open(expPath + "/sharejs-server-memory.log").readlines()]
		#pairwise differences between server memory before and after
		serverMemIncrease = [post - init for (init, post) in zip(sMems[::2], sMems[1::2])]	#will always be an even number of elements
		serverMemIncrease.insert(0, name)
		serverMems.append(serverMemIncrease)
		
	#data has been collected, need to transpose and write to files

	otFile = open(path + "/ot_client_memory.dat",'w')
	crdtFile = open(path + "/crdt_memory.dat",'w')
	serverFile = open(path + "/share_server_memory.dat",'w')

	#extend and and transpose
	otMemsTransp = list(itertools.izip_longest(*otMems, fillvalue=''))
	crdtMemsTransp = list(itertools.izip_longest(*crdtMems, fillvalue=''))
	serverMemsTransp = list(itertools.izip_longest(*serverMems, fillvalue=''))

	for row in otMemsTransp:
		otFile.write("\t".join([str(x) for x in row]) + "\n")
	for row in crdtMemsTransp:
		crdtFile.write("\t".join([str(x) for x in row]) + "\n")
	for row in serverMemsTransp:
		serverFile.write("\t".join([str(x) for x in row]) + "\n")

	otFile.close()
	crdtFile.close()
	serverFile.close()
	


if __name__ == "__main__":
	if len(sys.argv) > 0:
		directory = sys.argv[1]
	else:
		directory = '.'
	extractMemoryLogs(directory)