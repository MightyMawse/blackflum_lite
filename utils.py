import random
from typing import List, TypeVar, Generic

# Generate 5 char unique ID
def GenerateUID():
    rndID = ""
    for i in range(5):
        rndID += str(random.randint(0, 9))
    return rndID

# Separate data in login request body
def SplitLoginInfo(info):
    splitInfo = {
                 'USER': '',
                 'SESSION': ''
                }
    j = 'USER'
    for i in range(len(info)):
        if(info[i] != '_'):
            splitInfo[j] = splitInfo[j] + str(info[i])
        else:
            j = 'SESSION'
    return splitInfo
        