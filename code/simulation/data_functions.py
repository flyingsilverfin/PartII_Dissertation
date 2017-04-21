import numpy as np
import sys

default_bins = np.array([1+i*2 for i in range(100)], dtype=np.int)

def histogram(data, bins=default_bins):
	return np.histogram(data, bins)


def make_histograms(dataMatrix, bins=default_bins):
	return np.array([histogram(row, bins)[0] for row in dataMatrix])

#first and last line are ignored (label and newline)
#columns of data
def file_to_histograms(f, binFile = None, normalize = True):
	print "calculating histograms"
	if binFile != None:
		bins = np.array([float(x) for x in open(binFile).readlines()  if len(x.strip()) > 0])
	else:
		bins = np.copy(default_bins)
	data = [line.split("\t") for line in open(f).readlines()[:-1]]
	labels = data.pop(0)
	data = [[float(x.strip()) if len(x.strip()) > 0 else 0 for x in j] for j in data]
	mat = np.asmatrix(data).transpose()
	histograms = make_histograms(mat, bins)
	if normalize:
		histograms = np.array(histograms, dtype=float) / histograms.sum(axis=1, keepdims=True)
	h = histograms.transpose()
	bins = np.resize(bins,(h.shape[0],))
	withBins = np.c_[bins, h]
	outfile = open(f + "_HIST.dat", 'w')
	outfile.write("\t".join(['bins'] + labels))
	for row in withBins:
		outfile.write("\t".join(np.char.mod('%f', row)) + "\n")
	outfile.close()


def stats(f):
	print "calculating stats"
	d = open(f).readlines()
	if len(d[-1]) == 0:
		d.pop(-1)
	data = [line.rstrip().split("\t") for line in d]
	labels = data.pop(0)
	asRows = []
	for c in range(len(data[0])):
		asRows.append([])
		for r in range(len(data)):
			if len(data[r][c]) > 0:
				asRows[-1].append(float(data[r][c].strip()))
	
	means = np.array([np.mean(row) for row in asRows])
	variances = np.array([np.var(row, ddof=1) for row in asRows])
	labels = np.array(labels)
	result = np.vstack((labels, means, variances, variances**0.5))
	result = result.transpose()
	outfile = open(f + "_STATS.dat", 'w')
	outfile.write("%s\t%s\t%s\t%s\n" %("label", "mean", "variance", "stddev"))
	for row in result:
		outfile.write("\t".join([str(x) for x in row]) + "\n")
	#outfile.write("\t".join(labels))
	#outfile.write("\t".join([str(m) for m in means]) + "\n")
	#outfile.write("\t".join([str(v) for v in variances]) + "\n")
	#outfile.write("\t".join([str(v**0.5) for v in variances]))
	outfile.close()
	


if __name__ == "__main__":
	print sys.argv[1], sys.argv[2]
	func = sys.argv[1]
	pathToDataFile = sys.argv[2]
	if func == 'hist':
		if len(sys.argv) > 3:
			file_to_histograms(pathToDataFile, sys.argv[3])
		else:
			file_to_histograms(pathToDataFile)
	if func == 'stats':
		stats(pathToDataFile)
