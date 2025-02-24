import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handler } from './build/handler.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import { getDatabase } from './src/lib/db.js';

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

// Serve static files
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'build')));

// Initialize database connection
let db;
(async () => {
    db = await getDatabase();
})();

// Socket.IO connection handling
io.on('connection', async (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('fetchBoards', async (callback) => {
        try {
            const boards = await db.getBoards();
            socket.emit('boardsFetched', boards);
            if (callback) callback(null, boards);
        } catch (error) {
            console.error('Error fetching boards:', error);
            if (callback) callback(error);
        }
    });


    socket.on('createBoard', async (board, callback) => {
        try {
            await db.createBoard(board);
            console.log('Board created:', board);
            
            // socket.broadcast.emit('boardCreated', board);
            if (callback) callback();
        } catch (error) {
            console.error('Error creating board:', error);
            if (callback) callback(error);
        }
    });

    socket.on('updateBoard', async (board, callback) => {
        try {
            await db.updateBoard(board);
            console.log('Board updated:', board);
            
            socket.broadcast.emit('boardUpdated', board);
            if (callback) callback();
        } catch (error) {
            console.error('Error updating board:', error);
            if (callback) callback(error);
        }
    });

    socket.on('updateCard', async (updatedCard, callback) => {
        try {
            await db.updateCard(updatedCard);
            console.log('Card updated:', updatedCard);
            
            socket.broadcast.emit('cardUpdated', updatedCard);
            if (callback) callback();
        } catch (error) {
            console.error('Error updating card:', error);
            if (callback) callback(error);
        }
    });

    socket.on('newCard', async (newCard, callback) => {
        try {
            await db.createCard(newCard);
            console.log('Card created:', newCard);
            
            socket.broadcast.emit('cardAdded', newCard);
            if (callback) callback();
        } catch (error) {
            console.error('Error creating card:', error);
            if (callback) callback(error);
        }
    });

    socket.on('deleteCard', async (removedCard, callback) => {
        try {
            await db.deleteCard(removedCard.id);
            console.log('Card removed:', removedCard);
            
            socket.broadcast.emit('cardRemoved', removedCard);
            if (callback) callback();
        } catch (error) {
            console.error('Error deleting card:', error);
            if (callback) callback(error);
        }
    });

    socket.on('joinBoard', async (boardId) => {
        socket.join(`board-${boardId}`);
        try {
            const board = await db.getBoard(boardId);
            const cards = await db.getCards(boardId);
            socket.emit('boardDataReceived', board, cards);
        } catch (error) {
            console.error('Error fetching board:', error);
        }
        console.log(`User joined board: ${boardId}`);
    });

    socket.on('leaveBoard', (boardId) => {
        socket.leave(`board-${boardId}`);
        console.log(`User left board: ${boardId}`);
    });

    socket.on('getCard', async (cardId) => {
        try {
            const card = await db.getCard(cardId);
            socket.emit('cardDataReceived', card);
        } catch (error) {
            console.error('Error fetching card:', error);
        }
    });

    socket.on('fetchNotes', async (callback) => {
        try {
            const notes = await db.getNotes();
            socket.emit('notesFetched', notes);
            if (callback) callback(null, notes);
        } catch (error) {
            console.error('Error fetching card:', error);
            if (callback) callback(error);
        }
    });

    socket.on('createNote', async (newNote, callback) => {
        try {
            await db.createNote(newNote);
            console.log('Note created:', newNote);
            
            socket.broadcast.emit('noteAdded', newNote);
            if (callback) callback();
        } catch (error) {
            console.error('Error creating note:', error);
            if (callback) callback(error);
        }
    });

    socket.on('getNote', async (noteId) => {
        try {
            const note = await db.getNote(noteId);
            socket.emit('noteDataReceived', note);
        } catch (error) {
            console.error('Error fetching note:', error);
        }
    });

    socket.on('updateNote', async (updateNote, callback) => {
        try {
            await db.updateNote(updateNote);
            console.log('Note updated:', updateNote);
            
            socket.broadcast.emit('noteUpdated', updateNote);
            if (callback) callback();
        } catch (error) {
            console.error('Error updating note:', error);
            if (callback) callback(error);
        }
    });

});

// Handle SvelteKit SSR
app.use(handler);

// Fallback for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});