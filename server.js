// setting up express, http, socketIo, and the app
const express = require('express'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io');

// setting up the server
const server = http.createServer(app);
const io = socketIo.listen(server);
server.listen(8080);

// telling express to use the public directory for files
app.use(express.static(__dirname + '/public'));
console.log('Server running on localhost:8080');

// keeps track of lines ever drawn
const line_history = [];

// when a new client connects, socket of new client is passed as argument.
io.on('connection', (socket) => {
    // send all the lines that have been drawn to the new client, that way a new person to connect
    // sees the current drawing rather than the lines drawn since joining
    for (let i in line_history) {
        socket.emit('draw_line', { line: line_history[i][0], lineColor: line_history[i][1] });
    }

    // handler for our new message 'draw_line', each time a line is received, add it to line history and send it to
    // connected clients so their canvas updates
    socket.on('draw_line', (data) => {
        line_history.push([data.line, data.lineColor]);
        io.emit('draw_line', { line: data.line, lineColor: data.lineColor });
    });

    socket.on('clear_lines', () => {
        line_history.splice(0);
        io.emit('clear_lines', true);
    });
});
