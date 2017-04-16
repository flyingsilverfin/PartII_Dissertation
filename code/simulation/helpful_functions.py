import sys
import json

def extract_sharejs_latencies(arg=None):
    target = sys.argv[3] if arg == None else arg
    j = json.loads(open(target).read())
    data = j[j.keys()[0]]
    lat = eval(data['latencies'])
    numClients = len(lat.keys())/2
    #print lat
    #print numClients
    collected = []
    for i in range(numClients):
        #print i
        a = lat[(-1, i)]
        b = lat[(i, -1)]
        collected += a
        collected += b
        # = [(a[j] + b[j])/2 for j in range(len(a))]
        #averaged += avs
    return collected

if __name__ == '__main__':
	if sys.argv[1] == 'lat':
		latencyColumn = extract_sharejs_latencies()
		outfile = open(sys.argv[2], 'w')
		for line in latencyColumn:
			outfile.write('%f\n' %line)
		outfile.close()
