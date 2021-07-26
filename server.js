// setting up express, http, socketIo, and the app
import express from 'express';
const app = express();
import { createServer } from 'http';
import { writeFile, readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { Server } from 'socket.io';
import path from 'path';

const __dirname = path.resolve();

// setting up the server
const server = createServer(app);
const io = new Server(server);
server.listen(8080);

// telling express to use the public directory for files
app.use(express.static(path.join(__dirname + '/public')));
console.log('Server running on localhost:8080');

// keeps track of lines ever drawn
const line_history = [];

// times out saving so it cant be abused
let save_timeout_enabled = false;
const save_timeout_length = 60;

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

  socket.on('save_canvas', (data) => {
    if (save_timeout_enabled === false) {
      const canvasFile = path.join(__dirname, '/data/', Date.now() + '.png');
      console.log(canvasFile);
      writeFile(canvasFile, data, (err) => {
        if (err) throw err;
      });
      save_timeout_enabled = true;
      setTimeout(() => (save_timeout_enabled = false), save_timeout_length);
    }
  });

  socket.on('load_canvas_overlay', () => {
    const canvasesDir = path.join(__dirname, '/data/');
    const savedCanvases = [];
    const files = readdirSync(canvasesDir);
    files.forEach((file) => {
      if (file.endsWith('png')) {
        savedCanvases.push(readFileSync(resolve(canvasesDir, file), 'utf8'));
      }
    });
    io.emit('load_canvas_overlay', savedCanvases);
  });
});
