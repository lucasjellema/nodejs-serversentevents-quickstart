// static file server for all resources in local directory public and below
// AND handle forms submission to path /forms/... 
var express = require('express'); //npm install express
var bodyParser = require('body-parser'); // npm install body-parser
var http = require('http');
var sseMW = require('./sse');
var prompt = require('prompt'); //https://www.npmjs.com/package/prompt

var APP_VERSION = "0.8";

var PORT = process.env.PORT || 3000;

var app = express();
var server = http.createServer(app);
server.listen(PORT, function () {
    console.log('Server running, version ' + APP_VERSION + ', Express is listening... at ' + PORT + " for requests");
});

app.use(bodyParser.json()); // for parsing application/json
app.use(express.static(__dirname + '/public'))

//configure sseMW.sseMiddleware as function to get a stab at incoming requests, in this case by adding a Connection property to the request
app.use(sseMW.sseMiddleware)


app.get('/about', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write("Version " + APP_VERSION + ". No Data Requested, so none is returned");
    res.end();
});

// Realtime updates
var sseClients = new sseMW.Topic();

app.get('/updates', function (req, res) {
    console.log("res (should have sseConnection)= " + res.sseConnection);
    var sseConnection = res.sseConnection;
    console.log("sseConnection= ");
    sseConnection.setup();
    sseClients.add(sseConnection);
});


var m;
updateSseClients = function (message) {
    console.log("update all Sse Client with message " + message);
    this.m = message;
    sseClients.forEach(function (sseConnection) {
        console.log("send sse message global m" + this.m);
        sseConnection.send(this.m);
    }
        , this // this second argument to forEach is the thisArg (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach) 
    );
}

promptForInput();

// go into loop where user can provide input
var timeToExit = false;

var allInput = [];

function promptForInput() {
    prompt.get(['yourInput'], function (err, result) {
        // 
        // Log the results. 
        // 
        console.log('Your Input:' + result.yourInput);
        // send input to function that forwards it to all SSE clients
        updateSseClients(result.yourInput);
        timeToExit = ('exit' == result.yourInput)
        if (timeToExit) {
            wrapItUp();
        }
        else {
            allInput.push(result.yourInput);
            promptForInput();
        }
    });
}

function wrapItUp() {
    console.log('It was nice talking to you. Goodbye!');
    // final recap of the dialog:
    console.log("All your input:\n " + JSON.stringify(allInput));
}
