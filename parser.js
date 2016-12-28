var fs = require('fs');

var parseTimes = []
    , running = false
    , doAnother = false
    , tokens = ['run', 'class', 'number', 'tm', 'penalty', 'driver', 'car', 'cc', 'pos', 'tod', 'paxed']
    , data = {
        runs: []
        , ttod: []
        , drivers: []
        , driverIdSeed: 1
        , poller: { lastpoll: new Date() }
        , changes: []
        , results: {}
    }
    , masterDrivers = []
    , useTod = true
    , maxRunsCounted = 0
    , runNumber = 0
    , configuration = {}
    , previousRuns = [];


function doit(datafile, setgs) {
    configuration = setgs;
    var usetod = configuration.useTod;
    if (usetod == null || usetod == undefined) {
        useTod = true;
    } else { useTod = usetod; }
    runNumber = 1;
    maxRunsCounted = configuration.maxRunsCounted;
    secondsPerCone = configuration.secondsPerCone;

    console.log('\nSTARTING PARSE...'.yellow);

    var start = new Date().getMilliseconds();
    var s = null;
    try {
        s = fs.readFileSync(datafile, 'utf8');
    }
    catch (err) {
        console.log('***************************************************************'.red);
        console.log('ERROR CONNECTING TO AXWARE FILE'.red.bold);
        console.log(err.toString().red.bold);
        console.log('datafile: ' + datafile);
        console.log('***************************************************************'.red);
        //configuration.timerId = setTimeout(doit, configuration.interval);
        running = false;
        return data;
    }
    //var s = fs.readFileSync('w:\pcalast.st1', 'utf8');
    var rows = s.split('\n');
    console.log(('\tROWS to parse: ' + rows.length));

    runs = [];
    for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var runParsed = parse(r);
        if (runParsed != null) {
            runs.push(runParsed);
        }
    }
    var pruns = data.runs;
    data.runs = runs;
    data.poller.lastpoll = new Date();
    console.log('\tRUNS COUNT: ' + data.runs.length);

    var stop = new Date().getMilliseconds();
    parseTimes.push({ date: new Date(), ms: stop - start });

    
    console.log('\tgenerating stats...');
    var results = genstats(pruns);
    data.results = results.runChanges;
    

    console.log('\t' + new Date());
    console.log(('FINISHED PARSE in ' + (stop - start) + 'ms\n').yellow);
    //configuration.timerId = setTimeout(doit, configuration.interval);
    running = false;

    return data;

    //    if (doAnother) {
    //        running = true;
    //        setTimeout(doit, 500);
    //        doAnother = false;
    //    }
}


function parse(line) {

    var r = new run();
    //var tokens = configuration.tokens;
    if (line.substring(0, 4) == '_run' || line.substring(0, 6) == '_class') {

        var todFound = false;
        var s = line.split('_');

        if (s.length > 1) {
            for (var i = 0; i < s.length; i++) {
                var z = s[i];
                for (var t = 0; t < tokens.length; t++) {
                    if (z == tokens[t]) {

                        var v = s[i + 1];
                        if (v !== undefined) {
                            if (z == 'run') { r.n = parseInt(v); }
                            else if (z == 'class') { r.axclass = v; }
                            else if (z == 'number') { r.car.number = v; }
							//else if (z == 'tm') { r.rawtime = parseFloat(v); }
                            else if (z == 'tm') { r.rawtime = parseFloat(v); }
                            else if (z == 'penalty') {
                                if (v == 'DNF') { r.isDnf = true; }
								else if (v == 'DNS') { r.isDnf = true; }
                                else if (v == 'RRN') { r.getRerun = true; }
                                else { r.cones = parseInt(v); }
                            }
                            else if (z == 'driver') { r.driver = v; }
                            else if (z == 'car') { r.car.description = v; }
                            else if (z == 'cc') { r.car.color = v; }
                            else if (z == 'tod') {
                                if (v.indexOf('-')) {
                                    v = v.split(' - ')[0];
                                }
                                r.tod = parseInt(v);
                                todFound = true;
                            }
							else if (z == 'paxed') { r.timepaxed = parseFloat(v); }
                            //else if (z == 'paxed') { r.timepaxed = parseFloat(v).toFixed(3); }
                        }
                    }
                }
            }
            //determine super classes
            r.superClass = getSuperClass(r.axclass);

            r.time = (r.cones * secondsPerCone) + r.rawtime;
			//r.time = ((r.cones * secondsPerCone) + r.rawtime).toFixed(3);
            if (r.timepaxed == NaN || r.timepaxed == null) { r.timepaxed = r.time; }
            if (!todFound && !useTod) { return null; }
            if (r.driver.length == 0) { return null; }
            if (r.rawtime == 0 && !r.isDnf && !r.getRerun) { return null; }
            //console.log(r);
            r.runNumber = runNumber;
            runNumber++;
            return r;
        }
    }
    return null;
}

