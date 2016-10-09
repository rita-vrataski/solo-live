
var settings = {
    lasttod: 0
    , lastpoll: new Date()
    , datafile: ''//'Z:\PCA-GGR AX10 11-17-2012.st1'
    , port: 3000
    , parseTimes: []
    , tokens: ['run', 'class', 'number', 'tm', 'penalty', 'driver', 'car', 'cc', 'pos', 'tod', 'paxed']
    , isStarted: false
    , timerId: 0
    , configOk: false
    , debug: false
    , activeSockets: 0
    , version: '2.0.5'
    , useTod: true
    , maxRunsCounted: 0
    , allowFunInOverall: true
    , useSuperClassing: true
    , secondsPerCone: 2
    , isLocal: true
    , accessKey: 'LqeWfspi6WB2F3fi1Vv5Y1'
    , uploadToCloud: false
    , cloudConfig: { host: 'localhost', port: 3000 }
};

var uploadQueue = [], uploadRunning = false;

var pjson = require('./package.json')
, express = require('express');

var app = express()
, fs = require('fs')
, colors = require('./color')
, dates = require('./dates')
, parser = require('./parser')
, config = require('./config')
, http = require('http')
, cookieParser = require('cookie-parser');

var server = http.createServer(app)
, io = require('socket.io').listen(server);

settings.version = pjson.version;

/*
//production
//LPR = ozOaSY61iyQf1S3wEbEXqM
// GGR = YnL5mdlJDV8ZsWjxgtObay
// SFR = 4DCYEe7jJs-0GT5brBifmH
//settings.accessKey = 'YnL5mdlJDV8ZsWjxgtObay';
//settings.cloudConfig.host = 'axtimelr.nodejitsu.com';
//settings.cloudConfig.port = 80;
*/

if (settings.isLocal) {
    // do configs from file
    console.log('running locally')
    if (config.datafile) { settings.datafile = config.datafile; }
    if (config.port) { settings.port = config.port; }
    if (config.useTod) { settings.useTod = config.useTod; }
    if (config.maxRunsCounted) { settings.maxRunsCounted = config.maxRunsCounted; }
    if (config.allowFunInOverall) { settings.allowFunInOverall = config.allowFunInOverall; }
    if (config.useSuperClassing) { settings.useSuperClassing = config.useSuperClassing; }
    if (config.secondsPerCone) { settings.secondsPerCone = config.secondsPerCone; }

    if (!fs.existsSync('./data.json')){
        console.log('data.json does not exist, creating it now.')
        fs.writeFileSync('./data.json', '{}');
    }
} else {
    settings.port = 5000;

}


    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.static(__dirname + '/jquery'));
    app.use(cookieParser());

//app.listen(settings.port);
server.listen(process.env.PORT || 5000);

console.log(('Started server on port ' + settings.port + '...').green);

app.get('/getCookie',function(req, res){
	if (req.cookies.driverId) {
       //res.send({driverId: req.cookies.driverId});
	   res.send(req.cookies.driverId);
    } else {
		var driverString = '0'
		res.send(driverString);
	}
});

app.get('/stats', function (req, res) {
    var html = [];
    html.push('<html><body>');
    html.push('<p>Version: ' + settings.version + '</p>');
    html.push('<p>Active Sockets: ' + settings.activeSockets + '</p>');
    html.push('<p>Last Updated: ' + settings.lastpoll + '</p>');
    html.push('<p>Run Count: ' + data.runs.length + '</p>');
    html.push('<p>Drivers: ' + data.drivers.length + '</p>');
    html.push('<p>Super Classing?: ' + settings.useSuperClassing + '</p>');
    html.push('<p>allowFunInOverall?: ' + settings.allowFunInOverall + '</p>');
    
    html.push('</body></html>');

    res.send(html.join(''));
});

app.get('/config', function (req, res) {
    res.setHeader('Content-Type','application/javascript');
    var s = settings;
    //s.datafile = '';
    res.send('var config = ' + JSON.stringify(s));
});

app.get('/about', function (req, res) {
    res.send('About');
});

app.get('/historical', function (req, res) {
    fs.readFile('data.json', 'utf8', function (err, djson) {
        var dt = new Date();
        var evs = dt.getFullYear() + '_' + (dt.getMonth() + 1) + '_' + dt.getDate();
        var dd = {};
        if (!err) {
            dd = JSON.parse(djson);
        }
        dd[evs] = data;
        res.send(dd);
    });
});

app.get('/driverruns/:id', function (req, res) {
    var id = parseInt(req.params.id);
	if (req.cookies.driverId == undefined) {res.clearCookie('driverId')}
    res.cookie('driverId', id);
    var n = [];
    for (var i = 0; i < data.runs.length; i++) {
        if (data.runs[i].driverId == id) {
            n.push(data.runs[i]);
        }
    }

    res.send(n);
});

