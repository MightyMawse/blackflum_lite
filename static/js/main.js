const timer = ms => new Promise(res => setTimeout(res, ms));

// Press player./dealer btn
function Submit(){
    var usrField = document.getElementById("username");
    var serverBrowser = document.getElementById("server-browser");
    var sesField = serverBrowser.options[serverBrowser.selectedIndex].text;
    if(usrField.value != '' && (sesField != '' && sesField != null)){
        Login(usrField.value, sesField);
    }
    else
        alert("Please enter all required information.");
}

// Cool border pulse
async function BorderPulse(){
    while(true){
        await timer(2000);
        document.getElementById("login").style.boxShadow = "0 0 20px white";
        await timer(2000);
        document.getElementById("login").style.boxShadow = "0 0 15px white";
    }
}

// Get list of active servers 
async function GetServerList(){
    var response = await SendRequest("GET", "/server-browser", null);
    if(document.getElementById("server-browser").length != response.length){
        for(let i = 0; i < response.length; ++i){
            var jsonObj = JSON.parse(response[i]);
            // Print to server browser
            var newOption = document.createElement("option");
            newOption.innerText = jsonObj.sessionName;
    
            var serverBrowser = document.getElementById("server-browser");
            serverBrowser.appendChild(newOption);
        }
    }
}

// Send login post request
async function Login(user, sesName){
    sessionStorage.clear();

    body = {username: user, sessionName : sesName};
    var loginResponse = await SendRequest("POST", "/login", JSON.stringify(body)); // Send login

    var responseObj = JSON.parse(loginResponse);
    sessionStorage.setItem("localPlayer", responseObj.userClass); // Save local player class as json
    sessionStorage.setItem("activePlayers", responseObj.activePlayers); // Save list of other players in session

    if(responseObj.systemMsg == "SESSION_JOINED"){ // Login successful
        document.location.href = "/game";
    }
    else{
        alert(loginResponse)
    }
}


// Send Json request
async function SendRequest(mtd, route, bdy){
    const request = await fetch(route, {
        method: mtd,
        headers:{
            "Content-Type": "application/json"
        },
        body: bdy
    });

    var response = await request.json();
    return response;
}