function getSuperClass(cls) {
    if (configuration.useSuperClassing) {
        if (cls.indexOf('-') > -1) {
            var supc = cls.split('-')[0];
            if (cls.substring(0, 4).toLowerCase() == 'n-st') supc = 'NS';
            else if (supc.substring(0, 3).toLowerCase() == 'fun') supc = 'FUN';
            return supc;
        } else if (cls == 'PAX') {
			supc = 'PAX';
			return supc;
		} else if (cls == 'RK') {
			supc = 'RK';
			return supc;
		}
		
    }
    return cls;
}

function run() {

    return {
        n: 0, axclass: '', driver: '', car: { description: '', number: '', year: 0, color: '' }
        , rawtime: 0.0, cones: 0, isDnf: false, getRerun: false, tod: 0, time: 0, timepaxed: 0, runNumber: 0
        , driverId: 0, superClass: ''
    };
}
function driverObj(id, name, cls, scls) {
    return {
        id: id, name: name, axclass: cls, superClass: scls, best: 9999, bestpax: 9999
        , runCount: 0, totalRuns: 0, dnfCount: 0, cones: 0, reruns: 0, car: { description: '', number: '', year: 0, color: '' }, ranko: 0, rankc: 0, rankp: 0//, times: []
        , rawDiffo: 0, rawDiffp: 0, paxDiffo: 0, paxDiffp: 0, classDiffo: 0, classDiffp: 0, worst: 9999
    };
}

function ttoditem(dr, car, axclass, v, cat) {
    var cr = car == null ? { description: '', number: '', year: 0, color: '' } : car;
    return { driver: dr, car: cr, axclass: axclass, value: v, category: cat };
}

//
// Alerts: 
// Top time, new person and old person
// class position change
//
function genAlerts(prev, curr) {
    var changes = [];
    var log = '';
    console.log('\tcalculating changes');
    if (prev.length > 0) {
        for (var i = 0; i < curr.length; i++) {
            var d = curr[i];
            var found = false;
            for (var b = 0; b < prev.length; b++) {
                var p = prev[b];
                if (p.car.number == d.car.number && p.name == d.name && p.axclass == d.axclass) {
                    if (p.ranko != d.ranko || p.rankc != d.rankc || p.rankp != d.rankp || p.totalRuns != d.totalRuns) {
                        //changes.push(p, d);
                        changes.push(d);
                        if (p.ranko != d.ranko) {
                            log += p.name + ' moved from ' + p.ranko + ' to ' + d.ranko + ' overall, ';
                        }
                        if (p.rankc != d.rankc) {
                            log += p.name + ' moved from ' + p.rankc + ' to ' + d.rankc + ' in ' + d.axclass + ', ';
                        }
                        if (p.rankp != d.rankp) {
                            log += p.name + ' moved from ' + p.rankp + ' to ' + d.rankp + ' PAX, ';
                        }
                        if (p.totalRuns != d.totalRuns) {
                            log += p.name + ' completed a run, ';
                        }
                    }
                    //if (p.runCount < d.runCount) {
                    //    changes.push(p, d);
                    //}
                    found = true;
                    break;
                }
            }
            if (!found) {
                changes.push(d);
                log += d.name + ' completed first run, ';
            }
        }
    }
    //console.log(('Changes detected: ' + changes.length).yellow);
    console.log('\tlog: ' + log.bold.yellow);
    return changes;

}


