const sleep = ms => new Promise(r => setTimeout(r, ms));
const { insertLobbies } = require('./db');
const createLogger = require('../../utilities/logger');
const { setCurrentLobby, settleBet } = require('../bets/bets-message');
const logger = createLogger('Color', 'jsonl');

const initColor = async (io) => {
    logger.info("lobby started");
    initLobby(io);
}


const initLobby = async (io) => {
    if(Number(process.env.ROUND_COUNT) >= 20) process.exit(1);
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

    await settleBet(io, result, lobbyId);
    await sleep(2000);

    recurLobbyData['status'] = 2;
    setCurrentLobby(recurLobbyData);
    for (let z = 1; z <= end_delay; z++) {
        io.emit('message', {eventName: "color", data: {message: `${lobbyId}:${z}:ENDED`}});
        await sleep(1000);
    }

    const history = { time: new Date(), lobbyId, start_delay, end_delay, result };
    io.emit("history", JSON.stringify(history));
    logger.info(JSON.stringify(history));
    await insertLobbies(history);
    process.env.ROUND_COUNT++;
    return initLobby(io);
}


module.exports = { initColor }
