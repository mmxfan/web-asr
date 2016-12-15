var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var spawn = require('child_process').spawn;

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/index.html', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/recorder.js', function(req, res){
    res.sendFile(__dirname + '/recorder.js');
});

app.get('/resampler.js', function(req, res){
    res.sendFile(__dirname + '/resampler.js');
});

app.get('/recorderWorker.js', function(req, res){
    res.sendFile(__dirname + '/recorderWorker.js');
});

//Whenever someone connects this gets executed
io.on('connection', function(socket){
    console.log('A user connected');
    
    socket.on('wav', function(data){
        fs.writeFile(__dirname + '/speech.wav', data.str, 'binary');
        var child = spawn('bash', [__dirname + '/process.sh']);
        child.stdout.on('data', function(chunk) {
            var returnedText = chunk.toString();
            //console.log(returnedText);
            socket.emit("decode", {'result': returnedText});
        });
        child.on('disconnect', function(code) {
            console.log('child(' + child.pid + ') disconnected with code ' + code);
        });
    });
    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
        console.log('A user disconnected');
    });
});

http.listen(8081, function(){
    console.log('listening on *:8081');
});

