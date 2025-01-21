const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Serve static files from the 'public' folder

// Handle socket connections
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins a room
    socket.on('join-room', (roomId) => {
        socket.join(roomId); // Add the user to the room
        console.log(`User ${socket.id} joined room ${roomId}`);

        // Notify others in the room that a new user has joined
        socket.to(roomId).emit('user-joined', socket.id);
    });

    // Handle call offer
    socket.on('offer', (offer, roomId) => {
        socket.to(roomId).emit('offer', offer, socket.id);
    });

    // Handle call answer
    socket.on('answer', (answer, toSocketId) => {
        io.to(toSocketId).emit('answer', answer);
    });

    // Handle ICE candidate exchange
    socket.on('ice-candidate', (candidate, toSocketId) => {
        io.to(toSocketId).emit('ice-candidate', candidate);
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Serve the room page dynamically
app.get('/room/:roomId', (req, res) => {
    res.sendFile(__dirname + '/public/room.html');
});

// Start the server
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});


