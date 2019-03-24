const socket = io.connect();

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

function clear_lines() {
    socket.emit('clear_lines', true);
}

function load_canvas() {
    socket.emit('load_canvas');
}

function getRandomColor() {
    let color = 'rgb(';
    for (let i = 0; i < 3; i++) {
      color += Math.floor(Math.random() * 255) + ', ';
    }
    color = color.slice(0, color.length-2);
    color += ')';
    console.log(color);
    return color;
}


document.addEventListener('DOMContentLoaded', () => {
    const yourColor = getRandomColor();
    const mouse = {
        click: false,
        move: false,
        pos: {x:0, y:0},
        pos_prev: false
    };
    const touch = {
        click: false,
        move: false,
        pos: false,
        pos_prev: false
    };

    const canvas = document.getElementById('drawing');
    const context = canvas.getContext('2d');
    const width = window.innerWidth-50;
    const height = 512;

    canvas.width = width;
    canvas.height = height;

    canvas.onmousedown = ((e) => { 
        mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y}; 
        mouse.click = true;
    });
    canvas.onmouseup = ((e) => mouse.click = false);
    // have to normalize the mouse position to make sure canvases are using the same equal size no matter the screen size
    canvas.onmousemove = ((e) => {
        const pos = getMousePos(canvas, e);
        mouse.pos.x = pos.x / width;
        mouse.pos.y = pos.y / height;
        mouse.move = true;
    });
  
    // Touch Events:
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touch.pos = {x: (e.changedTouches[0].pageX / width), y: (e.changedTouches[0].pageY / height) - .25 };
        touch.click = true;
    });
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        touch.click = false;
        touch.move = false;
    });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        touch.pos_prev = touch.pos;
        touch.pos = {x: (e.changedTouches[0].pageX / width), y: (e.changedTouches[0].pageY / height) - .25 };
        touch.move = true;
    });

    // draws every line individually.
    // start a path, move to first point (moveTo), then draw a line to the second received point (lineTo)
    // last call context.stroke() to actually draw the line
    socket.on('draw_line', (data) => {
        const line = data.line;
        const lineColor = data.lineColor;
        context.beginPath();
        context.lineCap = 'round';
        context.lineWidth = 4;
        // line[0] == currPos, line[1] == prevPos
        context.moveTo(line[0].x * width, line[0].y * height);
        context.lineTo(line[1].x * width, line[1].y * height);
        context.strokeStyle = lineColor;
        context.stroke();
        context.closePath();
    });

    const main = function mainLoop() {
        if (mouse.click && mouse.move && mouse.pos_prev) {
            socket.emit('draw_line', { line: [mouse.pos, mouse.pos_prev ], lineColor: yourColor });
            mouse.move = false;
        }
      
        if (touch.click && touch.move && touch.pos_prev) {
           socket.emit('draw_line', { line: [touch.pos, touch.pos_prev], lineColor: yourColor }); 
           touch.move = false;
        }

        mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
        setTimeout(mainLoop, 1);
    }();

    socket.on('clear_lines', () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
    });

    const saveButton = document.getElementById('save-canvas-btn');
    saveButton.addEventListener('click', () => {
        socket.emit('save_canvas', canvas.toDataURL('image/png') );
    });

    socket.on('load_canvas', (data) => {
        const areaToPutCanvas = document.getElementById('load-canvas');
        const loadedCanvas = document.createElement('img');
        loadedCanvas.src = data;
        areaToPutCanvas.appendChild(loadedCanvas);
    });

});
