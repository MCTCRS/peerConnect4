const EMPTY = 0;

class Board {

    constructor() {
        //debuglog("construct Board");

        //create board
        this.tiles = Array.from({length: 6}, (_value, _index) => new Array(7).fill(EMPTY));
    }
    
    clear() {
    for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 7; x++) {
            this.tiles[y][x] = EMPTY;
            }
        }
    }


    getSlot(x, y) {
        if (this.isOutOfBound(x, y)) return 0;
        return this.tiles[y][x];
    }

    isOutOfBound(x, y) {
        if (x > 6) return true;
        if (y > 5) return true;
        if (x < 0) return true;
        if (y < 0) return true;
        return false;
    }

    setSlot(x, y, v) {
        this.tiles[y][x] = v;
    }

    isSlotEmpty(x, y) {

        //out of bound
        if (this.isOutOfBound(x, y)) return false;

        //check
        return this.tiles[y][x] === EMPTY;
    }

    drop(x, turn) {

        //check if full
        if (!this.isSlotEmpty(x, 0)) {
            //debuglog("drop fail: full");
            return {success: false, x: undefined, y: undefined};
        }

        //fall
        let y_var = 0;
        while (this.isSlotEmpty(x, y_var + 1)) {
            y_var++;
        }

        //set slot
        this.setSlot(x, y_var, turn);

        return {success: true, x: x, y: y_var};

    }

    checkWinLine(x, y) {

        const checked_win = this.check_win(x, y);

        if (!checked_win.won) return {won: false, list: []};

        const won_list = checked_win.list;

        //get least x and y pos
        const returnObj = {
            won: true,
            list: [],
            dir: "",
            turn: 0,
            pivot: []
        };
        let minX = Infinity;
        let minY = Infinity;
        let currPos;
        for (currPos of won_list) {
            if (currPos[0] < minX) minX = currPos[0];
            if (currPos[1] < minY) minY = currPos[1];
        }

        console.log("minX: ", minX, "minY: ", minY);

        let currTurn = this.getSlot(minX, minY);

        /*
        if (this.getSlot(minX,minY + 1) === currTurn) {
            returnObj.dir = "verti";
        }

        else if (this.getSlot(minX + 1,minY + 1) === currTurn) {
            returnObj.dir = "down";
        }

        else if (this.getSlot(minX + 1,minY - 1) === currTurn) {
            returnObj.dir = "up";
        }

        else if (this.getSlot(minX + 1,minY) === currTurn) {
            returnObj.dir = "horiz";
        }
        */

        returnObj.dir = checked_win.dir;

        returnObj.pivot = [minX, minY];

        returnObj.list = won_list;
        returnObj.turn = currTurn;

        return returnObj;
        
        
    }

    check_win(x, y) {
        //check current slot
        if (this.isSlotEmpty(x, y)) return false;

        //slot turn
        const turn = this.getSlot(x, y);

        let check_y;
        let connect_count;
        let connect_list;

        //verticle checks
        for (let varti_d = 0; varti_d < 4; varti_d++) {

            connect_count = 0;
            connect_list = [];

            for (let verti_d_4 = 0; verti_d_4 < 4; verti_d_4++) {
                check_y = y + verti_d_4 - varti_d;

                if (this.isOutOfBound(x, check_y)) break;

                if (this.getSlot(x, check_y) === turn) {
                    connect_count++;
                    connect_list.push([x, check_y]);
                };
            }

            if (connect_count === 4) {
                return {won: true, list: connect_list, dir:"verti"};
            }
        }
        

        let check_x;
        //horizontal checks
        for (let horiz = 0; horiz < 4; horiz++) {

            connect_count = 0;
            connect_list = [];

            for (let horiz_s_4 = 0; horiz_s_4 < 4; horiz_s_4++) {
                check_x = x + horiz_s_4 - horiz;

                if (this.isOutOfBound(check_x, y)) break;

                if (this.getSlot(check_x, y) === turn) {
                    connect_count++;
                    connect_list.push([check_x, y]);
                };
                
            }

            if (connect_count === 4) {
                return {won: true, list: connect_list, dir:"horiz"};
            }
        }


        let ld_offset;
        
        //for both diagonal check \ and /
        for (let diagonal_filpped = -1; diagonal_filpped < 2; diagonal_filpped += 2) {

            for (let diagonal_offset = 0; diagonal_offset < 4; diagonal_offset++) {

                connect_count = 0;
                connect_list = [];

                for (let diagonal_ld_4 = 0; diagonal_ld_4 < 4; diagonal_ld_4++) {
                    
                    ld_offset = diagonal_offset - diagonal_ld_4;
                    check_x = x + (ld_offset * diagonal_filpped);
                    check_y = y + ld_offset;
                    
                    if (this.isOutOfBound(check_x, check_y)) break;

                    if (this.getSlot(check_x, check_y) === turn) {
                        connect_count++;
                        connect_list.push([check_x, check_y]);
                    }
                }

                if (connect_count === 4) {
                    return {won: true, list: connect_list, dir: (diagonal_filpped === -1) ? "up" : "down"};
                }
            }

        }

        return {won: false, list: []};
    }



}