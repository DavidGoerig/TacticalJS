import DatabaseInstance from './controllers/mongodb'
import AccountInstance from './controllers/account'
import SocketIO  from 'socket.io'
import express from 'express';
import http from 'http';

let app = express();
let server = http.Server(app);
let io = new SocketIO(server);
let port = process.env.PORT || 3000;
let sockets = {};

io.on('connection', (socket) => {

    socket.on('ding', () => {
        socket.emit('dong');
    });

    socket.on('disconnect', () => {
   });
});

server.listen(port, () => {
    console.log('[INFO] Listening on *:' + port);
});
