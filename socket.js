const { getUserDataFromSource } = require("./module/players/player-data");
const { eventRouter } = require("./router/event-router");
const { registerEvents } = require("./router/message-router");
const { setCache } = require("./utilities/redis-connection");

const initSocket = (io)=> {
    eventRouter(io);  
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

        socket.emit('info', { user_id: userData.userId, operator_id: userData.operatorId, balance: userData.balance, avatar: userData.image});
        await setCache(`PL:${socket.id}`, JSON.stringify({...userData, socketId: socket.id}), 3600);
        registerEvents(io, socket);
        socket.on('error', (error) => {
            console.error(`Socket error: ${socket.id}. Error: ${error.message}`);
        });
    }   
    io.on("connection", onConnection);
}

module.exports = {initSocket}