app.get('/driverdata', function (req, res) {
    var cn = req.param('cn',null)
        , dn = req.param('dn',null)
        , driver = null
        , truns = [];
    for (var i = 0; i < data.drivers.length; i++) {
        if (data.drivers[i].car.number == cn && data.drivers[i].name == dn) {
            driver = data.drivers[i];
            break;
        }
    }
    for (var i = 0; i < data.runs.length; i++) {
        if (data.runs[i].car.number == cn && data.runs[i].driver == dn) {
            truns.push(data.runs[i]);
        }
    }

    res.send({ driver: driver, runs: truns, lastupdated:data.poller.lastpoll.formatDate('HH:mm:ss'), runcount:data.runs.length });
});


/*app.get('/reloadCloud', function (req, res) {
    reloadCloud();
    res.send('did it. ' + (new Date()));
});*/

app.get('/', function (req, res) {
        
        res.sendFile(__dirname + '/results-incremental.html');
		console.log("Cookies Found :  ", req.cookies);
		
		
});




/*
app.get('/uploadtoaxr', function (req, res) {
    var connected = false;
    console.log('Testing internet connection...');

    http.get('http://www.autocrossresults.com/Content/mobile.css', function (nres) {
        console.log(nres.statusCode);
        res.sendFile(__dirname + '/upload.html');
    }).on('error', function (e) {
            console.log('error connecting: ' + e.message);
            res.sendFile(__dirname + '/upload-nointernet.html');
        });

});
*/
/*
app.post('/uploadtoaxr', function (req, res) {
    var accessKey = 'AFE368157C07449B902E360CA910EDED'
        , counts = true;//req.body.counts == 'yes';
    //AFE368157C07449B902E360CA910EDED
    var classes = [], start = new Date().getTime();
    console.log('Uploading results to AutocrossResults.com...'.red)
    // {name, index}
    for (var i = 0; i < data.drivers.length; i++) {
        var exists = false;
        var driver = data.drivers[i];
        for (var c = 0; c < classes.length; c++) {
            if (driver.axclass == classes[c].name) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            if (driver.best > 0 && driver.bestpax > 0) {
                var index = Math.floor(driver.bestpax / driver.best * 1000) / 1000;
                index = index > 1 ? 1 : index;
                classes.push({ name: driver.axclass, index: index.toString() });
            }
        }
    }
    classes.sort(function (a, b) {
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
    //console.log(classes);
    
    var d = { data: { accessKey: accessKey, runs: data.runs, drivers: data.drivers, eventDate: '3/6/2013', axclasses: classes, counts:counts } };
    var ds = JSON.stringify(d);
    var options = { host: 'www.autocrossresults.com', path: '/api/LR_Import', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': ds.length } };

    var nreq = http.request(options, function (nres) {
        nres.setEncoding('utf-8');
        var rs = '';
        nres.on('data', function (d) {
            rs += d;
        });
        nres.on('end', function () {
            //console.log(rs);
            console.log(((new Date().getTime() - start) / 1000) + ' secs');
            res.send(rs);

        });

    });
    nreq.write(ds);
    nreq.end();
});
*/
var running = false, doAnother = false;


var data = {
    runs: []
    , poller: {}
    , drivers: []
    , ttod: []
    , connectedDrivers: []
};


data = parser.doit(settings.datafile, settings);

/*if (settings.uploadToCloud) {
    var sendCfg = { drivers: [], runs: [], reload: true, useSuperClassing:settings.useSuperClassing, date:new Date().formatDate('MM/dd/yyyy'), lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: data.runs.length };
    
    sendCfg.reload = true;
    sendCfg.runs = data.runs;
    sendCfg.drivers = data.drivers;
    
    console.log('Uploading first pass to cloud.');
    //TODO only send when there are changes
    uploadQueue.push(sendCfg);
    doQueue();
    //sendIt(sendCfg);
}*/

//fs.writeFile('ttod.json', JSON.stringify(data.ttod));
//fs.writeFile('drivers.json', JSON.stringify(data.drivers));
//fs.writeFile('runs.json', JSON.stringify(data.runs));

if (settings.isLocal) {
    fs.watch(settings.datafile, function (ev, fn) {
        var file = settings.datafile;
        if (running) {
            doAnother = true;
            console.log('already running'.red);
        }
        else {
            running = true;
            data = parser.doit(file, settings);
            if (!data.results.nochanges) {
                var runCount = data.runs.length; var last20 = [];

                io.sockets.emit('changes', { drivers: data.changes, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: runCount });
                io.sockets.emit('ttod', { ttod: data.ttod, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: runCount });
                running = false;

                //console.log('fswatch: runcount: ' + runCount);
                /*if (settings.uploadToCloud) {
                    var sendCfg = { drivers: [], runs: [], reload: false, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: runCount };

                    if (data.results.reload) {
                        sendCfg.reload = true;
                        sendCfg.runs = data.runs;
                        sendCfg.drivers = data.drivers;
                    } else {
                        sendCfg.runs = data.results.newRuns;
                        sendCfg.drivers = data.changes;
                    }
                    //console.log(sendCfg);
                    //TODO only send when there are changes
                    //sendIt(sendCfg);
                    uploadQueue.push(sendCfg);
                    doQueue();
                    console.log('Add to cloud queue' + uploadQueue.length);
                }*/

                for (var i = (runCount < 36 ? 0 : (runCount - 36)) ; i < runCount; i++) {
                    last20.push(data.runs[i]);
                }
                //io.sockets.emit('results', { drivers: data.drivers, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: runCount });
                //var last20 = [];
                //for (var i = (runCount < 21 ? 0 : (runCount - 21)) ; i < runCount; i++) {
                //    last20.push(data.runs[i]);
                //}
                io.sockets.in('runs').emit('runs', { runs: last20, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: runCount });
            }
            else {
                //console.log('\tNO CHANGES');
                running = false;
            }
        }
    });
    console.log(('Watching file ' + settings.datafile + ' for changes').green.bold);
}
io.set('log level', 1);

