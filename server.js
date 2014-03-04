// NPM dependencies
var express = require('express');
var sharejs = require('ShareJS').server;
var faye = require('faye');
var http = require('http');

// Local Modules
var DashboardManager = require('./js/server/dashboardsManager');
var DataSetsManager = require('./js/server/dataSetsManager');
var GadgetsManager = require('./public/gadgets/gadgetsInfo');
var xhr = require("./js/shared/xhr");

var app = express.createServer();
var dashboardsManager;
var dataSetsManager;
var gadgetsManager;

// Share JS options
var options = {
  rest: { path : '/dashboard/:name/state'},
  db: { type: 'none'},
  auth: function(client, action) {
    // This auth handler rejects any ops bound for docs starting with 'readonly'.
    if (action.name === 'submit op' && action.docName.match(/^readonly/)) {
      action.reject();
    } else {
      action.accept();
    }
  }
};

// Lets try and enable redis persistance if redis is installed...
try {
  require('redis');
  options.db = {type: 'redis'};
} catch (e) {}


// Attach the sharejs REST and Socket.io interfaces to the server
sharejs.attach(app, options);

// Faye adapter for pub/sub of dashboards
var adapter = new faye.NodeAdapter({ mount: '/faye', timeout: 45 });
adapter.attach(app);

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/templates');
  app.set('view engine', 'mustache');
  app.register(".mustache", require('stache'));
  app.set('view options', {layout: false });
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/js/client'));
  app.use(express.static(__dirname + '/js/shared'));
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

dashboardsManager = new DashboardManager(app, app.model);

app.get('/xhrProxy/:request', function(req, res){
  var options = {
    url: req.params.request,
    type: "GET",
    success: function(response) { res.send(response); }
  }
  xhr.ajax(options);
});

app.get('/gadgets/', function(req, res){
  res.send(GadgetsManager.all);
});


app.get('/dataSet/:id', function(req, res){
  var dataSetFound = function (dataSet) {
    res.send(JSON.stringify(dataSet));
  };
  DataSetsManager.find(req.params.id, dataSetFound);
});

app.post('/dataSet/', function(req, res){
  var queryInfo = req.body || undefined;
  var dataSetCreated = function(datasetId){
    res.send(JSON.stringify(datasetId));
  }
  DataSetsManager.createDataSet(queryInfo, dataSetCreated);
});

app.post('/myria/query', function(req, postResponse){
  postResponse.header("Transfer-Encoding", "chunked");
  postResponse.header("Content-Type", "application/json");
  var request = http.request({
    hostname: "beijing.cs.washington.edu",
    port: 8779,
    path: "/query",
    method: "post",
    headers: {
      "Content-Type": "application/json"
    }
  }, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      postResponse.write(chunk);
    });
    res.on('end', function() {
      postResponse.end();
    })
  });
  request.write(req.body.query);
  request.end();
});

app.get('/myria/query', function(req, postResponse){
  console.log("/query/query-" + req.get('query', ''));
  var request = http.request({
    hostname: "beijing.cs.washington.edu",
    port: 8779,
    path: "/query/query-" + req.param('query'),
    method: "get",
    headers: {
      "Accept": "*/*"
    }
  }, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    for (key in res.headers) {
      postResponse.header(key, res.headers[key]);
    }
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      postResponse.write(chunk);
    });
    res.on('end', function() {
      postResponse.end();
    })
  });
  request.end();
});

// beijing:8779/dataset/user-leelee/program-astro/relation-specificTimeStepResult/data
app.get('/myria/data', function(req, postResponse){
  var request = http.request({
    hostname: "beijing.cs.washington.edu",
    port: 8779,
    path: "/dataset/user-leelee/program-astro/relation-" + req.param('table') + '/data?format=json',
    method: "get",
    headers: {
      "Accept": "*/*"
    }
  }, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    for (key in res.headers) {
      postResponse.header(key, res.headers[key]);
    }
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      postResponse.write(chunk);
    });
    res.on('end', function() {
      postResponse.end();
    })
  });
  request.end();
});

if (!module.parent) {
  app.listen(80);
  console.log("ASCOT server listening on port %d", app.address().port);
}
