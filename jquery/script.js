

var selectedClass = null;
var settings = {
    showDetails: true
    , displayResults: 0 // 0-raw time, 1=class, 2=pax
};
function reloadDrivers() {
    $.ajax({
        url: '/driversdata?' + new Date().getTime()
        , dataType: 'json'
        , success: function (d) {
            drivers = d.drivers;
            lastpoll = d.lastpoll;
            totalruns = d.runscount;
            genTimes();
        }
        , error: function (r, s, et) {
            //console.log(s);
        }
    });
}

function reloadTtod() {
    $.ajax({
        url: '/ttoddata?' + new Date().getTime()
        , dataType: 'json'
        , success: function (d) {
            ttod = d.ttods;
            lastpoll = d.lastpoll;
            totalruns = d.runscount;
            genTtod();
        }
        , error: function (r, s, et) {
            //console.log(s);
        }
    });
}

function toggleDetails() {
    var el = $(this);
    if (el.hasClass('ui-btn-active')) {
        settings.showDetails = false;
        el.removeClass('ui-btn-active').attr('data-icon', '');
        el.children().children().next().removeClass('ui-icon-check').addClass('ui-icon-delete');
        
        //genTimes();
        
    } else {
        settings.showDetails = true;
        el.addClass('ui-btn-active').attr('data-icon', 'check');
        el.children().children().next().removeClass('ui-icon-delete').addClass('ui-icon-check');
        //genTimes();
    }
    
    setTimeout(genTimes, 1);
    
}


function toggleResults() {
    var el = $(this);
    if (el.attr('id').indexOf('class') > -1) {
        settings.displayResults = 1;
    } else if (el.attr('id').indexOf('pax') > -1) {
        settings.displayResults = 2;
    } else {
        settings.displayResults = 0;
    }
    setTimeout(genTimes,1);
}

function genTtod() {
    var html = '';
    for (var i = 0; i < ttod.length; i++) {
        var c = ttod[i];
        html += '<li data-role="list-divider">' + c.category + '</li>';
        //html += '<li><a href="/drivertimes?n=' + c.car.number + '"><div style="position:absolute;font-size:50px;opacity:.3;right:20%;font-style:italic;">' + c.car.number + '</div><span class="ui-li-aside">' + c.value + '</span><h3 class="ui-li-heading">' + c.driver + '</h3><p>' + c.car.description + ' </p></a></li>';
        html += '<li><a id="ttod-' + i + '"><div style="position:absolute;font-size:50px;opacity:.3;right:20%;font-style:italic;">' + c.car.number + '</div><span class="ui-li-aside">' + c.value + '</span><h3 class="ui-li-heading">' + c.driver + '</h3><p>' + c.car.description + ' </p></a></li>';
    }
    $('#ttodresults').html(html).listview('refresh').find('a').click(function () {
        var ix = parseInt($(this).attr('id').split('-')[1]);
        var run = ttod[ix];
        for (var i = 0; i < drivers.length; i++) {
            if (drivers[i].name == run.driver && drivers[i].car.number == run.car.number) {
                selectedDriverId = drivers[i].id;
                $.mobile.changePage('#page-driver');
            }
        }
    });
    $('#ttodlastupdated').text(lastpoll);
    $('#ttodruncount').text(totalruns);
    
}

function genTimes() {

    if (settings.displayResults == 1) { genClass(); }
    else if (settings.displayResults == 2) { genPax(); }
    else { genRaw(); }
    
}


function showDriver() {
    selectedDriverId = parseInt($(this).attr('id').split('-')[1]);
    $.mobile.changePage('#page-driver');
    //refreshDriver();
}

function refreshDriver() {
    //console.log('refresh DRIVER: ' + selectedDriverId + ', count: ' + drivers.length);

    var driver = null;
    for (var i = 0; i < drivers.length; i++) {
        if (drivers[i].id == selectedDriverId) {
            driver = drivers[i];
        }
    }
    if (driver != null) {
        genDriver(driver);
    }
}

