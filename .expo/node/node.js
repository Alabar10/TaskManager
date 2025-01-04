// Load environment variables
require('dotenv').config();

// Import necessary libraries
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');

// Initialize the Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",  // Adjust according to your CORS policy
        methods: ["GET", "POST"]
    }
});

// Middleware to handle JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redis client for subscribing to updates
const subscriber = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

// Subscribe to the Redis channel
subscriber.subscribe('updates');

// Handle incoming messages from Redis
subscriber.on('message', (channel, message) => {
    console.log(`Message received from ${channel}: ${message}`);
    io.emit('update', JSON.parse(message));
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Define a route for the Express app
app.get('/', (req, res) => {
    res.send('Hello World! Node.js server is running.');
});

// Listen for requests
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
