let peerMain = new Peer();
let peerClientUUID;
let peerConnected = false;
let peerConnectedUUID;
let roleLevel = "host";



let gameCurrData = {
    turn: 0,
    started: false,
    board:[],
    thisClientTurnID: 1 + Math.round(Math.random())
};
//random number between 1-2;
console.log("clientTurnID: ", gameCurrData.thisClientTurnID);

// ID 1 - RED, 2 - YELLOW

let infoButtonClicked = false;

let boardMain;

async function main() {

    
    info.show({text:"Loading Client UUID...", x: 0, y: 0});


    //on uuid
    let open = await waitForPeerEvent('open');
    peerClientUUID = open[0];
    console.log("peerClientUUID: " + peerClientUUID);

    //join event
    let params = new URLSearchParams(window.location.search);
    let targetJoinUUID = params.get('join');
    //history.pushState(null, '', '/');


    if (targetJoinUUID) {
        info.show({text:"Joining game...", x: 0, y: 0});
        let connectionSuccess = await attempConnectPeer(targetJoinUUID);
        if (connectionSuccess) {

            //await waitForPeerEvent('data');

            roleLevel = "client";
            peerConnected = true;
            info.show({text:"Success", x: 0, y: 0});
            
        } else {
            info.show({text:"Timed Out", x: 0, y: 0},{text:"Continue as Host", x: 0, y: 30, func:"button_Continue_as_Host();"});
            await waitInfoButtonClicked();
            info.hide();

        }
    }

    

    if (roleLevel === "host") {
        info.show({text:"You're a host", x: 0, y: 0},{text:"Copy invite link", x: 0, y: 30, func:"button_Copy_Invite_Link();"});
        setTurnInfoColor();
        turn_info.show();
    } else {
        startListenClient();
        info.show({text:"Waiting for response", x: 0, y: 0});
    }

    initWebClient();

    
}

function initWebClient() {
    console.log("initWEbClient");
    info.show({text:"You're a host", x: 0, y: 0},{text:"Copy invite link", x: 0, y: 30, func:"button_Copy_Invite_Link();"});
    boardMain = new Board();
    boardDisplay.drawFromBoardData(boardMain.tiles);
    gameCurrData.started = false;
    gameCurrData.board = boardMain.tiles;
    history.pushState(null, '', '/');
}

function startListenClient() {

    peerConnectedUUID.on('open', () => {
        console.log("Connection opened");
    });

    peerConnectedUUID.on('data',async data => {
        console.log("Client Data received:", data);
        switch (data.type) {
            case 'request':
                if (data.accept) {
                    //cc accept
                    info.show({text:"accepted"});
                    info.hide();

                    //INIT
                    //setTurnInfoColor();
                    //turn_info.show();
                    gameCurrData = data.data;

                    console.warn("gameCurrData copied");

                    //set guest client to oppsite of host
                    gameCurrData.thisClientTurnID = 3 - gameCurrData.thisClientTurnID; //get oppsite turn

                    //set turn menu coin color
                    setTurnInfoColor();

                    //show the turn info
                    turn_info.show();
                    console.log("updated client turn id to ", gameCurrData.thisClientTurnID);
                    //IF JOIN MID
                    if (data.data.started) {
                        //IF GAME FIRST START
                        console.log("request accept > continue game > ")

                        //update client to host's board
                        boardMain.tiles = gameCurrData.board;
                        
                        //render it
                        boardDisplay.drawFromBoardData(boardMain.tiles);
                    } else {
                        console.log("request accept > new game > ")
                    }
                    gameCurrData.started = true;

                    //start the game if the turn is the guest first.
                    if (gameCurrData.thisClientTurnID === gameCurrData.turn) {
                        startTurnThis();
                        console.log("start turn");
                    }
                    
                } else {
                    //cc reject
                    console.warn("host rejected");
                    peerClientUUID = null;
                    peerConnected = false;

                
                    info.show({text:"Connection Rejected", x: 0, y: 0},{text:"Continue as Host", x: 0, y: 30, func:"button_Continue_as_Host();"});
                    await waitInfoButtonClicked();
                    info.hide();

                    
                    roleLevel = "host";

                    info.show({text:"You're a host", x: 0, y: 0},{text:"Copy invite link", x: 0, y: 30, func:"button_Copy_Invite_Link();"});
                }
                break;
            case 'close_connection':
                console.log("close connection");
                peerConnected = false;
                peerConnectedUUID = null;
                roleLevel = "host";
                info.show({text:"Host lost connection...", x: 0, y: -20},{text:"New Game", x: 0, y: 15, func:"initWebClient();"}, {text:"Copy invite link", x: 0, y: 35, func:"button_Copy_Invite_Link();"});
                break;

            case 'turn_update':
                turnUpdatePacket(data);
                break;

            case 'alive':
                resolveAliveAwait();
                break;
        }
    });

    peerConnectedUUID.on('close', () => {
        console.log("Connection closed");
    });

    peerConnectedUUID.on('error', err => {
        console.error("Connection error:", err);
    });

}

