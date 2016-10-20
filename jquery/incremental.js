
var classes = [];
var previousDriver = null;
var activePage = '';
//var selectedClass = null;
var settings = {
    showDetails: true
    , displayResults: 0 // 0-raw time, 1=class, 2=pax
};

/*
//function reloadDrivers() {
//    $.ajax({
//        url: '/driversdata?' + new Date().getTime()
//        , dataType: 'json'
//        , success: function (d) {
//            drivers = d.drivers;
//            lastpoll = d.lastpoll;
//            totalruns = d.runscount;
//            genTimes();
//        }
//        , error: function (r, s, et) {
//            //console.log(s);
//        }
//    });
//}

//function reloadTtod() {
//    $.ajax({
//        url: '/ttoddata?' + new Date().getTime()
//        , dataType: 'json'
//        , success: function (d) {
//            ttod = d.ttods;
//            lastpoll = d.lastpoll;
//            totalruns = d.runscount;
//            genTtod();
//        }
//        , error: function (r, s, et) {
//            //console.log(s);
//        }
//    });
//}
*/

function toggleDetails() {
    var el = $(this);
    if (el.hasClass('ui-btn-active')) {
        $('#resulttimes').addClass('nodetails');
        settings.showDetails = false;
        el.removeClass('ui-btn-active').attr('data-icon', '');
        el.children().children().next().removeClass('ui-icon-check').addClass('ui-icon-delete');
        //genTimes();

    } else {
        $('#resulttimes').removeClass('nodetails');
        settings.showDetails = true;
        el.addClass('ui-btn-active').attr('data-icon', 'check');
        el.children().children().next().removeClass('ui-icon-delete').addClass('ui-icon-check');
        //genTimes();

    }

    

}


function toggleResults() {
    var el = $(this);
    if (el.attr('id').indexOf('class') > -1) {
        if (selectedClass == null) {
            $('#classlist').show();
            $('#btn-selectclass').hide();
            $('#resulttimes').hide();
			$('#subcategory').text('Live Results - By Class');
        }
        else {
            sortClass(selectedClass);
            $('#classlist').hide();
			$('#btn-selectclass').show();
            $('#resulttimes').show();
			$('#subcategory').text('Live Results - ' + selectedClass);
			$('#btn-raw').html('<a href="#" id="btn-raw" data-theme="e" class="btn-results">' + Overall + '</a>');
			$('#btn-class').html('<a href="#" id="btn-class" data-theme="e" class="ui-btn-active btn-results">' + Class + '</a>');
			$('#btn-pax').html('<a href="#" id="btn-pax" data-theme="e" class="btn-results">' + PAX + '</a>');
			$('#subcategory').text('Live Results - ' + selectedClass);
			//<li><a href="#" id="btn-raw" data-theme="e" class="ui-btn-active btn-results">Overall</a></li>
            //<li><a id="btn-class" href="#" data-theme="e" class="btn-results">Class</a></li>
            //<li><a id="btn-pax" href="#" data-theme="e" class="btn-results">PAX</a></li>
        }
        
    } else if (el.attr('id').indexOf('pax') > -1) {
        $('#classlist').hide();
        $('#btn-selectclass').hide();
        $('#resulttimes').show();
		$('#subcategory').text('Live Results - PAX');
        sortPax();
    } else {
        $('#classlist').hide();
        $('#btn-selectclass').hide();
        $('#resulttimes').show();
		$('#subcategory').text('Live Results - Overall');
        sortRaw();
    }
    //setTimeout(genTimes, 1);
}

