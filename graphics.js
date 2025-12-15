let assets = {};
let sounds = {};

function preLoadAssets() {
    assets.board_main = new Image();
    assets.board_main.src = "asset/board_main.png";
    assets.coin_red = new Image();
    assets.coin_red.src = "asset/coin_red.png";
    assets.coin_yellow = new Image();
    assets.coin_yellow.src = "asset/coin_yellow.png";
    assets.won_red_down = new Image();
    assets.won_red_down.src = "asset/won_red_down.png";
    assets.won_red_horiz = new Image();
    assets.won_red_horiz.src = "asset/won_red_horiz.png";
    assets.won_red_up = new Image();
    assets.won_red_up.src = "asset/won_red_up.png";
    assets.won_red_verti = new Image();
    assets.won_red_verti.src = "asset/won_red_verti.png";
    assets.won_yellow_down = new Image();
    assets.won_yellow_down.src = "asset/won_yellow_down.png";
    assets.won_yellow_horiz = new Image();
    assets.won_yellow_horiz.src = "asset/won_yellow_horiz.png";
    assets.won_yellow_up = new Image();
    assets.won_yellow_up.src = "asset/won_yellow_up.png";
    assets.won_yellow_verti = new Image();
    assets.won_yellow_verti.src = "asset/won_yellow_verti.png";

    sounds.drop = new Audio("asset/snd_bounce.wav");
    sounds.grab = new Audio("asset/snd_grab.wav");
}

preLoadAssets();

const info = {
    hide: function() {
        document.querySelector('.info-main-container').hidden = true;
        document.getElementById("id-info-board-title-container").innerHTML = "";
        document.getElementById("id-info-button-container").innerHTML = "";

    },

    show: function(title) {
        this.hide();
        document.querySelector('.info-main-container').hidden = false;
        //title
        document.getElementById("id-info-board-title-container").innerHTML = `<button class="info-main-button" id="info-main-button" style="height: auto; border-image: url('asset/info_board_hole.png') 4 fill stretch; color: #E0E0E0; text-shadow: 1px 1px 0 #1c1315; text-align: left; transform: translate(calc(-50% + ${title.x}px), calc(-50% + ${title.y}px));"><span class="info-main-button-text" id="id-info-main-title">${title.text}</span></button>`;
        //buttonless information
        if (arguments.length < 2) return;
        //add each button to html
        let i;
        let currArg;
        let currEle = document.getElementById("id-info-button-container");
        for (i = arguments.length -1; i >= 1; i--) {
            currArg = arguments[i];
            currEle.innerHTML += `<button class="info-main-button" id="info-main-button" onclick="${currArg.func ?? ""}" style="transform: translate(calc(-50% + ${currArg.x}px),calc(-50% + ${currArg.y}px));"><span class="info-main-button-text">${currArg.text}</span></button>`;
        }
    }
}

const turn_info = {
    not: function() {
        //document.getElementById('id-turn-main-container').hidden = false;
        const coin = document.getElementById('turn-info-coin');
        const text = document.getElementById('turn-info-text');

        coin.style.animation = 'none';
        text.style.animation = 'none';

        coin.offsetHeight; // forcing reflow
        text.offsetHeight;

        coin.style.animation = 'turn-info-coin 0.5s ease-in-out 1 reverse forwards';
        text.style.animation = 'turn-info-text 0.5s ease-in-out 1 reverse forwards';
    },
    
    your: function() {
        //document.getElementById('id-turn-main-container').hidden = false;
        const coin = document.getElementById('turn-info-coin');
        const text = document.getElementById('turn-info-text');

        coin.style.animation = 'none';
        text.style.animation = 'none';

        coin.offsetHeight; // forcing reflow
        text.offsetHeight;

        coin.style.animation = 'turn-info-coin 0.5s ease-in-out 1 forwards';
        text.style.animation = 'turn-info-text 0.5s ease-in-out 1 forwards';
    },

    hide: function() {
        document.getElementById('id-turn-main-container').hidden = true;
    },

    show: function() {
        document.getElementById('id-turn-main-container').hidden = false;
    },

    setColor: function(color) {
        switch (color.toUpperCase()) {
            case 'RED':
                console.log("color set to RED.");
                document.getElementById("turn-info-coin").src = "asset/coin_red.png";
                break;
            case 'YELLOW':
                console.log("color set to YELLOW.");
                document.getElementById("turn-info-coin").src = "asset/coin_yellow.png";
                break;
            default:
                console.warn("unable to set turn info color");
                break;
        }
    }
    
}

