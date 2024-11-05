const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Game data
let activeBets = [];

// Socket connection
io.on('connection', socket => {
    console.log('A user connected:', socket.id);

    socket.on('placeBet', bet => {
        console.log(bet)
        activeBets.push({ user: socket.id, ...bet });
        io.emit('betPlaced', activeBets);
    });

    socket.on('startRound', () => {
        const diceRoll = rollDice();
        const results = calculatePayouts(diceRoll, activeBets);
        io.emit('roundResults', { diceRoll, results });
        activeBets = [];
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

function rollDice() {
    const colors = ['red', 'white', 'blue', 'green', 'yellow', 'pink'];
    return [0, 0, 0].map(() => colors[Math.floor(Math.random() * colors.length)]);
}

function calculatePayouts(diceRoll, bets) {
    return bets.map(bet => {
        let payout = 0;
        const matches = diceRoll.filter(color => color === bet.color).length;
        if (matches === 1) payout = 1 * bet.amount;
        if (matches === 2) payout = 2 * bet.amount;
        return { user: bet.user, payout };
    });
}

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
