const { prepareDataForWebhook, postDataToSourceForBet } = require('../../utilities/common-function');
const { addSettleBet, addRoundStats, insertBets } = require('./bets-db');
const { appConfig } = require('../../utilities/app-config');
const { deleteCache, setCache, getCache } = require('../../utilities/redis-connection');
const { logEventAndEmitResponse } = require('../../utilities/helper-function');
const getLogger = require('../../utilities/logger');
const { sendToQueue } = require('../../utilities/amqp');
const logger = getLogger('Bets', 'jsonl');
const cashoutLogger = getLogger('Cashout', 'jsonl');
const settlBetLogger = getLogger('Settlement', 'jsonl');
const statsLogger = getLogger('RoundStats', 'jsonl');
const failedBetsLogger = getLogger('userFailedBets', 'log');
const cancelBetsLogger = getLogger('cancelledBet', 'jsonl');
const failedCashoutLogger = getLogger('failedCashout', 'jsonl');
const failedCancelledBetLogger = getLogger('failedCancelledBets', 'jsonl')
const userLocks = new Map();

const initBet = async (io, socket, data) => {
    const [message, ...restData] = data;
    switch (message) {
        case 'PB':
            return placeBet(io, socket, restData);
        case 'CO':
            return cashOut(io, socket, restData);
        case 'CB':
            return cancelBet(io, socket, restData);
    }
}

let bets = [];
let lobbyData = {};

const setCurrentLobby = (data) => {
    lobbyData = data;
};

const placeBet = async (io, socket, [lobby_id, betAmount, chip]) => {
    const playerDetails = await getCache(`PL:${socket.id}`);
    if (!playerDetails) return socket.emit('betError', 'Invalid Player Details');
    const parsedPlayerDetails = JSON.parse(playerDetails);
    const { userId, operatorId, token, game_id, balance, id, image } = parsedPlayerDetails;
    const data = { user_id: userId, operator_id: operatorId, lobby_id, betAmount, chip };
    if (lobbyData.lobbyId != lobby_id) {
        return logEventAndEmitResponse(socket, data, 'Bets has been closed for this Round', 'bet');
    }
    const timeDifference = (Date.now() - lobby_id) / 1000;
    if (timeDifference > 10) {
        return logEventAndEmitResponse(socket, data, 'Bets has been closed for this Round', 'bet');
    }
    const releaseLock = await acquireLock(`${operatorId}:${userId}`);
    try {
        if (Number(betAmount) < appConfig.minBetAmount || Number(betAmount) > appConfig.maxBetAmount) {
            return logEventAndEmitResponse(socket, data, 'Invalid Bet', 'bet');
        }
        const bet_id = `B:${lobby_id}:${userId}:${operatorId}:${betAmount}:${chip}:${Date.now().toString(36)}`;
        const betObj = { bet_id, token, bet_amount: Number(betAmount), socket_id: parsedPlayerDetails.socketId };
        if (Number(betAmount) > Number(balance)) {
            return logEventAndEmitResponse(socket, data, 'Insufficient Balance', 'bet');
        }
        const webhookData = await prepareDataForWebhook({ lobby_id, betAmount, game_id, bet_id, user_id: userId }, "DEBIT", socket);
        betObj.webhookData = webhookData;

        parsedPlayerDetails.balance = Number(balance - Number(betAmount)).toFixed(2);
        await setCache(`PL${socket.id}`, JSON.stringify(parsedPlayerDetails));
        bets.push(betObj);
        logger.info(JSON.stringify({ req: data, res: betObj }));
        socket.emit("info", { id, user_id: userId, operator_id: operatorId, balance: parsedPlayerDetails.balance, avatar: image });
        return io.emit("bet", { bet_id });
    } catch (error) {
        return logEventAndEmitResponse(socket, data, 'Something went wrong, while placing bet', 'bet');
    } finally {
        releaseLock();
    }
}

// const removeBetObjAndEmit = async (bet_id, bet_amount, user_id, operator_id, socket_id, io) => {
//     const releaseLock = await acquireLock(`${operator_id}:${user_id}`);
//     try {
//         bets = bets.filter(e => e.bet_id !== bet_id);
//         let userData = await getUserData(user_id, operator_id);
//         if (userData) {
//             userData.balance = (Number(userData.balance) + Number(bet_amount)).toFixed(2);
//             await setCache(`${operator_id}:${user_id}`, JSON.stringify(userData));
//             io.to(socket_id).emit("info", userData);
//         }
//         failedBetsLogger.error(JSON.stringify({ req: bet_id, res: 'bets cancelled by upstream' }));
//         io.emit("bet", { bet_id: bet_id, action: "cancel" });
//     } catch (err) {
//         console.error(`[ERR] while removing bet from betObj is::`, err);
//     } finally {
//         releaseLock();
//     }
// }


