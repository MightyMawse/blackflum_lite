from flask import Flask, render_template, request
from flask import jsonify
import os
import game
import player
import utils


app = Flask(__name__)
activeSessions = []

@app.route("/")
def Main():
    defaultGame = game.Game("sesh")
    activeSessions.append(defaultGame)
    return render_template("main.html")

@app.route("/game")
def GameRedirect():
    return render_template("game.html")

@app.route("/login", methods=["POST"])
def Login():
    
    body = request.data.decode('utf-8') # Get login information
    body = body.strip("'\"")
    splitLoginInfo = utils.SplitLoginInfo(body) # user_sessionName

    for session in activeSessions:
        if(session.sessionName == splitLoginInfo["SESSION"]): # Check if session exists
            if(splitLoginInfo["USER"] not in session.GetPlayersByUsername(splitLoginInfo["USER"])): # ALL BROKEN
                newPlayer = player.Player(splitLoginInfo["USER"]) # Create new player
                session.JoinSession(newPlayer)
            else:
                session.JoinSession(newPlayer)
            return jsonify("SESSION_JOINED")

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)