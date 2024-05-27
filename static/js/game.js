
const playerAction = {
    STAND: 0,
    HIT: 1
}

var localPlayerSingleton = null;
var activePlayers = [];
var dealerCardSuite = [];
var dealerCardSum = 0
var hasStand = false;
var hasMadeAction = false;
var hasPrompted = false;
var currentlyCheckingTurn = false;

class FrontEndPlayer{
    bet = 0;
    cardSuite = [];
    sessionID = "00000";
    suiteTotal = 0;

    constructor(id, username, balance, sessionID){
        this.playerID = id;
        this.username = username;
        this.balance = balance;
        this.sessionID = sessionID;
    }

    toJSON(){
        return{
            playerID: this.playerID,
            username: this.username,
            balance: this.balance,
            sessionID: this.sessionID,
            bet: this.bet,
            cardSuite: this.cardSuite
        };
    }

    AddPlayerCards(){
        var orderedCards = [];
        var containsAce = false;

        for(let j = 0; j < this.cardSuite.length; j++){ // Add all non ace cards
            if(!this.cardSuite[j].cardTexture.includes("ace")){
                orderedCards.push(this.cardSuite[j]);
            }
            else
                containsAce = true;
        }

        // Sort all non ace cards in ascending
        while(this.CheckSuiteOrder() == false){ // Keep going till sorted
            for(let i = 0; i < this.cardSuite.length; i++){
                if(i + 1 < this.cardSuite.length){ // Make sure in bounds
                    var temp = null;
                    if(this.cardSuite[i].cardValue > this.cardSuite[i + 1]){
                        temp = this.cardSuite[i + 1];
                        this.cardSuite[i + 1] = this.cardSuite[i];
                        this.cardSuite[i] = temp;
                    }
                }
            }
        }

        // Add them all up
        var total = 0;
        for(let n = 0; n < orderedCards.length; n++){
            total += orderedCards[n].cardValue;
        }

        if(containsAce){
            // Figure out if ace should be 11 or 1
            if(total + 11 <= 21){
                total += 11;
            }
            else if(total + 11 > 21){
                total += 1;
            }
        }

        return total;
    }

    async CheckSuiteOrder(){
        for(let i = 0; i < this.cardSuite.length; i++){
            if(i + 1 < this.cardSuite.length){
                if(this.cardSuite[i].cardValue > this.cardSuite[i + 1].cardValue){
                    return false;
                }
            }
        }
    }

    async DealStartingHand(){
        var card = await SendRequest("GET", "/draw-card", null);
        DrawCard(card, "PLAYER");
        card = await SendRequest("GET", "/draw-card", null);
        DrawCard(card, "PLAYER");
    }

    // Player hits or stands
    async PlayerAction(action){
        if(action == "HIT"){
            var card = await SendRequest("GET", "/draw-card", null); // Send player action to server
            DrawCard(card, "PLAYER");

            this.suiteTotal = this.AddPlayerCards();

            if(this.suiteTotal > 21){
                alert("BUST!");
                localPlayerSingleton.balance -= localPlayerSingleton.bet;
                hasStand = true;
            }
            else if(this.suiteTotal == 21){
                alert("BLACK JACK!");
                localPlayerSingleton.balance += localPlayerSingleton.bet * 2;
                hasStand = true;
            }
        }
        else if(action == "STAND"){
            hasStand = true;
        }

        this.UpdateServerPlayer();

        if(hasStand){
            var sessionID = {"sessionID": localPlayerSingleton.sessionID, "playerID": ""};
            await SendRequest("POST", "/set-user-turn", JSON.stringify(sessionID));

            CheckIfTurn(); // Go back to loop
        }

        hasMadeAction = true;
        hasPrompted = false;
    }

    // Check to see if im the last one making a bet so we can start the game
    async PlayerBet() {
        await UpdatePeerPlayers("FROM_SERVER");
        for(let i = 0; i < activePlayers.length; i++){
            if(activePlayers[i].bet == 0){
                CheckForGameStart(); // Still waiting for others, enter waiting loop
                return;
            }
        }

        // Start the game
        StartGame();
    }

    // Update player on server side
    async UpdateServerPlayer(){
        var updatedPlayer = JSON.stringify(this);
        var response = await SendRequest("POST", "/update-player", updatedPlayer);
    }
}

// Card struct
class Card{
    constructor(cardValue, cardTexture){
        this.cardValue = cardValue;
        this.cardTexture = cardTexture;
    }
}


// Wait for green flag from server session
async function CheckForGameStart(){
    waiting = true;
    while(waiting){
        var status = await SendRequest("POST", "/game-status", JSON.stringify(localPlayerSingleton));
        if(status == "READY"){
            // Deal starting hand
            localPlayerSingleton.cardSuite = []; // Clear card suite
            dealerCardSuite = []; // Clear dealer card suite
            dealerCardSum = 0;
            localPlayerSingleton.UpdateServerPlayer();

            await localPlayerSingleton.DealStartingHand();

            var sessionID = {"sessionID": localPlayerSingleton.sessionID};
            var dealerHand = await SendRequest("POST", "get-dealer-hand", JSON.stringify(sessionID));

            for(let i = 0; i < dealerHand.length; i++){
                dealerHand[i] = JSON.parse(dealerHand[i]); // Turn string array into parsed json, could be tweakin idk, been working for 16+ hours straight fml
            }

            dealerCardSuite = dealerHand;
            DrawCard(dealerCardSuite[0], "DEALER"); // Add cards to screen
            DrawCard(dealerCardSuite[1], "DEALER", true);

            waiting = false;
        }
        await timer(2000);
    }

    CheckIfTurn(); // Enter loop
}

