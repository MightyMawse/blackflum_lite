import asyncio
import blackflum
import utils
import card
import time
import json

class Game:
    maxPlayers    = 5
    sessionID     = "00000"
    sessionName   = ""
    activePlayers = []
    cardSuite     = []

    playerID_turn = ""
    playerID_turn_index = 0 # -1 for RESET
    gameState = "NOT_READY" # NOT_READY, READY

    def __init__(self, name) -> None:
        self.sessionName = name
        asyncio.run(self.SetUniqueID())

    def GetPlayerTurn(self):
        if(self.playerID_turn_index == -1):
            return "RESET"
        else:
            return self.playerID_turn
    
    def SetPlayerTurn(self, gooby=False): # Rotate through player ids
        if(self.playerID_turn_index + 1 >= len(self.activePlayers)):
            self.playerID_turn_index = -1 # Reset
            return "OK"
        elif gooby:
            if(self.playerID_turn_index == -1):
                self.playerID_turn_index = 0
        elif(self.playerID_turn_index == -1):
            # Deal myself cards and return them
            cards = asyncio.run(self.EndRoundDeal())
            serialisedCards = []
            for c in cards:
                self.cardSuite.append(c)
                serialisedCards.append(json.dumps(c.__dict__))

            #self.playerID_turn_index = 0 # New Round
            self.cardSuite.clear()
            return serialisedCards # Return cards to front end
        else:
            self.playerID_turn_index += 1 # Increment player turn index
            self.playerID_turn = self.activePlayers[self.playerID_turn_index].playerID
        return "OK"
    
    # Deal dealer cards at end of round
    async def EndRoundDeal(self):
        cardTotal = 0
        cardArr = []
        for c in self.cardSuite:
            cardTotal += c.cardValue

        while(cardTotal < 17): # Add cards until we reach total
            newCard = card.Card.RandomCard()
            cardArr.append(newCard)
            cardTotal += newCard.cardValue
        return cardArr
        
    def GetGameState(self):
        return self.gameState
    
    def SetGameState(self, state):
        self.gameState = state

    # Set uniqueID
    async def SetUniqueID(self):
        if(len(blackflum.activeSessions) > 0):
            isUnique = False

            while(isUnique == False):
                rndID = utils.GenerateUID()
                if(self.GetSessionByID(rndID) == None):
                    self.sessionID = rndID
                    isUnique = True

    # Add player to session
    def JoinSession(self, player):
        # Check if player already exists
        if(len(self.activePlayers) + 1 <= 5):
            userMatches = self.GetPlayersByUsername(player.username)
            for user in userMatches:
                if(user.username == player.username):
                    return
            
            player.parentSessionID = self.sessionID
            self.activePlayers.append(player)

            if(len(self.activePlayers) == 1):
                self.playerID_turn = self.activePlayers[0].playerID # Set inital player turn

    # Get players by username from session
    def GetPlayersByUsername(self, username):
        playerMatches = []
        for player in self.activePlayers:
            if(player.username == username):
                playerMatches.append(player)
        return playerMatches
    
    # Get players by id from session
    def GetPlayerByID(self, playerID):
        for player in self.activePlayers:
            if(player.playerID == playerID):
                return player

    # Deal player inital or later cards
    def DealPlayer(self, player, initial):
        # Draw random card
        if(initial): # Add two random cards
            cards = [card.Card.RandomCard(), card.Card.RandomCard()]
            player.AddCard(cards[0])
            player.AddCard(cards[1])
            return cards
        else:
            rndCard = card.Card.RandomCard()
            player.AddCard(rndCard)
            return rndCard