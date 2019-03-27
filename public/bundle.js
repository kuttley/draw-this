(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
    const shake = require('shake.js');
    
    const socket = io.connect();
    
    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
    }
    
    function getRandomColor() {
        let color = 'rgb(';
        for (let i = 0; i < 3; i++) {
          color += Math.floor(Math.random() * 255) + ', ';
        }
        color = color.slice(0, color.length-2);
        color += ')';
        return color;
    }
    
    
    document.addEventListener('DOMContentLoaded', () => {
      
        // shake event handling
        const shakeEvent = new shake({
            threshold: 15,
        });
        shakeEvent.start();
        window.addEventListener('shake', shakeEventOccur, false);
        function shakeEventOccur() {
            socket.emit('clear_lines', true);
        }
      
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
        
        const clearButton = document.getElementById('clear-canvas-btn');
        clearButton.addEventListener('click', () => {
          socket.emit('clear_lines', true);
        });
    
        const saveButton = document.getElementById('save-canvas-btn');
        saveButton.addEventListener('click', () => {
            socket.emit('save_canvas', canvas.toDataURL('image/png') );
            saveButton.setAttribute('disabled', true);
            setTimeout(() => {saveButton.removeAttribute('disabled')}, 60000);
        });
    
        const loadButton = document.getElementById('load-canvas-btn');
        loadButton.addEventListener('click', () => {
          socket.emit('load_canvas_overlay');
        });
    
        socket.on('load_canvas_overlay', (canvases) => {
            const carouselInner = document.getElementById('carousel-inner');
            while(carouselInner.firstChild != null) {
                carouselInner.removeChild(carouselInner.firstChild);
            }
    
            canvases.forEach(canvas => {
                const carouselItemDiv = document.createElement('div');
                carouselItemDiv.classList.add('carousel-item', 'p-4');
                const canvasImage = document.createElement('img');
                canvasImage.classList.add('carousel-canvas-img', 'img-fluid', 'img-thumbnail');
                canvasImage.src = canvas;
                carouselItemDiv.appendChild(canvasImage);
                carouselInner.appendChild(carouselItemDiv);
            });
            carouselInner.firstElementChild.classList.add('active');
        });
    
    });
    
    },{"shake.js":2}],2:[function(require,module,exports){
    /*
     * Author: Alex Gibson
     * https://github.com/alexgibson/shake.js
     * License: MIT license
     */
    
    (function(global, factory) {
        if (typeof define === 'function' && define.amd) {
            define(function() {
                return factory(global, global.document);
            });
        } else if (typeof module !== 'undefined' && module.exports) {
            module.exports = factory(global, global.document);
        } else {
            global.Shake = factory(global, global.document);
        }
    } (typeof window !== 'undefined' ? window : this, function (window, document) {
    
        'use strict';
    
        function Shake(options) {
            //feature detect
            this.hasDeviceMotion = 'ondevicemotion' in window;
    
            this.options = {
                threshold: 15, //default velocity threshold for shake to register
                timeout: 1000 //default interval between events
            };
    
            if (typeof options === 'object') {
                for (var i in options) {
                    if (options.hasOwnProperty(i)) {
                        this.options[i] = options[i];
                    }
                }
            }
    
            //use date to prevent multiple shakes firing
            this.lastTime = new Date();
    
            //accelerometer values
            this.lastX = null;
            this.lastY = null;
            this.lastZ = null;
    
            //create custom event
            if (typeof document.CustomEvent === 'function') {
                this.event = new document.CustomEvent('shake', {
                    bubbles: true,
                    cancelable: true
                });
            } else if (typeof document.createEvent === 'function') {
                this.event = document.createEvent('Event');
                this.event.initEvent('shake', true, true);
            } else {
                return false;
            }
        }
    
        //reset timer values
        Shake.prototype.reset = function () {
            this.lastTime = new Date();
            this.lastX = null;
            this.lastY = null;
            this.lastZ = null;
        };
    
        //start listening for devicemotion
        Shake.prototype.start = function () {
            this.reset();
            if (this.hasDeviceMotion) {
                window.addEventListener('devicemotion', this, false);
            }
        };
    
        //stop listening for devicemotion
        Shake.prototype.stop = function () {
            if (this.hasDeviceMotion) {
                window.removeEventListener('devicemotion', this, false);
            }
            this.reset();
        };
    
        //calculates if shake did occur
        Shake.prototype.devicemotion = function (e) {
            var current = e.accelerationIncludingGravity;
            var currentTime;
            var timeDifference;
            var deltaX = 0;
            var deltaY = 0;
            var deltaZ = 0;
    
            if ((this.lastX === null) && (this.lastY === null) && (this.lastZ === null)) {
                this.lastX = current.x;
                this.lastY = current.y;
                this.lastZ = current.z;
                return;
            }
    
            deltaX = Math.abs(this.lastX - current.x);
            deltaY = Math.abs(this.lastY - current.y);
            deltaZ = Math.abs(this.lastZ - current.z);
    
            if (((deltaX > this.options.threshold) && (deltaY > this.options.threshold)) || ((deltaX > this.options.threshold) && (deltaZ > this.options.threshold)) || ((deltaY > this.options.threshold) && (deltaZ > this.options.threshold))) {
                //calculate time in milliseconds since last shake registered
                currentTime = new Date();
                timeDifference = currentTime.getTime() - this.lastTime.getTime();
    
                if (timeDifference > this.options.timeout) {
                    window.dispatchEvent(this.event);
                    this.lastTime = new Date();
                }
            }
    
            this.lastX = current.x;
            this.lastY = current.y;
            this.lastZ = current.z;
    
        };
    
        //event handler
        Shake.prototype.handleEvent = function (e) {
            if (typeof (this[e.type]) === 'function') {
                return this[e.type](e);
            }
        };
    
        return Shake;
    }));
    
    },{}]},{},[1]);
    