function genDriver(driver) {
    var html = [];
    //console.log('gen driver');
    for (var i = 0; i < runs.length; i++) {

        var r = runs[i];
        if (r.driver == driver.name && r.car.number == driver.car.number) {
            var theme = r.isDnf ? ' data-theme="a" data-icon="delete"' : (r.getRerun ? ' data-theme="e" data-icon="alert"' : ' data-icon="false"');

            if (driver.best == r.time) {
                theme = ' data-theme="b" data-icon="check"';
            }

            html.push('<li' + theme + '><a href="#">' + r.time + '<span class="ui-li-count">' + r.cones + '</span></a></li>');
        }
    }
    $('#lbl-classname').text(driver.axclass);
    $('#drivertimes').empty().html('<li data-role="list-divider">Times</li>' + html.join('')).listview('refresh');
    $('#rankclass').text(ranktext(driver.rankc));
    $('#rankoverall').text(ranktext(driver.ranko));
    $('#rankpax').text(ranktext(driver.rankp));
    $('#drivername').text(driver.name);
    $('#driver-lastupdated').text(lastpoll);
    $('#driver-runcount').text(runs.length);
    $('#driverinfo').html('Car: <strong>' + (driver.car.year > 0 ? driver.car.year + ' ' : '') + driver.car.description + '</strong><br/>Number: <strong>' + driver.car.number + '</strong>');
}


function genRaw() {
    var html = [];

    var dv = drivers;
    dv.sort(function (a, b) {
        return a.best - b.best;
    });
    var rank = 1;
    var best = 99999;
    for (var i = 0; i < drivers.length; i++) {
        var li = '';
        var d = drivers[i];
        if (best == 99999) {
            best = d.best;
        }
        var dif = Math.floor((d.best - best) * 1000) / 1000;   
        if (settings.showDetails) {
            //li = '<li><a id="rawdrv-' + d.id + '" href="/driver?cn=' + d.car.number + '&dn=' + d.name + '" data-ajax="false"><div style="position:absolute;font-size:50px;opacity:.3;right:20%;font-style:italic;">' + d.car.number + '</div><div style="float:left;margin-right:12px;"><span class="rank" style="font-size:60px;">' + rank + '</span></div><h3 class="ui-li-heading">' + d.name + '</h3><p class="ui-li-desc" style="font-size:1.2em;">' + d.best + (rank > 1 ? '<span style="color:red;"> +' + dif + '</span>' : '') + '</p><p class="ui-li-desc">DNFs: ' + d.dnfCount + ', Re-runs:' + d.reruns + ', Cones:' + d.cones + '</p><span class="ui-li-count">' + d.runCount + '</span></a></li>';
            li = '<li><a id="rawdrv-' + d.id + '"><div style="position:absolute;font-size:50px;opacity:.3;right:20%;font-style:italic;">' + d.car.number + '</div><div style="float:left;margin-right:12px;"><span class="rank" style="font-size:60px;">' + rank + '</span></div><h3 class="ui-li-heading">' + d.name + '</h3><p class="ui-li-desc" style="font-size:1.2em;">' + d.best + (rank > 1 ? '<span style="color:red;"> +' + dif + '</span>' : '') + '</p><p class="ui-li-desc">DNFs: ' + d.dnfCount + ', Re-runs:' + d.reruns + ', Cones:' + d.cones + '</p><span class="ui-li-count">' + d.runCount + '</span></a></li>';
        } else {
            //li = '<li><a id="rawdrv-' + d.id + '" href="/driver?cn=' + d.car.number + '&dn=' + d.name + '" data-ajax="false"><div style="position:absolute;font-size:30px;opacity:.3;right:20%;font-style:italic;">' + d.car.number + '</div><div style="float:left;margin-right:12px;"><span class="rank" style="font-size:30px;">' + rank + '</span></div><h3 class="ui-li-heading">' + d.best + ' - ' + d.name + '</h3><span class="ui-li-count">' + d.runCount + '</span></a></li>';
            li = '<li><a id="rawdrv-' + d.id + '"><div style="position:absolute;font-size:30px;opacity:.3;right:20%;font-style:italic;">' + d.car.number + '</div><div style="float:left;margin-right:12px;"><span class="rank" style="font-size:30px;">' + rank + '</span></div><h3 class="ui-li-heading">' + d.best + ' - ' + d.name + '</h3><span class="ui-li-count">' + d.runCount + '</span></a></li>';
        }
        html.push(li);
        rank++;

    }
    $('#classList').hide();
    $('#btn-selectclass').hide();
    $('#resulttimes').html(html.join('')).show().find('a').bind('vclick', showDriver);
    if ($.mobile.activePage.attr('id') == 'page-results') {
        $('#resulttimes').listview('refresh');
    }
//        .show().find('a').bind('click', function () {
//            selectedDriverId = parseInt($(this).attr('id').split('-')[1]);
//            $.mobile.changePage('#page-driver');
//        });
    $('#lastupdated').text(lastpoll);
    $('#runcount').text(totalruns);
}