function genTtod() {
	
    var html = '';
    for (var i = 0; i < ttod.length; i++) {
        var c = ttod[i];
        html += '<li data-role="list-divider" class="ui-li-desc">' + c.category + '</li>';
        //html += '<li><a href="/drivertimes?n=' + c.car.number + '"><div style="position:absolute;font-size:50px;opacity:.3;right:20%;font-style:italic;">' + c.car.number + '</div><span class="ui-li-aside">' + c.value + '</span><h3 class="ui-li-heading">' + c.driver + '</h3><p>' + c.car.description + ' </p></a></li>';
		//html += '<li><a id="ttod-' + i + '"><div style="position:absolute;font-size:50px;opacity:.3;right:20%;font-style:italic;">' +  c.value + '</div><span class="ui-li-aside"></span><h3 class="ui-li-heading">' + c.driver + ' <font style="font-weight:normal;">' + c.axclass + ' ' +c.car.number + '</font></h3><p>' + c.car.description + ' </p></a></li>';
        html += '<li><a id="ttod-' + i + '"><div style="position:absolute;font-size:50px;opacity:.3;right:20%;font-style:italic;">' +  c.value + '</div><h3 class="ui-li-heading">' + c.driver + ' <font style="font-weight:normal;">' + c.axclass + ' ' +c.car.number + '</font></h3><p>' + c.car.description + ' </p></a></li>';
		
    }
    $('#ttodresults').html(html).listview('refresh').find('a').click(function () {
        var ix = parseInt($(this).attr('id').split('-')[1]);
        var run = ttod[ix];
        for (var i = 0; i < drivers.length; i++) {
            if (drivers[i].name == run.driver && drivers[i].car.number == run.car.number) {
                selectedDriverId = drivers[i].id;
                activePage = 'driver';
				$.mobile.changePage('#page-driver');
                refreshDriver();
            }
        }
    });
    $('#ttodlastupdated').text(lastpoll);
    $('#ttodruncount').text(totalruns);

}



function showDriver() {
    selectedDriverId = parseInt($(this).attr('id').split('-')[1]);
    $.mobile.changePage('#page-driver' );
    activePage = 'driver';
    refreshDriver();
}

function refreshDriver() {
    console.log('refresh DRIVER: ' + selectedDriverId + ', count: ' + drivers.length);
	
	$('#driver-lastupdated').text(lastpoll);
    var driver = null;
	
	for (var i = 0; i < drivers.length; i++) {
		
        if (drivers[i].id == selectedDriverId) {
            driver = drivers[i];
			previousDriver = selectedDriverId;
        }
    }
	
	
	/*
		$.ajax({
				url: '/getCookie'
				, dataType: 'json'
				, success: function(d){
					
					selectedDriverId = d;
				}
			})
			
		
	for (var i = 0; i < drivers.length; i++) {
		
        if (drivers[i].id == selectedDriverId) {
            driver = drivers[i];
			previousDriver = selectedDriverId;
        }
    }
	*/	
	
	
    if (driver != null) {
        genDriver(driver);
        $('#drivertimes').empty().html('<li>Refreshing...</li>').listview('refresh');
        $.ajax({
            url: '/driverruns/' + driver.id
            , dataType: 'json'
            , success: function (d) {
                var html = [];
                for (rx in d) {
                    var r = d[rx];
					
                    var theme = r.isDnf ? ' data-theme="a" data-icon="delete"' : (r.getRerun ? ' data-theme="e" data-icon="alert"' : ' data-icon="false"');
					
					if (r.cones > 1) {
						r.cones = '<span class="ui-li-count">+' + r.cones + ' cones</span>'
					
					} else if (r.cones == 1) {
						r.cones = '<span class="ui-li-count">+' + r.cones + ' cone</span>'
					
					} 
					else {
						r.cones =''
					}
					
					if (r.isDnf) {
						r.cones = '<span class="ui-li-count">DNF</span>'
					} else if (r.getRerun) {
						r.cones = '<span class="ui-li-count">RERUN</span>'
					} 
					
					//if (driver.best == r.time) {
                    if (driver.bestpax == r.timepaxed && !r.getRerun && !r.isDnf) {
                        theme = ' data-theme="b" data-icon="check"';
                    }
                    html.push('<li' + theme + '><a href="#">' + r.rawtime.toFixed(3) + ' (' + r.timepaxed  + ')' + r.cones + '</a></li>');
					//html.push('<li' + theme + '><a href="#">' + r.time + ' (' + r.timepaxed  + ')' + r.cones + '</a></li>');
                    //html.push('<li' + theme + '><a href="#">' + r.time + ' (' + r.timepaxed  + ')<span class="ui-li-count">' + r.cones + '</span></a></li>');
                }
                $('#drivertimes').empty().html('<li data-role="list-divider"><H1>Times (PAX)</H1></li>' + html.join('')).listview('refresh');
            }
        });
    }
	
	
	
}

