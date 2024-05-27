from flask import Flask, render_template, request
from flask import jsonify
import os
import game
import player
import utils
import json
import card

app = Flask(__name__)
activeSessions = []

@app.route("/")
def Main():
    if(len(activeSessions) < 2):
        defaultGame = game.Game("demo")
        activeSessions.append(defaultGame)
        activeSessions.append(defaultGame)
    
    #joe = player.Player("Joe", defaultGame.sessionID, 1000) # Add default player to game
    #defaultGame.JoinSession(joe)

    return render_template("main.html")

@app.route("/draw-card", methods=["GET"])
# Send random card
def DrawCard():
    return json.dumps(card.Card.RandomCard().__dict__) # Return random card

@app.route("/update-player", methods=["POST"])
def UpdatePlayer():
    body = request.data.decode('utf-8') # Get login information
    body = body.strip("'\"")

    # Get player object
    frontEndPlayer = json.loads(body)
    playerSession = GetSessionByID(frontEndPlayer["sessionID"]) # Get their session
    backEndPlayer = playerSession.GetPlayerByID(frontEndPlayer["playerID"]) # Get player obj

    backEndPlayer.balance   = frontEndPlayer["balance"]
    backEndPlayer.username  = frontEndPlayer["username"]
    backEndPlayer.sessionID = frontEndPlayer["sessionID"]
    backEndPlayer.playerID  = frontEndPlayer["playerID"]
    backEndPlayer.bet       = frontEndPlayer["bet"]

    return json.dumps("OK"), 200

# Get players from server
@app.route("/update-player-get", methods=["POST"])
def UpdatePlayerGet():
    body = request.data.decode('utf-8') # Get login information
    body = body.strip("'\"")

    jsonObj = json.loads(body)
    playerID = jsonObj["playerID"]
    sessionID = jsonObj["sessionID"]
    
    session = GetSessionByID(sessionID)
    playerClass = session.GetPlayerByID(playerID)

    return json.dumps(playerClass.__dict__)

@app.route("/user-turn", methods=["POST"])
def UserTurn(): # Find out whose turn it is in a session
    body = request.data.decode('utf-8')
    body = body.strip("'\"")

    jsonObj = json.loads(body)
    sessionID = jsonObj["sessionID"]

    session = GetSessionByID(sessionID)
    responseBody = {"playerID": session.GetPlayerTurn()}
    return json.dumps(responseBody)

@app.route("/game-status", methods=["POST"])
def GameStatus(): # Get the game state by sessionID
    body = request.data.decode('utf-8')
    body = body.strip("'\"")

    jsonObj = json.loads(body)
    sessionID = jsonObj["sessionID"]

    session = GetSessionByID(sessionID)
    responseBody = {"gameState": session.GetGameState()}
    return json.dumps(responseBody)

@app.route("/set-game-state", methods=["POST"])
def SetGameStatus(): # Set the game state by sessionID
    body = request.data.decode('utf-8')
    body = body.strip("'\"")

    jsonObj = json.loads(body)
    sessionID = jsonObj["sessionID"]
    state = jsonObj["state"]

    session = GetSessionByID(sessionID)
    session.SetGameState(state)
    return json.dumps("OK"), 200

@app.route("/set-user-turn", methods=["POST"])
def SetUserTurn(): # Set the player turn
    body = request.data.decode('utf-8')
    body = body.strip("'\"")

    jsonObj = json.loads(body)
    sessionID = jsonObj["sessionID"]
    senderID = jsonObj["playerID"]

    session = GetSessionByID(sessionID)
    if(senderID != ""):
        if(senderID == session.activePlayers[0].playerID): # Make sure sender is player who started the game
            turn = session.SetPlayerTurn() # This one used to dealing end of game cards to dealer
            return json.dumps(turn), 200 # Return the cards
    else:
        session.SetPlayerTurn(True) # Very dangerous way of doing it, but it workds
    return json.dumps("OK"), 200

@app.route("/game")
def GameRedirect():
    return render_template("game.html")

@app.route("/server-browser", methods=["GET"])
def ServerBrowser():
    jsonServerInfo = []
    for x in range(1, len(activeSessions)): # Foreach open session (skip default game)
        serialisedClass = json.dumps(activeSessions[x].__dict__) # Serialise to json
        jsonServerInfo.append(serialisedClass)
    return json.dumps(jsonServerInfo)
    
@app.route("/deal-dealer", methods=["POST"])
def DealDealer(): # Deal up the dealer lad!
    body = request.data.decode('utf-8')
    body = body.strip("'\"")

    jsonObj = json.loads(body)
    sessionID = jsonObj["sessionID"]

    session = GetSessionByID(sessionID)
    rndCard = card.Card.RandomCard()
    session.cardSuite.append(rndCard)
    return json.dumps(rndCard.__dict__)

@app.route("/get-dealer-hand", methods=["POST"])
def GetDealerHand(): # Get dealer card suite
    body = request.data.decode('utf-8')
    body = body.strip("'\"")

    jsonObj = json.loads(body)
    sessionID = jsonObj["sessionID"]

    session = GetSessionByID(sessionID)

    serialisedArr = []
    for card in session.cardSuite:
        serialisedArr.append(json.dumps(card.__dict__))

    body = {"cardSuite": serialisedArr}
    return json.dumps(body)

@app.route("/login", methods=["POST"])
def Login():
    body = request.data.decode('utf-8') # Get login information
    body = body.strip("'\"")
    loginInfo = json.loads(body)

    for session in activeSessions:
        if(session.sessionName == loginInfo["sessionName"]): # Check if session exists
            newPlayer = player.Player(loginInfo["username"], session.sessionID, 100)
            session.JoinSession(newPlayer) # Add player to session

            jsonPlayer = json.dumps(newPlayer.__dict__) # Return player

            activePlayerJson = []
            for p in session.activePlayers:
                activePlayerJson.append(json.dumps(p.__dict__)) # Jsonify all activeplayers add to array

            jsonObj = {"systemMsg" : "SESSION_JOINED", "userClass" : jsonPlayer, "activePlayers": activePlayerJson } # Return
            return jsonify(json.dumps(jsonObj))
        
# Get session instance by ID
def GetSessionByID(sessionID):
    for session in activeSessions:
        if(session.sessionID == sessionID):
            return session 

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)