import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
	withCredentials: true
});

// Listen for connection
socket.on('connect', () => {
	console.log('Connected to server');
});

export { socket };

// export const socket = browser
//   ? io('http://localhost:3000')
//   : null;

// let socket;

// if (browser) {
//   socket = io('http://localhost:5173'); // Replace with your backend server URL
// }

// if (socket) {
//   socket.on('cardUpdated', (data) => {
//     // Handle card updates
//     console.log('Card updated:', data);
//   });
// }

// function updateCard(cardData) {
//   if (socket) {
//     socket.emit('updateCard', cardData);
//   }
// }