function genPax() {
    var html = [];

    var dv = drivers;
    dv.sort(function (a, b) {
        return a.rankp - b.rankp;
    });
    var rank = 1;
    var best = 99999;
    for (var i = 0; i < drivers.length; i++) {
        var d = drivers[i];
        if (d.rankp > 0) {
            var li = '';
            if (best == 99999) {
                best = d.bestpax;
            }
            var dif = Math.floor((d.bestpax - best) * 1000) / 1000;
            if (settings.showDetails) {
                //li = '<li><a id="paxdrv-' + d.id + '" href="/driver?cn=' + d.car.number + '&dn=' + d.name + '" data-ajax="false"><div style="position:absolute;font-size:50px;opacity:.3;right:20%;font-style:italic;">' + d.car.number + '</div><div style="float:left;margin-right:12px;"><span class="rank" style="font-size:60px;">' + rank + '</span></div><h3 class="ui-li-heading">' + d.name + '</h3><p class="ui-li-desc" style="font-size:1.2em;">' + d.bestpax + (rank > 1 ? '<span style="color:red;"> +' + dif + '</span>' : '') + '</p><p class="ui-li-desc">DNFs: ' + d.dnfCount + ', Re-runs:' + d.reruns + ', Cones:' + d.cones + '</p><span class="ui-li-count">' + d.runCount + '</span></a></li>';
                li = '<li><a id="paxdrv-' + d.id + '"><div style="position:absolute;font-size:50px;opacity:.3;right:20%;font-style:italic;">' + d.car.number + '</div><div style="float:left;margin-right:12px;"><span class="rank" style="font-size:60px;">' + rank + '</span></div><h3 class="ui-li-heading">' + d.name + '</h3><p class="ui-li-desc" style="font-size:1.2em;">' + d.bestpax + (rank > 1 ? '<span style="color:red;"> +' + dif + '</span>' : '') + '</p><p class="ui-li-desc">DNFs: ' + d.dnfCount + ', Re-runs:' + d.reruns + ', Cones:' + d.cones + '</p><span class="ui-li-count">' + d.runCount + '</span></a></li>';
            } else {
                //li = '<li><a id="paxdrv-' + d.id + '" href="/driver?cn=' + d.car.number + '&dn=' + d.name + '" data-ajax="false"><div style="position:absolute;font-size:30px;opacity:.3;right:20%;font-style:italic;">' + d.car.number + '</div><div style="float:left;margin-right:12px;"><span class="rank" style="font-size:30px;">' + rank + '</span></div><h3 class="ui-li-heading">' + d.bestpax + ' - ' + d.name + '</h3><span class="ui-li-count">' + d.runCount + '</span></a></li>';
                li = '<li><a id="paxdrv-' + d.id + '"><div style="position:absolute;font-size:30px;opacity:.3;right:20%;font-style:italic;">' + d.car.number + '</div><div style="float:left;margin-right:12px;"><span class="rank" style="font-size:30px;">' + rank + '</span></div><h3 class="ui-li-heading">' + d.bestpax + ' - ' + d.name + '</h3><span class="ui-li-count">' + d.runCount + '</span></a></li>';
            }
            html.push(li);
            rank++;
        }

    }
    $('#classList').hide();
    $('#btn-selectclass').hide();
    $('#resulttimes').empty().html(html.join('')).show().listview('refresh').find('a').bind('vclick', showDriver);
    $('#lastupdated').text(lastpoll);
    $('#runcount').text(totalruns);
}

