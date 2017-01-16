var fs = require('fs');
var app = require('express')();
var http = require('https').Server({
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.crt'),
    requestCert: false,
    rejectUnauthorized: false
}, app);
var io = require('socket.io')(http);
var spawn = require('child_process').spawn;
var cnt = 0;

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
    cnt++;
    console.log('A user connected (totally [' + cnt +'] connected)');
    
    socket.on('wav', function(data){
        //console.log('server received: ' + data.str);
        fs.writeFile(__dirname + '/speech.wav', data.str, 'binary');
        var child = spawn('bash', [__dirname + '/process.sh']);
        child.stdout.on('data', function(chunk) {
            var returnedText = 'server send to client:' + chunk.toString();
            //console.log(returnedText);
            socket.emit("decode", {'result': returnedText});
        });
        child.on('disconnect', function(code) {
            console.log('child(' + child.pid + ') disconnected with code ' + code);
        });
    });
    socket.on('cc', function(data){
        console.log('server received: ' + data.str);
        var child = spawn(__dirname + '/process.sh', [data.str]);
        child.stdout.on('data', function(chunk) {
            var returnedText = 'server send to client:' + chunk.toString();
            //console.log(returnedText);
            socket.emit("decode", {'result': returnedText});
        });
        child.on('disconnect', function(code) {
            console.log('child(' + child.pid + ') disconnected with code ' + code);
        });
    });
    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
        cnt--;
        console.log('A user disconnected (totally [' + cnt +'] connected)');
    });
});

http.listen(8081, function(){
    console.log('listening on *:8081');
});