function genstats(pr) {
    var prevruns = pr;
    var classes = [];
    var ttodr = new ttoditem('-', null, '', 99999, 'FTD');
    var ttodp = new ttoditem('-', null, '', 99999, 'Top PAX');
    var ttodm = new ttoditem('-', null, '', 99999, "Men's Time");
    var ttodw = new ttoditem('-', null, '', 99999, "Women's Time");
    var ttodss = new ttoditem('-', null, '', 99999, 'Showroom Stock');
    var ttodfun = new ttoditem('-', null, '', 99999, 'Fun');
    var ttodck = new ttoditem('-', null, '', 0, 'Cone Killer');
    var ttodlost = new ttoditem('-', null, '', 0, 'Most DNFs');
    var ttodrr = new ttoditem('-', null, '', 0, 'Most Reruns');
	var ttodsc = new ttoditem('-', null, '', 99999, 'Stiffest Competition');
	var ttodmir = new ttoditem('-', null, '', 0, 'Most Improved Rookie');
	var ttodmi = new ttoditem('-', null, '', 0, 'Most Improved');
	var ttodtwin1 = new ttoditem('-', null, '', 0, 'Twinsies');
	var ttodtwin2 = new ttoditem('-', null, '', 0, 'Twinsies');


    var ttods = [];
    var drivers = [];



    for (var t = 0; t < data.runs.length; t++) {
        var run = data.runs[t], dv = run.driver, cls = run.axclass;

        if (!run.isDnf && !run.getRerun) {
            if (ttodr.value > run.time && run.time > 0) {
                ttodr = new ttoditem(run.driver, run.car, run.axclass, (run.time).toFixed(3), 'FTD');
            }
            if (ttodp.value > run.timepaxed && run.timepaxed > 0) {
                ttodp = new ttoditem(run.driver, run.car, run.axclass, (run.timepaxed).toFixed(3), 'Top PAX');
            }
			

				

			/*
            if (run.axclass.indexOf('L') == -1) {
                if (ttodm.value > run.time) {
                    ttodm = new ttoditem(run.driver, run.car, run.axclass, run.time, "Men's Time");
                }
            }
            if (run.axclass.indexOf('L') > -1) {
                if (ttodw.value > run.time) {
                    ttodw = new ttoditem(run.driver, run.car, run.axclass, run.time, "Women's Time");
                }
            }

            if (run.axclass.substr(0, 2) == 'SS') {
                if (ttodss.value > run.time) {
                    ttodss = new ttoditem(run.driver, run.car, run.axclass, run.time, "Showroom Stock");
                }
            }
            if (run.axclass == 'FUN' && ttodfun.value > run.time) {
                ttodfun = new ttoditem(run.driver, run.car, run.axclass, run.time, "Fun");
            }
			*/
        }

        //lookup master driver
        var driver = null, driverIx = -1, dcnt = -1, masterDriver = null;
        for (var d = 0; d < masterDrivers.length; d++) {

            if (masterDrivers[d].name == dv && masterDrivers[d].carNumber == run.car.number && masterDrivers[d].axclass == run.axclass) {
                masterDriver = masterDrivers[d]; break;
            }
        }
        if (masterDriver == null) {
            masterDriver = { id: data.driverIdSeed, name: run.driver, axclass: run.axclass, carNumber: run.car.number, superClass: run.superClass };
            masterDrivers.push(masterDriver);
            data.driverIdSeed++;
        }
        else {
            for (var d = 0; d < drivers.length; d++) {
                dcnt = d;
                if (drivers[d].id == masterDriver.id) { driver = drivers[d]; driverIx = d; break; }
            }
        }

        if (driver == null) {

            driver = new driverObj(masterDriver.id, masterDriver.name, masterDriver.axclass, masterDriver.superClass);
            driver.car = run.car;
            drivers.push(driver);
            //console.log(driver);
            //driverIx = (dcnt + 1);
            driverIx = drivers.length - 1;
        }

        data.runs[t].driverId = driver.id;
		
		/*if (driver.best > run.time && !run.isDnf && !run.getRerun && (maxRunsCounted == 0 || driver.runCount < maxRunsCounted)) {
            driver.best = run.time;
            driver.bestpax = run.timepaxed;
        }*/
		
        //if ( driver.bestpax > run.timepaxed) {
		//if ( (driver.bestpax > run.timepaxed)  && !run.isDnf && !run.getRerun ) {
			
		// Calculate driver's worst time here
		/*if ( (driver.worst < run.time)  && !run.isDnf && !run.getRerun && (maxRunsCounted == 0 || driver.runCount < maxRunsCounted) && ( driver.runCount > 1)) {
            driver.worst = run.time;
        } else {
			driver.worst = 0;
		}*/
		
		if ( (driver.worst == 9999)  && !run.isDnf && !run.getRerun ) {
            driver.worst = run.time;
        } else {
			driver.worst = 0;
		}
		
		
		if ( (driver.best > run.time)  && !run.isDnf && !run.getRerun && (maxRunsCounted == 0 || driver.runCount < maxRunsCounted)) {
            driver.best = run.time;
            driver.bestpax = run.timepaxed;
        }
        driver.cones = driver.cones + run.cones;
        if (run.isDnf) {
            driver.dnfCount++;
        }
        if (run.getRerun) {
            driver.reruns++;
        }
        else {
            driver.runCount++;
        }
        driver.totalRuns++;
        drivers[driverIx] = driver;

    } //for t

    //update rankings.
    //do pax rankings
    drivers.sort(function (a, b) {
        return a.bestpax - b.bestpax;
    });
    var rank = 1, besto = 0, bestp = 0;
    for (var i = 0; i < drivers.length; i++) {
        if (drivers[i].axclass.substring(0, 3).toLowerCase() != 'fun' && drivers[i].bestpax > 0) {
            if (besto == 0) { besto = drivers[i].bestpax; bestp = besto; }
            drivers[i].rankp = rank;
            drivers[i].paxDiffo = (drivers[i].bestpax - besto).toFixed(3);
            drivers[i].paxDiffp = (drivers[i].bestpax - bestp).toFixed(3);
            bestp = drivers[i].bestpax;
            rank++;
        }
    }
	


    //drivers = rankClass2(drivers);
    drivers = parsers.rankClass3(drivers);

    //do overall ranking
    drivers.sort(function (a, b) {
        return a.best - b.best;
    });
    rank = 1; besto = 0; bestp = 0;

    for (var i = 0; i < drivers.length; i++) {
        if (drivers[i].best > 0) {
            if (configuration.allowFunInOverall || (!configuration.allowFunInOverall && drivers[i].axclass.substring(0, 3).toLowerCase() != 'fun')) {
                if (besto == 0) { besto = drivers[i].best; bestp = besto; }
                drivers[i].ranko = rank;
				//drivers[i].rawDiffo = Math.floor((drivers[i].best - besto) * 1000) / 1000;
                //drivers[i].rawDiffp = Math.floor((drivers[i].best - bestp) * 1000) / 1000;
                drivers[i].rawDiffo = (drivers[i].best - besto).toFixed(3);
                drivers[i].rawDiffp = (drivers[i].best - bestp).toFixed(3);
                bestp = drivers[i].best;
                rank++;
            }
        }
    }
	
	for (var i = 0; i < drivers.length; i++) {
        var drv = drivers[i];
		if(drv.rawDiffp == 0 && drv.rawDiffo != 0){
			
			ttodtwin2 = new ttoditem(drv.name, drv.car, drv.axclass, drv.best.toFixed(3), 'Twinsies');
			
			drv = drivers[i-1];
			ttodtwin1 = new ttoditem(drv.name, drv.car, drv.axclass, drv.best.toFixed(3), 'Twinsies');
		} else {
			
			
		}
	}
	// do class ranking
	//drivers = parsers.rankClass3(drivers);
	

    // do alerts

    //compare runs to do reload or update

    data.changes = genAlerts(data.drivers, drivers);

    var runChanges = genRunChanges(prevruns);
    //var runChanges = {};

    data.drivers = drivers;

	drivers = parsers.rankClass3(drivers);
    //loop through
    for (var i = 0; i < drivers.length; i++) {
        var drv = drivers[i];
        if (ttodck.value < drv.cones) {
            ttodck = new ttoditem(drv.name, drv.car, drv.axclass, drv.cones, "Cone Killer");
        }
        if (ttodlost.value < drv.dnfCount) {
            ttodlost = new ttoditem(drv.name, drv.car, drv.axclass, drv.dnfCount, "Lost In the Woods (DNFs)");
        }
        if (ttodrr.value < drv.reruns) {
            ttodrr = new ttoditem(drv.name, drv.car, drv.axclass, drv.reruns, "Got Practice (Reruns)");
        }
		
		var improvement = drv.worst - drv.best;
		// Most improved rookie
		if (ttodmir.value < (drv.worst - drv.best) && drv.worst > 0 && drv.axclass == "RK") {
			ttodmir = new ttoditem(drv.name, drv.car, drv.axclass, (drv.worst - drv.best).toFixed(3), 'Most Improved Rookie');

		}
		
		// Most improved driver
		if (ttodmi.value < (drv.worst - drv.best) && drv.worst > 0 && drv.axclass != "RK") {
			ttodmi = new ttoditem(drv.name, drv.car, drv.axclass, (drv.worst - drv.best).toFixed(3), 'Most Improved');
		}
		
		// Stiffest Competition
		// If classdiff is smaller than ttodsc and not zero
		
		if (ttodsc.value > drv.classDiffp && drv.classDiffp > 0) {
			var otherDriver = drivers[i-1];
			var competition = otherDriver.name + ' and ' + drv.name;
			ttodsc = new ttoditem( competition, drv.rankc, drv.axclass, drv.classDiffp, 'Stiffest Competition');
			
		}
		
    }
	
	// Removed the Lost in the Woods DNF reference here
	data.ttod = [ttodr, ttodp, ttodck, ttodsc, ttodmir, ttodmi, ttodtwin1, ttodtwin2, ttodrr ];
	//data.ttod = [ttodr, ttodp, ttodck, ttodlost, ttodrr];
    //data.ttod = [ttodr, ttodp, ttodm, ttodw, ttodss, ttodfun, ttodck, ttodlost, ttodrr];
    fs.readFile('data.json', 'utf8', function (err, djson) {
        var dt = new Date();
        var mo = dt.getMonth() + 1;
        var evs = dt.getFullYear() + '_' + (mo) + '_' + dt.getDate();
        var dd = {};
        if (!err) {
            try {
                dd = JSON.parse(djson);
                dd[evs] = data;
                fs.writeFile('data.json', JSON.stringify(dd));
            }
            catch (err) {
                console.log(('WRITE to backup FAILED: ' + err).red);
            }
        }
        else { console.log(err.toString().red);}

    });

    return {runChanges:runChanges};
}

