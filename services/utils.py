import random
from blackflum import *
from typing import List, TypeVar, Generic

# Generate 5 char unique ID
def UTIL_GenerateUID():
    rndID = None
    for i in range(5):
        rndID += str(random.randint(0, 9))

        