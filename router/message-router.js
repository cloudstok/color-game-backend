
const registerEvents = (io, socket) => {
    const events = {};
    for (const [event, handler] of Object.entries(events)) {
        console.log("Registering Event",event);
        socket.on(event, (data) => handler(io, socket, data));
    }
};

module.exports = { registerEvents};