// Update all players in activePlayers
async function UpdatePeerPlayers(method){
    if(method == "TO_SERVER"){ // Send front end player to server
        for(let i = 0; i < activePlayers.length; i++){
            activePlayers[i].UpdateServerPlayer();
        }
    }
    else if(method == "FROM_SERVER"){ // Get player from server
        for(let i = 0; i < activePlayers.length; i++){
            var playerToGet = JSON.stringify(activePlayers[i]);

            var response = await SendRequest("POST", "/update-player-get", playerToGet);

            activePlayers[i].balance   = response.balance;
            activePlayers[i].bet       = response.bet;
            activePlayers[i].sessionID = response.sessionID;
            activePlayers[i].playerID  = response.playerID;
        }
    }
}


function Split(inf){
    var objects = [];
    var obj = "";
    for(let i = 0; i < inf.length; i++){
        if(inf[i] != '}')
            obj += inf[i];
        else{
            obj += inf[i];
            objects.push(obj);
            obj = "";
            i += 1;
        }
    }

    return objects;
}


// Dealer drawcard
async function DrawCard(card, suite, faceDown=false) {
    var newCard = document.createElement("div");
    var playerSuite = document.getElementById("player-suite");
    var dealerSuite = document.getElementById("dealer-suite");

    newCard.className = "card"; // Create element and add internal image
    var cardImg = document.createElement("img");
    cardImg.className = "card-img";
    cardImg.id = "cardElement";
    cardImg.src = "../static/imgs/cards/" + card.cardTexture;

    const newCardObj = new Card(card.cardValue, card.cardTexture); // Make card class instance

    if(suite == "PLAYER"){
        playerSuite.appendChild(cardImg);
        localPlayerSingleton.cardSuite.push(newCardObj); // Add to player
    }
    else if(suite == "DEALER"){
        if(faceDown){
            cardImg.src = "../static/imgs/cards/" + "cardback.png";
            cardImg.id = "faceDownCard";
        }

        dealerSuite.appendChild(cardImg);
        dealerCardSuite.push(newCardObj); // Add to dealer
        dealerCardSum += parseInt(newCardObj.cardValue);
    }
}

// Player bet
async function PlayerBetEvent(){
    if(document.getElementById("bet_amount").value == "") { return; } // Make sure amount is entered

    var betAmount = document.getElementById("bet_amount").value;
    localPlayerSingleton.bet = betAmount; // Save to localPlayer

    if(localPlayerSingleton.balance - localPlayerSingleton.bet >= 0){ // Check if withdrawl is valid
        // Update player balance
        newBalance = localPlayerSingleton.balance - localPlayerSingleton.bet;
        
        localPlayerSingleton.UpdateServerPlayer();
    
        document.getElementById("balance_value").innerText = "Balance = $" + newBalance; // Update front end
        document.getElementById("bet_value").innerText = "Bet = $" + localPlayerSingleton.bet;
        document.getElementById("bet_amount").value = "";
        document.getElementById("bet_btn").disabled = true;

        localPlayerSingleton.PlayerBet();
    }
}

// Player hit or stand
async function PlayerActionEvent(action){
    localPlayerSingleton.PlayerAction(action);
}

// Start game/round (Last person to bet will activate this one)
async function StartGame(){
    await UpdatePeerPlayers(); // Make sure all other players are up to date

    localPlayerSingleton.cardSuite = []; // Clear card suite
    dealerCardSuite = []; // Clear dealer card suite
    dealerCardSum = 0;
    localPlayerSingleton.UpdateServerPlayer();

    await localPlayerSingleton.DealStartingHand();

    // Dish up dealers starting hand
    var sessionID = {"sessionID": localPlayerSingleton.sessionID};
    var card_1 = await SendRequest("POST", "/deal-dealer", JSON.stringify(sessionID));
    var card_2 = await SendRequest("POST", "/deal-dealer", JSON.stringify(sessionID));

    var sessionID = {"sessionID": localPlayerSingleton.sessionID};
    var dealerHand = await SendRequest("POST", "get-dealer-hand", JSON.stringify(sessionID));

    var dealerHandClass = [];
    for(let i = 0; i < dealerHand.cardSuite.length; i++){
        dealerHandClass[i] = JSON.parse(dealerHand.cardSuite[i]); // Turn string array into parsed json, could be tweakin idk, been working for 16+ hours straight fml
    }

    // Adds to card suite automatically
    DrawCard(dealerHandClass[0], "DEALER"); // Add cards to screen
    DrawCard(dealerHandClass[1], "DEALER", true);

    hasStand = false;

    CheckIfTurn();
}

