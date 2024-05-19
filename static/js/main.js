﻿const timer = ms => new Promise(res => setTimeout(res, ms));

// Press player./dealer btn
function Submit(role){
    var usrField = document.getElementById("username");
    var sesField = document.getElementById("session_name");
    if(usrField.value != '' && sesField.value != ''){
        Login(usrField.value, sesField.value);
    }
    else
        alert("Please enter all required information.");
}

// Luh cool border pulse
async function BorderPulse(){
    while(true){
        await timer(2000);
        document.getElementById("login").style.boxShadow = "0 0 15px white";
        await timer(2000);
        document.getElementById("login").style.boxShadow = "0 0 10px white";
    }
}

// Send login post request
async function Login(user, sesName){
    body = user + '_' + sesName; // Make body
    var loginResponse = await SendRequest("POST", "/login", JSON.stringify(body)); // Send login
    if(loginResponse == "SESSION_JOINED"){
        document.location.href = "/game"
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