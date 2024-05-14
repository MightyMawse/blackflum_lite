// Press player./dealer btn
function Submit(role){
    var usrField = document.getElementById("username");
    var sesField = document.getElementById("session_name");
    if(usrField.value != '' && sesField.value != ''){
        Login(role, usrField.value, sesField.value);
    }
    else
        alert("Please enter all required information.");
}

// Send login post request
async function Login(user, sesName){
    try{
        body = user + '_' + sesName; // Make body
    }
    catch(error){ console.error("Login()" + error); }

    var loginResponse = SendRequest("POST", "/login", body); // Send login
    var redirectRoute = loginResponse == "SESSION_JOINED" ? "/game_p" : "/game_d";

    if (loginResponse == "SESSION_DUPLICATE") {
        alert("Session with name {0} already exists", sesName);
    }
    else {
        sessionStorage.setItem("user_role", role);
        sessionStorage.setItem("user", user);

        var sessionID = null; // Wait for other threads to catch up
        while (sessionID == null) {
            var req = await SendRequest("POST", "/get_session_id", sesName);
            if (req != "NO_SESSIONS_AVAILABLE") {
                sessionID = req;
            }
        }

        sessionStorage.setItem("session_id", sessionID);

        window.location.href = redirectRoute;
    }
}

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