//TODO put this earlier, before stats gen'd
function genRunChanges(pr) {
    // diffix, relead, newruns, nochanges
    var matchcount = 0;
    var prlen = pr.length
        , drlen = data.runs.length
        , len = drlen < prlen ? drlen : prlen
        , diffix = -2
        , newruns = []
        , nochanges = false;

    for (var i = 0; i < pr.length; i++) {
        
        if (JSON.stringify(pr[i]) != JSON.stringify(data.runs[i])) {
            break;
        }
        diffix = i;
    }

    //console.log('DiffIX: ' + diffix);
    //console.log('drlen: ' + drlen);
    //console.log('prlen: ' + prlen);
    //console.log('run matches: ' + (diffix +1));

    if (diffix + 1 == drlen) {
        console.log('\tNO CHANGES');
        nochanges = true;
    }
    else if (diffix == prlen - 1) {
        console.log('\tprevious matches, do diff');
        newruns = data.runs.slice(diffix + 1);
        console.log('\tnew runs: ' + newruns.length);
    }
    else console.log('\tdo reload');

    //console.log(newruns);
    return { diffIx: diffix, reload: diffix != prlen-1, newRuns:newruns, nochanges:nochanges };
}


var parsers = {
    'rankClass3': function (drivers) {
        var ds = drivers;

        if (configuration.useSuperClassing) {
            ds.sort(function (a, b) {
                if (a.superClass == b.superClass) {
                    return a.bestpax - b.bestpax;
                } else {
                    return a.superClass < b.superClass ? -1 : 1;
                }
            });

            var rank = 1, besto = 0, bestp = 0, cls = '';
            for (var i = 0; i < ds.length; i++) {
                if (ds[i].bestpax > 0) {
                    if (cls != ds[i].superClass) {
                        rank = 1;
                        besto = ds[i].bestpax;
                        bestp = besto;
                        cls = ds[i].superClass;
                    }
                    ds[i].rankc = rank;
                    ds[i].classDiffo = (ds[i].bestpax - besto).toFixed(3);
                    ds[i].classDiffp = (ds[i].bestpax - bestp).toFixed(3);
                    bestp = ds[i].bestpax;
                    rank++;
                }
            }
        }
        else {
            ds.sort(function (a, b) {
                if (a.axclass == b.axclass) {
                    return a.best - b.best;
                } else {
                    return a.axclass < b.axclass ? -1 : 1;
                }
            });

            var rank = 1, besto = 0, bestp = 0, cls = '';
            for (var i = 0; i < ds.length; i++) {
                if (ds[i].best > 0) {
                    if (cls != ds[i].axclass) {
                        rank = 1;
                        besto = ds[i].best;
                        bestp = besto;
                        cls = ds[i].axclass;
                    }
                    ds[i].rankc = rank;
                    ds[i].classDiffo = (ds[i].best - besto).toFixed(3);
                    ds[i].classDiffp = (ds[i].best - bestp).toFixed(3);
                    bestp = ds[i].best;
                    rank++;
                }
            }
        }
        return ds;
    } // End rankclass3 function
	
	
    , 'rankClass2': function (drivers) {
        var ds = drivers;
        ds.sort(function (a, b) {
            if (a.axclass == b.axclass) {
                return a.best - b.best;
            } else {
                return a.axclass < b.axclass ? -1 : 1;
            }
        });

        var rank = 1, besto = 0, bestp = 0, cls = '';
        for (var i = 0; i < ds.length; i++) {
            if (ds[i].best > 0) {
                if (cls != ds[i].axclass) {
                    rank = 1;
                    besto = ds[i].best;
                    bestp = besto;
                    cls = ds[i].axclass;
                }
                ds[i].rankc = rank;
                ds[i].classDiffo = (ds[i].best - besto).toFixed(3);
                ds[i].classDiffp = (ds[i].best - bestp).toFixed(3);
                bestp = ds[i].best;
                rank++;
            }
        }

        return ds;
    } // End rankclass2 function
};