// Loop check if is player turn
async function CheckIfTurn(){
    var isTurn = false;
    while(!isTurn){
        await timer(1000);

        var inf = {"sessionID": localPlayerSingleton.sessionID, "playerID": ""};
        var checkIfTurn = await SendRequest("POST", "user-turn", JSON.stringify(inf));
        if(checkIfTurn.playerID == localPlayerSingleton.playerID){
            isTurn = true; // Yay its our turn
        }
        else if(checkIfTurn.playerID == "RESET"){
            // Flip card
            if(currentlyCheckingTurn == false){
                currentlyCheckingTurn = true;
                var faceDownCard = document.getElementById("faceDownCard");
                faceDownCard.src = "../static/imgs/cards/" + dealerCardSuite[1].cardTexture;

                // Dealer start drawing cards
                var sessionID = {"sessionID": localPlayerSingleton.sessionID, "playerID": localPlayerSingleton.playerID}; // Get new card, check if you are the person who started the game otherwise 5 players are cycling the user turn
                var newCard = await SendRequest("POST", "/set-user-turn", JSON.stringify(sessionID)); // Set turn from RESET to new round (0)

                var cards = []
                for(let i = 0; i < newCard.length; i++){
                    cards.push(JSON.parse(newCard[i]))
                    await timer(1000);
                    DrawCard(cards[i], "DEALER"); // Start dealing dealers cards
                }

                await timer(1000);

                if(dealerCardSum > 21){
                    alert("Dealer Bust!");
                    localPlayerSingleton.balance -= localPlayerSingleton.bet;
                }
                else if(dealerCardSum < 21 && dealerCardSum > localPlayerSingleton.suiteTotal){
                    alert("Dealer WINS!");
                    localPlayerSingleton.balance -= localPlayerSingleton.bet;
                }
                else if((localPlayerSingleton.suiteTotal < 21 && localPlayerSingleton.suiteTotal > dealerCardSum) || localPlayerSingleton.suiteTotal == 21){
                    alert("You WIN!");
                    localPlayerSingleton.balance += localPlayerSingleton.bet * 2;
                }
                else if(dealerCardSum == 21){
                    alert("Dealer WINS! with BlackJack");
                    localPlayerSingleton.balance -= localPlayerSingleton.bet;
                }

                document.getElementById("bet_value").innerText = "Bet = $0";
                document.getElementById("balance_value").innerText = "Balance = $" + localPlayerSingleton.balance;

                var noCards = localPlayerSingleton.cardSuite.length + dealerCardSuite.length;
                for(let x = 0; x < noCards; x++){
                    try{document.getElementById("cardElement").remove();}
                    catch{break;}
                }
                document.getElementById("faceDownCard").remove();

                localPlayerSingleton.bet = 0;
                localPlayerSingleton.cardSuite = [];
                localPlayerSingleton.UpdateServerPlayer(); // Update balance

                dealerCardSuite = [];
                dealerCardSum = 0;

                var sessionID = {"sessionID": localPlayerSingleton.sessionID, "playerID": ""}; // Get new card, check if you are the person who started the game otherwise 5 players are cycling the user turn
                var newCard = await SendRequest("POST", "/set-user-turn", JSON.stringify(sessionID));

                currentlyCheckingTurn = false;
                return;
            }
        }
    }

    hasMadeAction = false;

    await WaitForStand();
}

async function WaitForStand(){
    CheckIfTurn()
    while(!hasStand){ // Wait for player to stand
        if(!hasMadeAction){ // Wait for button to be pressed
            if(!hasPrompted){
                PromptUserAction();
            }
        }
        await timer(1000)
    }
}

function PromptUserAction(){
    alert("Hit Or Stand!");
    hasPrompted = true;
}

async function InitGame() {
    // Set local player class instance
    localPlayerSingleton = null;
    activePlayers = [];
    dealerCardSuite = [];
    dealerCardSum = 0

    var localPlayerInfo = JSON.parse(sessionStorage.getItem("localPlayer"));
    const localPlayer = new FrontEndPlayer(localPlayerInfo.playerID, localPlayerInfo.username, localPlayerInfo.balance, localPlayerInfo.parentSessionID);
    localPlayerSingleton = localPlayer;

    var activePlayersInfo = Split(sessionStorage.getItem("activePlayers")); // Get array of active players in their class-like state
    for(let i = 0; i < activePlayersInfo.length; i++){
        activePlayerInfo = JSON.parse(activePlayersInfo[i]); // currnet active player
        const newActivePlayer = new FrontEndPlayer(activePlayerInfo.playerID, activePlayerInfo.username, activePlayerInfo.balance, activePlayerInfo.parentSessionID); // Make it into a class
        activePlayers.push(newActivePlayer); // Add to global array
    }

    // Set bet/balance info
    document.getElementById("bet_value").innerText = "Bet = $0";
    document.getElementById("balance_value").innerText = "Balance = $" + localPlayerSingleton.balance;
    document.getElementById("stand-btn").disabled = true;
    document.getElementById("hit-btn").disabled = true;
}
