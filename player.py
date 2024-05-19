import asyncio
import utils
import blackflum

class Player:
    username = ""
    playerID = "00000"

    def __init__(self, username) -> None:
        self.username = username
        asyncio.run(self.SetUniqueID())

    # Set uniqueID
    async def SetUniqueID(self):
        isUnique = False
        while(isUnique == False):
            rndID = utils.GenerateUID()
            if(self.GetPlayerByUID(rndID) == None):
                self.playerID = rndID
                isUnique = True

    # Get player by playerID
    @staticmethod
    def GetPlayerByUID(playerID):
        for session in blackflum.activeSessions:
            for player in session.activePlayers:
                if(player.playerID == playerID):
                    return player
            