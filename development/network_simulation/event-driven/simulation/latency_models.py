from abc import ABCMeta, abstractmethod
import random


class LatencyModel:
    __metaclass__ = ABCMeta

    def __init__(self, center):
        self.center = float(center)

    
    @abstractmethod
    def getLatency(self, seed):
        pass

    @abstractmethod
    def getDescription(self):
        pass


class LatencyModelConstant(LatencyModel):
    def __init__(self, center):
        LatencyModel.__init__(self,center)

    def getLatency(self, seed):
        return self.center

    def getDescription(self):
        return "Constant latency model with value: " + self.center


class LatencyModelNormal(LatencyModel):
    def __init__(self, center, stddev):
        LatencyModel.__init__(self,center)
        self.stddev = float(stddev)

    def getLatency(self, seed):
        generated = random.gauss(self.center, self.stddev)
        while generated < 0 or 2*self.center < generated:
            generated = random.gauss(self.center, self.stddev)
        return generated

    def getDescription(self):
        return "Truncated normal distribution with mean %f and stddev %f" %(self.center, self.stddev)

