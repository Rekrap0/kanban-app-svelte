import { Server } from 'socket.io';

export const handle = async ({ event, resolve }) => {
  const socketIoServer = new Server();

  // This could be used to manage WebSocket connections or other server-side tasks
  socketIoServer.on('connection', (socket) => {
    console.log('A user connected');

    // Example: Listen for a custom event from the client
    socket.on('chat message', (msg) => {
      console.log('Message received: ', msg);
      socket.emit('chat message', `Server: ${msg}`);
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });

  // Proceed with handling the normal SvelteKit request
  const response = await resolve(event);
  
  // Return the response, even though this is where socket.io would be handled separately
  return response;
};




// import { building } from '$app/environment';

// let io;

// export const handle = async ({ event, resolve }) => {
//   // Skip Socket.IO initialization during build
//   if (!building) {
//     const server = event.platform?.server || event.server;
//     console.log('Server:', server);

//     if (!io && server) {
//       io = new Server(server, {
//         cors: {
//           origin: '*', 
//           methods: ['GET', 'POST']
//         }
//       });

//       console.log('Socket.IO server started');

//       io.on('connection', (socket) => {
//         console.log('Client connected:', socket.id);

//         socket.on('updateCard', (data) => {
//           console.log('Card updated:', data);
//           io.emit('cardUpdated', data);
//           fireWebhook(data);
//         });

//         socket.on('disconnect', () => {
//           console.log('Client disconnected:', socket.id);
//         });
//       });
//     }
//   }

//   const response = await resolve(event);
//   return response;
// };

// async function fireWebhook(data) {
//   try {
//     const response = await fetch('https://n8n.your-instance.com/webhook/kanban-update', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data)
//     });

//     if (!response.ok) {
//       console.error('Webhook failed:', await response.text());
//     }
//   } catch (error) {
//     console.error('Error firing webhook:', error);
//   }
// }