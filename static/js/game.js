
const playerAction = {
    STAND: 0,
    HIT: 1
}


// dealer drawcard
function DrawCard() {

}

// player hit/stand
function PlayerAction(action) {

}

async function InitGame() {
    var role = sessionStorage.getItem("user_role");
    if (role == playerRole.PLAYER) {
        // Load player & dealer
    }
    else if (role == playerRole.DEALER) {
        // Load players
        var targetSessionID = await sessionStorage.getItem("session_id");
        var players = await SendRequest("POST", "/get_players", targetSessionID);
        for (let i = 0; i < players.length; ++i) {
            // Create new player object
            var playerObject = document.createElement("div");
            playerObject.className = "player-obj";
        }
    }
}