function genDriver(driver) {
    var html = [];
    
    $('#lbl-classname').text(driver.axclass);
    //$('#drivertimes').empty().html('<li data-role="list-divider">Times</li>' + html.join('')).listview('refresh');
    $('#rankclass').text(ranktext(driver.rankc));
    $('#rankoverall').text(ranktext(driver.ranko));
    $('#rankpax').text(ranktext(driver.rankp));
    $('#drivername').text(driver.name);
    $('#driver-lastupdated').text(lastpoll);
    $('#driver-runcount').text(driver.runCount);
    $('#driverinfo').html('<strong>' + driver.name + '</strong> ' + driver.axclass + ' ' + driver.car.number + '<br>' + driver.car.description   );
	
	
	// Added a button for this
	
	$('#driverclass').empty();
        var cl = driver.axclass;
		
		var li = $('<a id="cls||' + cl + '" class="class-select" data-role="button" data-theme="b"><p style="clear:both;">' + "See All " + cl + ' Class Results</p></a>')
		//var li = $('<li id="cls||' + cl + '"><a class="class-select ui-btn ui-btn-up-c" data-role="button" data-theme="b">' + "See All " + cl + ' Class Results</a></li>')
        //var li = $('<p style="clear:both;"><li id="cls||' + cl + '"><a class="class-select" data-role="button" data-theme="b">' + "See All " + cl + ' Class Results</a></li></p>')
		//var li = $('<li id="cls||' + cl + '"><a class="ui-btn ui-btn-up-c">' + cl + '</a></li>')
		//<p style="clear:both;"><a id="btn-selectclass" data-role="button" data-theme="b">Choose a Different Class</a></p>
            .bind('click', function () {
                var clc = $(this).attr('id').split('||')[1];
                selectedClass = clc;
				sortClass(clc);
				activePage = 'results';
				$.mobile.changePage('#page-results');
				$('#classlist').hide();
                $('#btn-selectclass').show();
                $('#resulttimes').show();
				toggleResults();
                $('#classlist').hide();
                $('#btn-selectclass').show();
                $('#resulttimes').show();
				$('#btn-raw').html('<a href="#" id="btn-raw" data-theme="e" class="btn-results">' + Overall + '</a>');
				$('#btn-class').html('<a href="#" id="btn-class" data-theme="e" class="ui-btn-active btn-results">' + Class + '</a>');
				$('#btn-pax').html('<a href="#" id="btn-pax" data-theme="e" class="btn-results">' + PAX + '</a>');
			
			
				
				
            });
        $('#driverclass').append(li);
	
	/*
	$('#driverclass').empty();
        var cl = driver.axclass;
        var li = $('<a class="btn-selectclass" id="cls||' + cl + '">' + "See All " + cl + ' Class Results</a>')
            .bind('click', function () {
                var clc = $(this).attr('id').split('||')[1];
                selectedClass = clc;
                $('#classlist').hide();
                $('#btn-selectclass').show();
                $('#resulttimes').show();
                sortClass(clc);
				activePage = 'results';
				$.mobile.changePage('#page-driver');
            });
        $('#driverclass').append(li);
    */
	
	
	/*
	$('#refresh-driver').click(function() {
		showDriver();
    });*/
	
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
    var id = parseInt($(this).attr('id').split('-')[2]);
    //console.log(runix);
    console.log('show driver from run : ' + id);
    for (var i = 0; i < drivers.length; i++) {
        if (drivers[i].id == id) {
            selectedDriverId = drivers[i].id;
            // I changed this: activePage = 'driver';
            activePage = 'driver';
            $.mobile.changePage('#page-driver');
            refreshDriver();
            break;
        }
    }



}

