import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handler } from './build/handler.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Enable CORS for Express
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
}));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Serve static files from the 'build' directory
app.use(express.static(path.join(__dirname, 'build')));

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    // Add your custom socket events here
    // Example:
    // socket.on('custom-event', (data) => {
    //     console.log('Received:', data);
    //     io.emit('custom-response', { message: 'Processed data' });
    // });
});

// Handle SvelteKit SSR
app.use(handler);

// Fallback for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Use server.listen instead of app.listen for Socket.IO
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});