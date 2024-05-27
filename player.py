import asyncio
import utils
import blackflum
import card

class Player:
    username = ""
    playerID = "00000"
    cardHand = []
    bet = 0
    balance = 100
    parentSessionID = "00000"

    def __init__(self, username, sessionID, balance, bet=0) -> None:
        self.username = username
        self.parentSessionID = sessionID
        self.balance = balance
        self.bet = bet
        asyncio.run(self.SetUniqueID())

    # Set uniqueID
    async def SetUniqueID(self):
        isUnique = False
        while(isUnique == False):
            rndID = utils.GenerateUID()
            if(self.GetPlayerByUID(rndID) == None):
                self.playerID = rndID
                isUnique = True

    # Add card to player hand
    def AddCard(self, card):
        self.cardHand.append(card)

    # Get player by playerID
    @staticmethod
    def GetPlayerByUID(playerID):
        for session in blackflum.activeSessions:
            for player in session.activePlayers:
                if(player.playerID == playerID):
                    return player
            