const boardDisplayVar = {
    mouseX: 0,
    mouseClicked: false,
}
const boardDisplay = {

    stopAnimation: false,

    clear: function () {
        this.stopAnimation = true;

        boardDisplayVar.mouseClicked = false;
        boardDisplayVar.mouseX = 0;

        const staticCanvas = document.getElementById("board-main-canva-static");
        if (staticCanvas) {
            staticCanvas.getContext("2d").clearRect(0, 0, staticCanvas.width, staticCanvas.height);
        }

        const wonCanvas = document.getElementById("board-main-canva-won");
        if (wonCanvas) {
            wonCanvas.getContext("2d").clearRect(0, 0, wonCanvas.width, wonCanvas.height);
        }

        const mouseCanvas = document.getElementById("board-main-canva-mouse-follow");
        if (mouseCanvas) {
            mouseCanvas.getContext("2d").clearRect(0, 0, mouseCanvas.width, mouseCanvas.height);
        }

        document
            .querySelectorAll(".board-main-canva-fall-animation")
            .forEach(c => c.remove());

    },

    drawWonLine: function(x, y, color, direction) {
        const canva = document.getElementById("board-main-canva-won");

        const ctx = canva.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canva.width, canva.height);
        const asset = assets[`won_${color}_${direction}`];
        //if (direction === "up") y -= 3; 
        ctx.drawImage(asset, 6 + 19 * x, 6 + 19 * y, asset.width, asset.height);
    },

    drawFromBoardData: function(boardData) {

        //clear board
        const canvas = document.getElementById("board-main-canva-static");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let fx, fy, slotData;
        for (fx = 0; fx < 7; fx++) {
            for (fy = 0; fy < 6; fy++) {
                slotData = boardData[fy][fx];
                if (slotData === 0) continue;
                this.drawStaticBoard(fx, fy, (slotData === 1) ? assets.coin_red : assets.coin_yellow);
            } 
        }
    },


    setMousePosVar: function(event) {
        boardDisplayVar.mouseX = event.clientX - document.getElementById("board-mouse-overlay").getBoundingClientRect().left;
    },

    eventMouseClick: function(event) {
        boardDisplayVar.mouseClicked = true;
    },

    drawStaticBoard: function(x, y, asset) {
        const canvas = document.getElementById("board-main-canva-static");
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(asset, 2 + 19 * x, 2 + 19 * y, 16, 16);
    },



    createCoinDropAnimation: async function(x, y, asset) {
    //create a new canvas element
    const targetY = 370 - (56.5 * (5 - y));
    const newDiv = document.createElement('canvas');
    newDiv.className = "board-main-canva-fall-animation";
    newDiv.id = "board-main-canva-fall-animation";
    newDiv.width = 48;
    newDiv.height = 423;
    newDiv.style.transform = `translate(calc(100% * ${x}), -32%`;

    //setup ctx
    document.getElementById('board-main-canva-coin_fall-container').appendChild(newDiv);
    const ctx = newDiv.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    sounds.grab.play();

    let posY = 0;
    let velY = 0;
    let bounceCount = 0;

    while ((posY < targetY) || bounceCount < 3) {

        //clear canvas
        ctx.clearRect(0, 0, newDiv.width, newDiv.height);

        //draw the coin
        ctx.drawImage(asset, 0 + 5, posY + 12, 48 * 0.85, 48 * 0.85);
        velY += 0.5;
        posY += velY;

        if (posY > targetY) {
        velY *= -0.5;
        bounceCount++;
        if (bounceCount === 1) sounds.drop.play();
        }
        await sleep(1000/60);
    }
    await sleep(1000/60);
    this.drawStaticBoard(x, y, asset);
    newDiv.remove();
    },




    startCoinFollowMouse: async function(asset, turn) {

    const canvas = document.getElementById("board-main-canva-mouse-follow");
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let posX = 0;
    let targetX = 0;
    let mouseOverBoardX = 0;
    boardDisplayVar.mouseClicked = false;

    const mouseOverlay = document.getElementById("board-mouse-overlay");
    mouseOverlay.addEventListener("mousemove", this.setMousePosVar);
    mouseOverlay.addEventListener("mousedown", this.eventMouseClick);

    while (!boardDisplayVar.mouseClicked) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas
        if (boardDisplay.stopAnimation) {
            return -1;
        }
        targetX = clamp(boardDisplayVar.mouseX * (395/500) - 24, 0, 423-48);
        targetX = Math.round((targetX - 8) / 60) * 60 + 8; // snap to grid
        mouseOverBoardX = Math.floor((targetX - 8) / 60); // calculate the column index
        posX += (targetX - posX) * 0.7; // smoothly move towards the target position
        ctx.drawImage(asset, posX, 0, 48, 48); 

        await sleep(1000 / 60);

        if (boardDisplayVar.mouseClicked) {
            console.log("clicked");
            if (!boardMain.isSlotEmpty(mouseOverBoardX, 0)) {
                console.log("slot full");
                boardDisplayVar.mouseClicked = false;
            }
        }

        if (peerConnectedUUID === null) {
            return;
        }
    }
    mouseOverlay.removeEventListener("mousemove", this.setMousePosVar);
    mouseOverlay.removeEventListener("mousedown", this.eventMouseClick);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let dropData = boardMain.drop(mouseOverBoardX, turn);

    this.createCoinDropAnimation(mouseOverBoardX, dropData.y, asset);

    return dropData;
    }
    
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}




