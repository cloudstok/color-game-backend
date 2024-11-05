const sleep = ms => new Promise(r => setTimeout(r, ms));
const { insertLobbies } = require('./db');
const createLogger = require('../../utilities/logger');
const { setCurrentLobby, settleCallBacks } = require('../bets/bets-message');
const logger = createLogger('Dice', 'jsonl');

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
    const end_delay = 6;
    
    for (let x = 1; x <= start_delay; x++) {
        io.emit("color", `${lobbyId}:${x}:STARTING`);
        await sleep(1000);
    }

    await settleCallBacks(io);

    recurLobbyData['status'] = 1;
    setCurrentLobby(recurLobbyData);
    await sleep(2000);
    io.emit("color", `${lobbyId}:${result}:RESULT`);

    recurLobbyData['status'] = 2;
    setCurrentLobby(recurLobbyData);
    for (let z = 1; z <= end_delay; z++) {
        io.emit("color", `${lobbyId}:${z}:ENDED`);
        await sleep(1000);
    }

    const history = { time: new Date(), lobbyId, start_delay, end_delay, result };
    io.emit("history", JSON.stringify(history));
    logger.info(JSON.stringify(history));
    // await insertLobbies(history);
    return initLobby(io);
}


module.exports = { initColor }
