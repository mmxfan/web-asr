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

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/index.html', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/recorder.js', function(req, res) {
    res.sendFile(__dirname + '/recorder.js');
});

app.get('/resampler.js', function(req, res) {
    res.sendFile(__dirname + '/resampler.js');
});

app.get('/recorderWorker.js', function(req, res) {
    res.sendFile(__dirname + '/recorderWorker.js');
});

// app.get('/moment.js', function(req, res){
//     res.sendFile(__dirname + '/bower_components/moment/moment.js');
// });


//Whenever someone connects this gets executed
io.on('connection', function(socket) {
    cnt++;
    console.log('A user connected (totally [' + cnt + '] connected)');
    refreshTargetModels();
    socket.on('wav', function(data) {
        console.log('server received: ' + data.filename);
        // fs.writeFile(__dirname + '/speech.wav', data.str, 'binary');
        fs.writeFile(__dirname + '/wav/' + data.filename + '.wav', data.str, 'binary');

        refreshTargetModels();

        var child = spawn('bash', [__dirname + '/process.sh', './wav/' + data.filename + '.wav']);
        child.stdout.on('data', function(chunk) {
            var returnedText = 'server send to client:' + data.filename + '.wav=' + chunk.toString();
            console.log(returnedText);
            socket.emit("decode", {
                'result': returnedText
            });
        });
        child.on('disconnect', function(code) {
            console.log('child(' + child.pid + ') disconnected with code ' + code);
        });
    });
    socket.on('cc', function(data) {
        console.log('server received: ' + data.str);
        var child = spawn(__dirname + '/process.sh', [data.str]);
        child.stdout.on('data', function(chunk) {
            var returnedText = 'server send to client:' + chunk.toString();
            //console.log(returnedText);
            socket.emit("decode", {
                'result': returnedText
            });
        });
        child.on('disconnect', function(code) {
            console.log('child(' + child.pid + ') disconnected with code ' + code);
        });
    });
    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function() {
        cnt--;
        console.log('A user disconnected (totally [' + cnt + '] connected)');
    });
    //get enrolled target models (list files under wav folder)
    // socket.on('getTarget', function() {
    //     //list all the files under foler "./wav"
    //     fs.readdir("./wav", function(err, files) {
    //         if (err) throw err;
    //         console.log("files under wav folder:")
    //         console.log(files);
    //         io.sockets.emit('refreshTarget',files);
    //     })
    // })
});

http.listen(8081, function() {
    console.log('listening on *:8081');
});

function refreshTargetModels(){
    //list all the files under foler "./wav" after new wav file saved
    //and refresh the target models on web interface
    fs.readdir("./wav", function(err, files) {
        if (err) throw err;
        console.log("files under wav folder:")
        console.log(files);
        io.sockets.emit('refreshTarget', files);
    })
}