function turnUpdatePacket(data) {

    

    console.log("turn data:", data);
    peerConnectedUUID.send({type:"alive"});
    swapGameCurrData();
    startTurnThis();
    //let dropData = boardMain.drop(data.dropData.x, 3 - gameCurrData.thisClientTurnID);
    //WON CHECK
    boardMain.setSlot(data.dropData.x, data.dropData.y, 3 - gameCurrData.thisClientTurnID);

    boardDisplay.createCoinDropAnimation(data.dropData.x, data.dropData.y, (gameCurrData.thisClientTurnID === 1) ? assets.coin_yellow : assets.coin_red);

    if (data.won) turnUpdateWon(data);
}

function turnUpdateWon(data) {
    lostEvent();
    boardDisplay.drawWonLine(data.won.pivot[0], data.won.pivot[1], (gameCurrData.thisClientTurnID === 2) ? "red" : "yellow", data.won.dir);
}



peerMain.on('connection', conn => {
    console.log("Incoming connection from", conn.peer);

    conn.on('open', () => {

        //accept connection if not connected to anyone;
        console.log("Connection opened");
        if (!peerConnected) {
            console.log("accept guest");
            //connect
            peerConnected = true;
            peerConnectedUUID = conn;
            //
            roleLevel = "host";
            //init game
            guestConnected();
            //game
            gameCurrData.started = true;
            //sent to guest they host accepted
            //conn.send({type:"request", accept: true});
        } else {
            //reject
            console.warn("reject guest.");
            conn.send({type:"request", accept: false});
        }

    });

    conn.on('data',async data => {
        console.log("Host Data received:", data);
        switch (data.type) {
            case 'close_connection':
                peerConnected = false;
                peerConnectedUUID = null;
                
                info.show({text:"Waiting for guest<br>to reconnect...", x: 0, y: -20},{text:"New Game", x: 0, y: 15, func:"initWebClient();"}, {text:"Copy invite link", x: 0, y: 35, func:"button_Copy_Invite_Link();"});

                break;

            case 'turn_update':
                
                turnUpdatePacket(data);
                break;

            case 'alive':
                resolveAliveAwait();
                break;
        }
    });

    conn.on('close', () => {
        console.log("Connection closed");
    });

    conn.on('error', err => {
        console.error("Connection error:", err);
    });
});


window.addEventListener("beforeunload", function (e) {
    if (peerConnected) {
        peerConnectedUUID.send({type:"close_connection"});
    }
});

function guestConnected() {

    info.hide();
    infoButtonClicked = true;

    
    if (!gameCurrData.started) {
        //init first start;
        let initRandomTurn = 1 + Math.round(Math.random()); //start random turn;

        gameCurrData.turn = initRandomTurn;
        gameCurrData.board = boardMain.tiles;
        peerConnectedUUID.send({type:"request", accept: true, data: gameCurrData});
        gameCurrData.started = true;

    } else {
        //
        peerConnectedUUID.send({type:"request", accept: true, data: gameCurrData});
    }

    if (gameCurrData.thisClientTurnID === gameCurrData.turn) {
        console.log("start turn");
        setTurnInfoColor();
        startTurnThis();
    }

    
}