function rankClass2(drivers) {
    var ds = drivers;
    ds.sort(function (a, b) {
        if (a.axclass == b.axclass) {
            return a.best - b.best;
        } else {
            return a.axclass < b.axclass ? -1 : 1;
        }
    });

    var rank = 1, besto = 0, bestp = 0, cls = '';
    for (var i = 0; i < ds.length; i++) {
        if (ds[i].best > 0) {
            if (cls != ds[i].axclass) {
                rank = 1;
                besto = ds[i].best;
                bestp = besto;
                cls = ds[i].axclass;
            }
            ds[i].rankc = rank;
            ds[i].classDiffo = (ds[i].best - besto).toFixed(3);
            ds[i].classDiffp = (ds[i].best - bestp).toFixed(3);
            bestp = ds[i].best;
            rank++;
        }
    }

    return ds;
}
function rankClass(drivers) {
    var dv = drivers, classsort = [], cs = [];

    dv.sort(function (a, b) {
        if (a.axclass == b.axclass) { return 0; }
        return a.axclass < b.axclass ? -1 : 1;
    });

    var cls = '', n = -1;
    for (var i = 0; i < dv.length; i++) {

        if (cls != dv[i].axclass) {
            cls = dv[i].axclass;
            cs.push([dv[i]]);
            n++;
        }
        else {
            cs[n].push(dv[i]);
        }
    }

    for (var b = 0; b < cs.length; b++) {
        cs[b].sort(function (a, b) {
            //if (a.best == b.best) { return 0; }
            return Math.floor(a.best * 1000) < Math.floor(b.best * 1000) ? -1 : 1;
        });
        for (var c = 0; c < cs[b].length; c++) {
            classsort.push(cs[b][c]);

        }
    }
    dv = classsort;
    cls = '';
    var rank = 1;
    for (var i = 0; i < dv.length; i++) {
        if (cls != dv[i].axclass) {
            cls = dv[i].axclass;
            rank = 1;
        }
        dv[i].rankc = rank;
        rank++;
    }
    return dv;
}



exports.doit = doit;