const settleCallBacks = async (io) => {
    try {
        if (bets.length === 0) return;
        console.log(`Settling webhook callbacks`);
        const results = await Promise.allSettled(bets.map(postDataToSourceForBet));
        const processResults = results.map(result => result.status === 'fulfilled' ? handleFulfilledResult(result.value, io) : handleRejectedResult(result.reason, io));
        await Promise.all(processResults);
    } catch (err) {
        console.error(err);
    }

}

const handleFulfilledResult = async (value, io) => {
    try {
        return true;
        // const { socket_id, status, bet_id } = value;
        // const [b, lobby_id, bet_amount, user_id, operator_id, identifier] = bet_id.split(":");
        // if (status === 200) {
        //     await insertBets(value);
        // } else {
        //     await removeBetObjAndEmit(bet_id, bet_amount, user_id, operator_id, socket_id, io);
        //     io.to(socket_id).emit("betError", "bets cancelled by upstream");
        // }
    } catch (err) {
        console.error(er);
    }

}

const handleRejectedResult = async (reason, io) => {
    try {
        return false;
        // const { response, socket_id, bet_id } = reason;
        // const [b, lobby_id, bet_amount, user_id, operator_id, identifier] = bet_id.split(":");
        // if (response?.data?.msg === "Invalid Token or session timed out") {
        //     await removeBetObjAndEmit(bet_id, bet_amount, user_id, operator_id, socket_id, io);
        //     await deleteCache(`${operator_id}:${user_id}`);
        //     io.to(socket_id).emit("logout", "user logout");
        // }
        // await removeBetObjAndEmit(bet_id, bet_amount, user_id, operator_id, socket_id, io);
        // io.to(socket_id).emit("betError", "bets cancelled by upstream");

    } catch (er) {
        console.error(er);
    }

}



const cancelBet = async (io, socket, [...bet_id]) => {
    const playerDetails = await getCache(`PL:${socket.id}`);
    if (!playerDetails) return socket.emit('betError', 'Invalid Player Details');
    const parsedPlayerDetails = JSON.parse(playerDetails);
    try {
        bet_id = bet_id.join(':');
        let canObj = { bet_id, player: parsedPlayerDetails };
        if (lobbyData.lobbyId !== lobby_id && lobbyData.status != 0) return logEventAndEmitResponse(socket, canObj, 'Round has been closed cancel bet event', 'cancelledBet');
        const betObj = bets.find(e => e.bet_id === bet_id);
        if (!betObj) return logEventAndEmitResponse(socket, canObj, 'No active bets for given bet id', 'cancelledBet');
        parsedPlayerDetails.balance = (Number(parsedPlayerDetails.balance) + betObj.betAmount).toFixed(2);
        await setCache(`PL:${socket.id}`, JSON.stringify(parsedPlayerDetails));
        socket.emit("info", { user_id: parsedPlayerDetails.userId, operator_id: parsedPlayerDetails.operatorId, balance: parsedPlayerDetails.balance});
        cancelBetsLogger.info(JSON.stringify({ req: canObj, res: betObj }));
        bets = bets.filter(e => e.bet_id !== bet_id);
        return io.emit("bet", { bet_id: bet_id, action: "cancel" });
    } catch (error) {
        console.error(error);
        return logEventAndEmitResponse(socket, canObj, 'Something went wrong while cancelling the bet', 'cancelledBet')
    }
}


const acquireLock = async (user_id) => {
    while (userLocks.get(user_id)) {
        await userLocks.get(user_id);
    }

    let resolveLock;
    const lockPromise = new Promise((resolve) => {
        resolveLock = resolve;
    });

    userLocks.set(user_id, lockPromise);

    return () => {
        resolveLock();
        userLocks.delete(user_id);
    };
};

const settleBet = async (io, data) => {
    try {
        if(bets.length > 0){
            await Promise.all(bets.map(bet=> {
                const [initial, lobby_id, user_id, operator_id, bet_amount, chip, identifier] = bet.bet_id.split(':');
                
            }))
        }
        // Clear bets and settlements arrays
        bets.length = 0;
    } catch (error) {
        console.error('Error settling bets:', error);
        logEventAndEmitResponse(io, {}, 'Something went wrong while settling bet', 'settlement');
    }
};



module.exports = { initBet, settleCallBacks, setCurrentLobby };