function genRuns() {
    var cnt = runs.length
        , max = cnt - showRuns
        , html = [], n = 0;

    max = max < 0 ? 0 : max;

    html.push('<li data-role="list-divider" class="ui-li-desc">Last ' + showRuns + ' Runs</li>');

    for (var i = cnt - 1; i >= max; i--) {
        var r = runs[i];
        //var s = '<li data-theme="' + (r.isDnf ? 'a' : r.getRerun ? 'e' : '') + '"><a href="/driver?cn=' + r.car.number + '&dn=' + r.driver + '" data-ajax="false">'
        var s = '<li data-theme="' + (r.isDnf ? 'a' : r.getRerun ? 'e' : '') + '"><a id="run-' + r.runNumber + '-' + r.driverId + '">'
            + '<div class="rankcontainer" style="float:left;margin-right:12px;text-align:center;"><span class="rank">' + r.runNumber + '</span></div>'
            //+ '<div style="position:absolute;font-size:50px;opacity:.3;right:20%;font-style:italic;">' + r.car.number + '</div>'
			+ '<div style="position:absolute;font-size:50px;opacity:.3;right:0%;font-style:italic;">' + r.time.toFixed(3) + '</div>'
			//+ '<h3 class="ui-li-heading">' + r.driver + ' <font style="font-weight:normal;">' + r.axclass + ' ' + r.car.number + '</font></h3>' 
            + '<h3 class="ui-li-heading">' + r.driver + '</h3>' 
            + '<p class="ui-li-desc">' +  r.car.description + '<br>PAX: <strong>' + r.timepaxed.toFixed(3) + '</strong><br></p>' + ( ( r.getRerun || r.isDnf ||  r.cones == 0  ) ? ' ' : '<span class="ui-li-count">' + (r.cones == 1 ? r.cones + ' cone' : r.cones + ' cones' ) + ' </span>' ) ;
        
		if (r.isDnf) {
			
            //s += '<p class="ui-li-count">&nbsp;DNF&nbsp;</p>';
			s += '<span class="ui-li-count">&nbsp;DNF&nbsp;</span>';
        } else if (r.getRerun) {
            s += '<span class="ui-li-count">RERUN</span>';
        }

        s += '</a></li>';
        html.push(s);
        n++;
    }

    $('#runslist').empty().html(html.join('')).listview('refresh').find('a').bind('click', showDriverFromRun);


}


function popClasses() {

    var cls = [];
    for (var i = 0; i < drivers.length; i++) {
        var p = drivers[i];

        var exists = false;
        for (var f = 0; f < cls.length; f++) {
            
                if (p.superClass == cls[f]) {
                    exists = true;
                    break;
                }
           
                //if (p.axclass == cls[f]) {
                //    exists = true;
                //    break;
                //}
            
        }
        if (!exists) { cls.push(p.superClass); }
    }
    cls.sort();
    classes = cls;

    $('#classlist').empty();
    for (var i = 0; i < classes.length; i++) {
        var cl = classes[i];
        var li = $('<li id="cls||' + cl + '"><a class="ui-btn ui-btn-up-c">' + cl + '</a></li>')
            .bind('click', function () {
                var clc = $(this).attr('id').split('||')[1];
                selectedClass = clc;
                $('#classlist').hide();
                $('#btn-selectclass').show();
                $('#resulttimes').show();
                sortClass(clc);
            });
        $('#classlist').append(li);
    }
}