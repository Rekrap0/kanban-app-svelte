import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
	withCredentials: true
});

// Listen for connection
socket.on('connect', () => {
	console.log('Connected to server');
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
});

export { socket };