function waitForPeerEvent(eventName) {
    return new Promise((resolve) => {
        peerMain.once(eventName, (...args) => {
            resolve(args);
        });
    })
}

function attempConnectPeer(uuid) {
    return new Promise((resolve) => {
        const connection = peerMain.connect(uuid);

        connection.once('open', () => {
            peerConnectedUUID = connection;
            resolve(true);
        })

        setTimeout(() => {
            resolve(false);
        }, (10 * 1000));
    })
}

function button_Continue_as_Host() {
    infoButtonClicked = true;
    console.log("Continue as Host button clicked");
}

async function button_Copy_Invite_Link() {
    infoButtonClicked = true;

    const url = new URL(window.location.href);
    url.searchParams.set("join", peerClientUUID);

    try {
        await navigator.clipboard.writeText(url.toString());
        console.log("Invite link copied!");
    } catch (err) {
        console.error("Failed to copy invite link:", err);
    }
}


function button_Wait_button_press() {
    infoButtonClicked = true;
}


function waitInfoButtonClicked() {
    infoButtonClicked = false
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (infoButtonClicked) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
}


async function startTurnThis() {
    turn_info.your();
    let dropData = await boardDisplay.startCoinFollowMouse((gameCurrData.thisClientTurnID === 1) ? assets.coin_red : assets.coin_yellow, gameCurrData.thisClientTurnID);
    turn_info.not();
    if (peerConnectedUUID === null) return;
    swapGameCurrData();
    //WIN CODE HERE

    let turnUpdateData = {type:"turn_update", dropData: dropData};

    let turnWon = boardMain.checkWinLine(dropData.x, dropData.y);
    if (turnWon.won) {
        turnUpdateData.won = turnWon;

        boardDisplay.drawWonLine(turnWon.pivot[0], turnWon.pivot[1], (gameCurrData.thisClientTurnID === 1) ? "red" : "yellow", turnWon.dir);

        winEvent();
    }


    peerConnectedUUID.send(turnUpdateData);

    let aliveData = await waitForAliveResolve();

    if (aliveData) {
        console.log("ok connection still good.");
    } else {
        console.warn("connection bad");

        peerConnected = false;
        peerConnectedUUID = null;

        info.show({text:"Connection lost...", x: 0, y: -20},{text:"New Game", x: 0, y: 15, func:"button_Continue_as_Host();"}, {text:"Copy invite link", x: 0, y: 35, func:"button_Copy_Invite_Link();"});
    }
    
}

function winEvent() {
    boardDisplay.stopAnimation = true;
    info.show({text:"You won!", x: 0, y: -20},{text:"New Game", x: 0, y: 15, func:"lostWonEvent();"}, {text:"Rematch", x: 0, y: 35, func:"button_Copy_Invite_Link();"});
}

function lostEvent() {
    boardDisplay.stopAnimation = true;
    info.show({text:"You lose...", x: 0, y: -20},{text:"New Game", x: 0, y: 15, func:"lostWonEvent();"}, {text:"Rematch", x: 0, y: 35, func:"button_Copy_Invite_Link();"});
}

function lostWonEvent() {
    boardDisplay.clear
    peerConnectedUUID.send({type:"close_connection"});
    boardDisplay.stopAnimation = true;
    initWebClient();
}

let aliveResolve;

function waitForAliveResolve() {
  return new Promise(resolve => {
    aliveResolve = resolve;

    setTimeout(() => {
      resolve(false);
    }, 10000);
  });
}

function resolveAliveAwait() {
  if (aliveResolve) {
    aliveResolve(true);
    aliveResolve = null;
  }
}



function swapGameCurrData() {
    gameCurrData.turn = 3 - gameCurrData.turn;
    console.log("turn toggle to: ", gameCurrData.turn);
}

function setTurnInfoColor() {
    console.log("set turn info color");
    switch (gameCurrData.thisClientTurnID) {
        case 1:
            //
            turn_info.setColor("RED");
            break;
        case 2:
            //
            turn_info.setColor("YELLOW");
            break;
        default:
            console.warn("no color found");
            break;
    }
}

main();