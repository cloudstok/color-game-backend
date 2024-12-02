const { getUserDataFromSource } = require("./module/players/player-data");
const { eventRouter } = require("./router/event-router");
const { messageRouter } = require("./router/message-router");
const { getHalls } = require("./utilities/common-function");
const { setCache, deleteCache } = require("./utilities/redis-connection");

let playerCount = Math.floor(Math.random() * (900 - 500 + 1)) + 500;
const initSocket = (io)=> {
    eventRouter(io);  
    initPlayerBase(io);
    const onConnection = async(socket)=>{
        console.log("socket connected");
        const token = socket.handshake.query.token;
        const game_id = socket.handshake.query.game_id;
        if(!token){
            socket.disconnect(true);            
            return console.log("No Token Provided",token);
        }
        const userData = await getUserDataFromSource(token, game_id);
        console.log(userData);
        if(!userData) {
            console.log("Invalid token",token);
            return socket.disconnect(true); 
        };
        playerCount++;
        socket.emit('message', { eventName: 'info', data: { user_id: userData.userId, operator_id: userData.operatorId, balance: userData.balance}});
        await setCache(`PL:${socket.id}`, JSON.stringify({...userData, socketId: socket.id}), 3600);
        socket.emit('message', {eventName: 'rooms' , data: {halls: getHalls()}});
        messageRouter(io, socket);
        socket.on('disconnect', async() => {
            playerCount--;
            await deleteCache(`PL:${socket.id}`)
        });
        socket.on('error', (error) => {
            console.error(`Socket error: ${socket.id}. Error: ${error.message}`);
        });
    }   
    io.on("connection", onConnection);
}


const initPlayerBase = async (io) => {
    try {
        io.emit('message', {eventName: "playerCount", data: {count: `${playerCount}`}});
        setTimeout(() => initPlayerBase(io), 1000);
    } catch (er) {
        console.error(er);
    }

}

module.exports = {initSocket}