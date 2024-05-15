from flask import Flask, render_template, request
import os


app = Flask(__name__)
activeSessions = []

@app.route("/")
def Main():
    return render_template("main.html")

@app.route("/game")
def Game():
    return render_template("game.html")

app.add_url_rule("/login/<body>", "")

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)