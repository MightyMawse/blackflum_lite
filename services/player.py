import asyncio
from utils import *
from blackflum import *

class Player:
    username = ""
    playerID = "00000"

    def __init__(self, username) -> None:
        self.username = username
        asyncio.run(self.SetPlayerID())

    # Set uniqueID
    async def SetUniqueID(self):
        isUnique = False
        while(isUnique == False):
            rndID = UTIL_GenerateUID()
            if(self.GetPlayerByUID(rndID) == None):
                self.playerID = rndID
                isUnique = True

    # Get player by playerID
    @staticmethod
    def GetPlayerByUID(playerID):
        for session in activeSessions:
            for player in session.activePlayers:
                if(player.playerID == playerID):
                    return player