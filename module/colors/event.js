const sleep = ms => new Promise(r => setTimeout(r, ms));
const { insertLobbies } = require('./db');
const createLogger = require('../../utilities/logger');
const { setCurrentLobby, settleCallBacks, settleBet } = require('../bets/bets-message');
const logger = createLogger('Color', 'jsonl');

const initColor = async (io) => {
    logger.info("lobby started");
    initLobby(io);
}


const initLobby = async (io) => {
    const lobbyId = Date.now();
    let recurLobbyData = { lobbyId, status: 0};
    setCurrentLobby(recurLobbyData);
    const start_delay = 10;
    const result = Math.floor(Math.random() * 10);
    const end_delay = 12;
    
    for (let x = 1; x <= start_delay; x++) {
        io.emit("message", {eventName: 'color', data: {message: `${lobbyId}:${x}:STARTING`}});
        await sleep(1000);
    }


    io.emit('message', {eventName: 'color', data: {message: `${lobbyId}:0:CALCULATING`}})
    await sleep(1000);

    recurLobbyData['status'] = 1;
    setCurrentLobby(recurLobbyData);
    io.emit("message", {eventName: 'color', data: {message: `${lobbyId}:${result}:RESULT`}});
    
    await sleep(2000);
    await settleBet(io, result, lobbyId);

    recurLobbyData['status'] = 2;
    setCurrentLobby(recurLobbyData);
    for (let z = 1; z <= end_delay; z++) {
        if(z == 6){
            
        }
        io.emit('message', {eventName: "color", data: {message: `${lobbyId}:${z}:ENDED`}});
        await sleep(1000);
    }

    const history = { time: new Date(), lobbyId, start_delay, end_delay, result };
    io.emit("history", JSON.stringify(history));
    logger.info(JSON.stringify(history));
    await insertLobbies(history);
    return initLobby(io);
}


module.exports = { initColor }
