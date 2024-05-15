import asyncio
from blackflum import *
from utils import *

class Game:
    maxPlayers = 5
    sessionId = "00000"
    sessionName = ""
    activePlayers = []

    def __init__(self, name) -> None:
        self.sessionName = name
        asyncio.run(self.SetUniqueID())

    # Set uniqueID
    async def SetUniqueID(self):
        if(len(activeSessions) > 0):
            isUnique = False
            while(isUnique == False):
                rndID = UTIL_GenerateUID()
                if(self.GetSessionByID(rndID) == None):
                    self.sessionId = rndID
                    isUnique = True

    # Get session instance by ID
    @staticmethod
    def GetSessionByID(sessionID):
        for session in activeSessions:
            if(session.sessionID == sessionID):
                return session 

    def JoinSession(username):
        # Check if user exists
        pass

    def GetPlayerByID():
        pass