function genClass() {
    var dv = drivers, html = [];
    //show class list if not selected
    if (selectedClass == null) {
        $('#resulttimes').hide();
        $('#btn-selectclass').hide();
        //create list
        var clist = [];
        for (var i = 0; i < dv.length; i++) {
            var axc = dv[i].axclass, exists = false ;
            //search
            for (var c = 0; c < clist.length; c++) {
                if (clist[c] == axc) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {clist.push(axc); }
        }

        //write it out
        clist.sort();
        
        for (var i = 0; i < clist.length; i++) {
            var clss = clist[i];
            html.push('<li><a id="cls-' + clss + '" class="ui-btn ui-btn-up-c">' + clss + '</a></li>');
        }
        $('#classList').show();
        $('#classList > ul').empty().html(html.join('')).find('a').bind('click', function () {
            var el = $(this), c = el.attr('id').split('-')[1];
            selectedClass = c;
            genClass();

        });

        

//        for (var i = 0; i < clist.length; i++) {
//            var clss = clist[i];
//            html.push('<li><a id="cls-' + clss + '" class="btn-classSelect">' + clss + '</a></li>');
//        }
//        $('#resulttimes').empty().html(html.join('')).listview('refresh').find('a').bind('click', function () {
//            var el = $(this), c = el.attr('id').split('-')[1];
//            selectedClass = c;
//            genClass();

//        });

    } else {

        $('#classList').hide();
        $('#btn-selectclass').show();
        var cs = [], tdv = [];

        //first filter
        for (var i = 0; i < dv.length; i++) {
            if (dv[i].axclass == selectedClass) {
                tdv.push(dv[i]);
            }
        }

        // sort it
        tdv.sort(function (a, b) {
            if (a.best == b.best) { return 0; }
            return a.best - b.best;
        });


        //create it
        var best = 99999, rank = 1;
        cls = '';
        for (var i = 0; i < tdv.length; i++) {
            var li = '';
            var d = tdv[i];
           
            if (cls != d.axclass) {
                cls = d.axclass;
                html.push('<li data-role="list-divider">' + cls + '</li>');
                rank = 1;
                best = d.best;
            }

            var dif = Math.floor((d.best - best) * 1000) / 1000;
            if (settings.showDetails) {
                //li = '<li><a id="rawdrv-' + d.id + '" href="/driver?cn=' + d.car.number + '&dn=' + d.name + '" data-ajax="false"><div style="position:absolute;font-size:50px;opacity:.3;right:20%;font-style:italic;">' + d.car.number + '</div><div style="float:left;margin-right:12px;"><span class="rank" style="font-size:60px;">' + rank + '</span></div><h3 class="ui-li-heading">' + d.name + '</h3><p class="ui-li-desc" style="font-size:1.2em;">' + d.best + (rank > 1 ? '<span style="color:red;"> +' + dif + '</span>' : '') + '</p><p class="ui-li-desc">DNFs: ' + d.dnfCount + ', Re-runs:' + d.reruns + ', Cones:' + d.cones + '</p><span class="ui-li-count">' + d.runCount + '</span></a></li>';
                li = '<li><a id="rawdrv-' + d.id + '" ><div style="position:absolute;font-size:50px;opacity:.3;right:20%;font-style:italic;">' + d.car.number + '</div><div style="float:left;margin-right:12px;"><span class="rank" style="font-size:60px;">' + rank + '</span></div><h3 class="ui-li-heading">' + d.name + '</h3><p class="ui-li-desc" style="font-size:1.2em;">' + d.best + (rank > 1 ? '<span style="color:red;"> +' + dif + '</span>' : '') + '</p><p class="ui-li-desc">DNFs: ' + d.dnfCount + ', Re-runs:' + d.reruns + ', Cones:' + d.cones + '</p><span class="ui-li-count">' + d.runCount + '</span></a></li>';
            } else {
                //li = '<li><a id="rawdrv-' + d.id + '" href="/driver?cn=' + d.car.number + '&dn=' + d.name + '" data-ajax="false"><div style="position:absolute;font-size:30px;opacity:.3;right:20%;font-style:italic;">' + d.car.number + '</div><div style="float:left;margin-right:12px;"><span class="rank" style="font-size:30px;">' + rank + '</span></div><h3 class="ui-li-heading">' + d.best + ' - ' + d.name + '</h3><span class="ui-li-count">' + d.runCount + '</span></a></li>';
                li = '<li><a id="rawdrv-' + d.id + '"><div style="position:absolute;font-size:30px;opacity:.3;right:20%;font-style:italic;">' + d.car.number + '</div><div style="float:left;margin-right:12px;"><span class="rank" style="font-size:30px;">' + rank + '</span></div><h3 class="ui-li-heading">' + d.best + ' - ' + d.name + '</h3><span class="ui-li-count">' + d.runCount + '</span></a></li>';
            }
            html.push(li);
            rank++;
            
        }
        $('#resulttimes').empty().html(html.join('')).show().listview('refresh').find('a').bind('vclick', showDriver);
        $('#results-lastupdated').text(lastpoll);
        $('#results-runcount').text(totalruns);
    }
}


var search = '', lastval = '';

function dofilter(val) {
    var list = $('#carsearch-list')
		        , listview = list.data("mobile-listview")
                , itemtext = ''
                ;

    var listItems = null, item;
    if (val.length < lastval.length || val.indexOf(lastval) !== 0) {

        // Removed chars or pasted something totally different, check all items
        listItems = list.children();
    } else {

        // Only chars added, not removed, only use visible subset
        listItems = list.children(":not(.ui-screen-hidden)");
    }
    lastval = val;
    $('#carsearch-label').text(val == '' ? 'Car Search' : val + '...');
    if (val) {
        for (var i = listItems.length - 1; i >= 0; i--) {
            item = $(listItems[i]);
            itemtext = item.jqmData("filtertext") || item.text();
            //console.log(listview);
            if (item.is("li:jqmData(role=list-divider)")) {

                item.toggleClass("ui-filter-hidequeue", !childItems);

                // New bucket!
                childItems = false;

            }
            else if (listview.options.filterCallback(itemtext, val)) {

                //mark to be hidden
                item.toggleClass("ui-filter-hidequeue", true);
            }
            else {

                // There's a shown item in the bucket
                childItems = true;
            }
        }

        // Show items, not marked to be hidden
        listItems
					    .filter(":not(.ui-filter-hidequeue)")
					    .toggleClass("ui-screen-hidden", false);

        // Hide items, marked to be hidden
        listItems
					    .filter(".ui-filter-hidequeue")
					    .toggleClass("ui-screen-hidden", true)
					    .toggleClass("ui-filter-hidequeue", false);
    }
    else {
        //console.log('empty clear it');
        //filtervalue is empty => show all
        listItems.toggleClass("ui-screen-hidden", false);
    }
    //listview._refreshCorners();
}


function ranktext(n) {
    if (n == 1) { return '1st'; }
    else if (n == 2) { return '2nd'; }
    else if (n == 3) { return '3rd'; }
    else { return n + 'th'; }
}

function showDriverFromRun() {
    var runix = parseInt($(this).attr('id').split('-')[1]);
    //console.log(runix);

    var run = runs[runs.length - 1 - runix];

    for (var i = 0; i < drivers.length; i++) {
        if (drivers[i].name == run.driver && drivers[i].car.number == run.car.number) {
            selectedDriverId = drivers[i].id;
            $.mobile.changePage('#page-driver');
            break;
        }
    }

    
    
}

function genRuns() {
    var cnt = runs.length
        , max = cnt - showRuns
        , html = [], n=0;

    max = max < 0 ? 0 : max;

    html.push('<li data-role="list-divider">Last ' + showRuns + ' Runs</li>');

    for (var i = cnt - 1; i >= max; i--) {
        var r = runs[i];
        //var s = '<li data-theme="' + (r.isDnf ? 'a' : r.getRerun ? 'e' : '') + '"><a href="/driver?cn=' + r.car.number + '&dn=' + r.driver + '" data-ajax="false">'
        var s = '<li data-theme="' + (r.isDnf ? 'a' : r.getRerun ? 'e' : '') + '"><a id="run-' + n + '">'
                     + '<div style="position:absolute;font-size:50px;opacity:.3;right:20%;font-style:italic;">' + r.car.number + '</div>'
                     + '<h3 class="ui-li-heading">' + r.driver + ' - ' + r.time + '</h3>'
                     + '<p class="ui-li-desc">Cones: <strong>' + r.cones + '</strong>, PAX: <strong>' + r.timepaxed + '</strong>, Class: <strong>' + r.axclass + '</strong></p>';
        if (r.isDnf) {
            s += '<p class="ui-li-count">DNF</p>';
        } else if (r.getRerun) {
            s += '<p class="ui-li-count">RERUN</p>';
        }

        s += '</a></li>';
        html.push(s);
        n++;
    }

    $('#runslist').empty().html(html.join('')).listview('refresh').find('a').bind('vclick', showDriverFromRun); ;
}