io.sockets.on('connection', function (socket) {
    //socket.emit('ttod', { ttod: data.ttod, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: data.runs.length });
    //socket.emit('results', { drivers: data.drivers, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: data.runs.length });
    settings.activeSockets++;
    console.log('Connected: ' + settings.activeSockets);
    
    //socket.emit('init-results', { drivers: data.drivers, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: data.runs.length });

    socket.on('join-runs', function (d) {
        socket.join('runs');
        var last20 = [], runCount = data.runs.length;

        for (var i = (runCount < 21 ? 0 : (runCount - 21)) ; i < runCount; i++) {
            last20.push(data.runs[i]);
        }
        socket.emit('runs', { runs: last20, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: runCount });
    });
    socket.on('leave-runs', function (data) { socket.leave('runs'); });

    socket.on('ttod', function (d) {
        socket.emit('ttod', { ttod: data.ttod, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: data.runs.length });
    });
    socket.on('init-results', function (d) {
        socket.emit('init-results', { drivers: data.drivers, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: data.runs.length });
    });
	
	// Added this section below
	socket.on('changes', function (d) {
        socket.emit('changes', { drivers: data.drivers, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: data.runs.length });
    });
	// Added this section above
	
    socket.on('results', function (d) {
        socket.emit('results', { drivers: data.drivers, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: data.runs.length });
    });
    socket.on('init-runs', function (d) {
        socket.emit('init-runs', { runs: data.runs, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: data.runs.length });
    });

    socket.on('disconnect', function () {
        settings.activeSockets--;
		console.log('Disconnect: ' + settings.activeSockets);
    });
});


function doQueue() {
    if (uploadQueue.length > 0) {
        uploadRunning = true;
        var q = uploadQueue[0];
        sendIt(q);
    }
}

/*function reloadCloud() {
    console.log('Reload Cloud data');
    var sendCfg = { drivers: [], runs: [], reload: true, useSuperClassing: settings.useSuperClassing, date: new Date().formatDate('MM/dd/yyyy'), lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: data.runs.length };

    sendCfg.reload = true;
    sendCfg.runs = data.runs;
    sendCfg.drivers = data.drivers;

    uploadQueue.push(sendCfg);
    doQueue();
}*/
/*
function sendIt(dat) {
    var host = settings.cloudConfig.host
        , port = settings.cloudConfig.port
        , start = new Date().getTime()
        , date = new Date().formatDate('MM/dd/yyyy')
        ;

    var d = { runs: dat.runs, drivers: dat.drivers, reload:dat.reload, lastpoll: dat.lastpoll, runcount: dat.runcount, useSuperClassing:settings.useSuperClassing, date:date };
    var ds = JSON.stringify(d);
    var options = { host: host, port: port, path: '/api/importruns/' + settings.accessKey, method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': ds.length } };
    //{ drivers: data.changes, lastpoll: data.poller.lastpoll.formatDate('HH:mm:ss'), runcount: runCount, last20: last20 
    //console.log('send body');
    //console.log(ds);

    //TODO build in reload request handler from cloud version

    try {
        var nreq = http.request(options, function (nres) {
            nres.setEncoding('utf-8');
            var rs = '';
            nres.on('data', function (d) {
                rs += d;
            });
            nres.on('end', function () {
                uploadRunning = false;
                var result = JSON.parse(rs);
                if (nres.statusCode == 200 && result.status == 'success') {
                    
                    console.log('upload status: ' + nres.statusCode);
                    uploadQueue.shift();
                    setTimeout(doQueue, 1);
                    console.log('Uploaded to cloud in ' + ((new Date().getTime() - start) / 1000) + ' secs');
                } else {
                    uploadRunning = false;
                    console.log('FAILED TO SYNCH WITH THE CLOUD!'.red);
                }
                
            
            });

        });
        nreq.on('error', function (er) {
            uploadRunning = false;
            console.log(('ERROR synching data with cloud. Message: ' + er.message).red);
        });
        nreq.write(ds);
        nreq.end();
    }
    catch (err) {
        uploadRunning = false;
        console.log('ERROR uploading to cloud. You should restart the application.'.red);
        //TODO put requests into queue and have basic queue system to guarantee uploads are done in order
    }
}*/