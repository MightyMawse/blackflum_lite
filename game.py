import asyncio
import blackflum
import utils

class Game:
    maxPlayers    = 5
    sessionId     = "00000"
    sessionName   = ""
    activePlayers = {}

    def __init__(self, name) -> None:
        self.sessionName = name
        asyncio.run(self.SetUniqueID())

    # Set uniqueID
    async def SetUniqueID(self):
        if(len(blackflum.activeSessions) > 0):
            isUnique = False

            while(isUnique == False):
                rndID = utils.GenerateUID()
                if(self.GetSessionByID(rndID) == None):
                    self.sessionId = rndID
                    isUnique = True

    # Get session instance by ID
    @staticmethod
    def GetSessionByID(sessionID):
        for session in blackflum.activeSessions:
            if(session.sessionID == sessionID):
                return session 

    # Add player to session
    def JoinSession(self, player):
        self.activePlayers.update({player.playerID: player})

    # Get players by username from session
    def GetPlayersByUsername(self, username):
        playerMatches = []
        for player in self.activePlayers:
            if(player.username == username):
                playerMatches.append(player)
        return playerMatches