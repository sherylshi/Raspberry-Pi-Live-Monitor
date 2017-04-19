//variables
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');

//process to take picture by camera 
var spawn = require('child_process').spawn;
var proc;
 
//static image folder
app.use('/', express.static(path.join(__dirname, 'stream')));
 
//render web html 
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
 
var sockets = {};

//connection 
io.on('connection', function(socket) {
 
  sockets[socket.id] = socket;
  console.log("Total clients connected : ", Object.keys(sockets).length);
 
  socket.on('disconnect', function() {
    delete sockets[socket.id];
 
    //kill the stream
    stopStreaming();
  });
 
  socket.on('start-stream', function() {
    startStreaming(io);
  });

  socket.on('stop-stream', function() {
    stopStreaming();
  });
 
});

//listen to port 3000 
http.listen(3000, function() {
  console.log('listening on *:3000');
});


//stop streaming 
function stopStreaming() {
  app.set('watchingFile', false);
  if (proc) proc.kill();
  fs.unwatchFile('./stream/image_stream.jpg');
}

//start streaming 
function startStreaming(io) {
 
  if (app.get('watchingFile')) {
    io.sockets.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100));
    return;
  }
  //args for taking picture 
  var args = ["-w", "640", "-h", "480", "-o", "./stream/image_stream.jpg", "-t", "999999999", "-tl", "1000"];
  proc = spawn('raspistill', args);
 
  console.log('Watching for changes...');
 
  app.set('watchingFile', true);
 
  fs.watchFile('./stream/image_stream.jpg', function(current, previous) {
    io.sockets.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100));
  })
 
}
