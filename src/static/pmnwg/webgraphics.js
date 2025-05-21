"use strict";
/*
  Webgraphics -- browser graphics package for displaying Pathway/Genome diagrams.

  Overview:
     -Each diagram is represented by a set of drawing primitives and graphics descriptors in a <xxx>.wg file. 
       -drawing primitives include lines, arcs, rectangles, polygons, etc.
       -graphics descriptors include line width, color, backgrounds, fonts, etc.
       -the file format of the <xxx>.wg file is found in webgraphics.doc
     -wg diagrams are loaded asynchronously into a blank <div> html element as a page loads. 
     -wg files are generated (and usually cached) on the server.
     -only one wg diagram per <div> element
     -CelOv consists of four wg diagrams, one for each zoom level, in one <div> element. Webgraphics manages which of the four wg diagrams is draw based on the current zoom level.
     
  Namespaces:
       a) WG: contains all member functions and variables for drawing and managing wg diagrams. WG is implemented in webgraphics.js.
          There are two main classes in WG
	     Wg: contains all variables for managing a wg diagram
	     semzoom: contains all four wg diagrams and relative scale factors between levels of a Cellular Overview diagram. Needs to be renamed celOv.

       b) OmicsPanel: contains all member functions and variables for drawing and managing the Omics Control Panel. OmicsPanel is implemented in OmicsPanel.css and OmicsPanel.js


  TODO:
      -for historical reasons, there are three different overlay popups: 
        -YUI2 dialogs for "links" in 'normal' wg files (ie. regulation summary). 
	-YUI2 dialogs for "descriptors" in CelOv (ie. ECOLI-V1-celOvDescLocations-L0.json)
	-JQuery-UI dialog for the Omics Panel.
      These need to be combined into one consistant tooltip popup method asap.

  herson:Dec-01-2018

*/

/*
  WG namespace
*/

var WG = {

    Version:  "4.67",	//current WG version
    wglist: [],         //list of wg diagrams being managed

    /*
      list of all tooltips currently being managed. This should be moved to individual wg diagrams.
      These tooltips come from the CelOv descriptor files (ie. ECOLI-V1-celOvDescLocations-L0.json)
    */
    tooltip: {
	desc: null,
	dragState: 'endDrag',
	popups: [],
	popupCount: 0,
	delayTimer: -1,
    },

    //fix this. tooltip "links" in regular wg diagrams. Merge this with tooltips
    overlay : {
    },

    gc: {
	frame: null,     // global graphics context for drawing frame (border around diagram and zoom controls)
	focus: null      // global graphics context for drawing in focus nodes. (ie. drawing primitives in red.)
    },

    jqueryLoaded: 0,
    
    omicsPanel: null, //omics view control panel popup
    
    omicsNoColor: '#BBBBBB', //'#DDDDDD', //'#404040',

    ovCanvas: null,       //overlay canvas the covers the entire browser window. Used to draw connecting lines between a node and a popup when the popup is dragged off the wg canvas.
    dragState: 'endDrag', //drag state of a popup. Used to trigger a redraw of connector lines once a popup is no longer being dragged.

    wgactive: null,        //wg of current celOv level or regOv level
                           // RAB 21 Nov 2020 - for drawing genome overview highlights
    // paley:Nov-22-2021 This has been moved to the wg objects to fix bug 8778.
    //genOvLinks: [],    //an array of links of the form [linkid, url, x1, y1, x2, y2, string]
                           //where string is '"Gene" gene-name frame-id accesion product-string'

    pageLoaded: false,  //flag set when page is loaded
    pageOnLoad: null,   //callback funcion invoked once page is loaded

    contextMenuFn: null, // function of 3 args: evt, wg.nodeDesc[wg.focusId], wg.focusLink. Generally only one of the 2nd or 3rd args will be supplied.
    
    //public API ("declared" here only for documentation)

    Load: function(filename, divId, onLoad) {},     // asynchronously loads a wg file into a <div> element
    LoadCellularOverview: function(orgId, initLevel, divId) {},  // asynchronously loads all four zoom levels of a CelOv set of wg files into a div

    //private implementation ("declared" here only for documentation)
    Wg: function(wgfile) {},            //constructor for Wg class
    Init: function(wg, div, canvas) {}, // initialize a Wg instance
    LoadLevelAsync: function(div, semzoom, loadseq, canvas, orgId) {}, //asynchronously load each level of a celOv

};

/*
   The Xg class contains all variables relating to a wg diagram
*/

WG.Wg = function(wgfile)
{
    var wg = this;

    // TODO: error check wgfile

    // defined in the json .wg file
    wg.width = wgfile.width;
    wg.height = wgfile.height;
    wg.scaleFactor = wgfile.scaleFactor;
    wg.refPt = wgfile.refPt;
    wg.boundingBox = wgfile.boundingBox;
    wg.enableZoom = wgfile.enableZoom;
    wg.enablePan = wgfile.enablePan;
    wg.enablePrint = (typeof wgfile.enablePrint == "undefined") ? true : wgfile.enablePrint;
    if (typeof wgfile.AutoRescale != "undefined")
	wgfile.autoRescale = wgfile.AutoRescale;
    wg.autoRescale = (typeof wgfile.autoRescale == "undefined") ? "" : wgfile.autoRescale.toLowerCase();
    wg.primitives = wgfile.primitives;
    wg.gc = wgfile.GCs;
    wg.links = wgfile.links;
    wg.fonts = wgfile.fonts;

    // Initialized in WG.Init()
    wg.filename = "";
    wg.canvas = null;
    wg.ctx = null;
    wg.scaleDevice = 1;
    wg.scaleCanvas = 1;
    wg.scale = 1;
    wg.translate = {x:0, y:0};
    wg.fontId = -1;
    wg.ttHasHRef =  0;
    wg.mouseIgnore = 0;
    wg.mouseMoves = 0;
    wg.infocus = 0;
    wg.focusId = -1;
    wg.markerId = -1;
    wg.regMarkerIds = [];
    wg.alpha = 1;
    wg.border = {x:0, y:0};
    wg.div = null;
    wg.infocus = 0;
    wg.active = 1;
    wg.semzoom = null;
    wg.orgId = "";
    wg.zoom = {
	px: {x:0, y:0},
	pt: {x:0, y:0},
	min: .05,
	max: 20,
	scale: 1,
	level: 0,
	controlValue: 20,
	controlActive: false
    };
    wg.viewPort = [];
    wg.nodeTable = [];
    wg.nodeDesc = [];
    wg.primBox = [];
    wg.highlightList = [];
    wg.genOvLinks = [];
    wg.omics = {};
    wg.activeLink = null;
    wg.popup = []; //list of pathway omics popup dialogs
    wg.primIdMap = null; //canvas of primitive's IDs to find closest primitive to mouse
    wg.primIdFlags = null;
    //kr:Jul-28-2022 A key is a pwyFrameId (as a string) and a value is an Idx for a rxn (as an integer)
    wg.PwyToRxnIdxsMap = new Map();
    //kr:Aug-1-2022  A key is a pwyFrameId (as a string) and a value is an Idx for a cpd (as an integer)
    wg.PwyToCpdIdxsMap = new Map();
    //kr:Nov-16-2022 This Map has a pwyBlockName as a key and a list of pwyFrameIds as a value.
    wg.PwyBlockToFrameIdsMap = new Map();
    //kr:Aug-25-2022  A key is a nodeIdx (as an integer) and a value is an array of numerical Omics data points.
    // Not used now.  Instead:  FrameIdToOmicsDataMap()
    //wg.NodeIdxToOmicsDataMap = new Map();
    //kr:Aug-26-2022  A key is a frameId (as a string) and a value is an array of numerical Omics data points.
    wg.FrameIdToOmicsDataMap = new Map();
 };

/*
 herson:Dec-1-2018

    public API:
      WG.Load(filename, divId, onLoad)

    Description : 
      -loads a .wg file (json format) asynchronously
      -creates a wg drawing canvas as the only child of a <div> element

    Arguments : 
      filename: a string of the json wg file 
      divId: name of the html <div> element to hold the wg diagram.
      onLoad: callback function invoked once web page is completely loaded. This may no longer be used?

    Returns : 
      0: success -- async load started. Does not indicated load succeeded
      -1: error

    Example usage on html page :
        <div id='reg-schematic-div'>
	  <script>
	    WG.Load("EG11024_GENE-REG-SCHEMATIC.wg", 'reg-schematic-div');
          </script>
	</div>

*/

WG.Load = function(filename, divId, onLoad)
{
    //locate <div> element to hold wg
    var div = document.getElementById(divId);
    if (div == undefined) {
	console.log(divId, "not found or already loaded");
	return -1;
    }
    div.id = divId + '-loaded'; //flag to prevent double loading in Ajax tabs load callbacks

    var t0 = performance.now();
    WG.LoadJSON(filename, function(wgfile)
		{ // async callback once .wg json file is loaded
		    var wg = new WG.Wg(wgfile);
		    wg.filename = filename;
		    var dt = parseInt(performance.now() - t0);
		    console.log(filename, "loaded in", dt, "ms");

		    WG.Init(wg, div, null);
		    wg.active = true;
		    setTimeout(function() {
			switch(wg.autoRescale) {
			case "scaletoviewport":
			case "scaletoparentwidthorviewport":
			    WG.RescaleToViewPort(wg);
			    break;
			case "scaletoparent":
			    WG.RescaleToParent(wg);
			    break;
			default:
			    WG.Resize(wg, wg.width, wg.height);
			    WG.Draw(wg);
			}
			// invoke user's callback
			if (onLoad) {
			    if (WG.pageLoaded)  {
				onLoad(wg); // window[onLoad](wg);
			    } else {
				WG.pageOnLoad = function() {
				    onLoad(wg);
				}
			    }
			}
			if (performance.navigation.type == 2)
			    WG.Restore(wg);
		    }, 50);
			
		});

    return 0;
};


 WG.LoadGenomeOverview = function(orgId, divId)
{
      //locate div to hold wg
    var div = document.getElementById(divId);
    if (div == undefined) {
	console.log(divId, "not found or already loaded");
	return 0;
    }
    var fn = function(htmlString) {
	div.id = divId + '-loaded'; //flag to prevent double loading in Ajax tabs load callbacks
	div.innerHTML = htmlString;
    }
    xmlhttpGet("/"+orgID()+"/genome-overview.html", '', fn,true)
};

/*
 billington:Jul-9-2020

 Pretty much identical to WG.LoadCellularOverview
*/
 WG.LoadRegulatoryOverview = function(orgId, initLevel, divId, layout)
{
      //locate div to hold wg
    var div = document.getElementById(divId);
    if (div == undefined) {
	console.log(divId, "not found or already loaded");
	return 0;
    }
    div.id = divId + '-loaded'; //flag to prevent double loading in Ajax tabs load callbacks
    WG.contextMenuFn = RegOvContextMenu;

    var loadseq = [initLevel];

    // start load layers sequentially 
    WG.LoadRegLevelAsync(div, null, loadseq, null, orgId, layout);
};

 WG.ReLoadRegulatoryOverview = function(orgId, initLevel, divId, layout)
{
    //locate div to hold wg
    var div = document.getElementById(divId + '-loaded');
    if (div == undefined) {
	console.log(divId, "not found or already loaded");
	return 0;
    }
    div.id = divId + '-loaded';
    let canvas = (document.getElementById('canvas-' + divId));
    if (canvas)
	div.removeChild(canvas);
    var loadseq = [initLevel];
    // start load layers sequentially 
    WG.LoadRegLevelAsync(div, null, loadseq, null, orgId, layout);
};

/*
 herson:Dec-1-2018

  private:
     WG.LoadLevelAsync(div, semzoom, loadseq, canvas, orgId)

    Description : 
      -Asynchronously loads all levels of a regOv diagram. One wg file per zoom level.
      -creates a wg drawing canvas as the only child of a <div> element

    Arguments : 
      div: html <div> element being loaded
      semzoom: regOv structure containing wg and scale factors for each level. 
      loadseq: array of levels to load in order.
      canvas: <canvas> element to share between all levels
      orgId: name of organism (ie. ECOLI)

    Returns : 
      0: success -- async load started. Does not indicated load succeeded.
      -1: error
*/

WG.LoadRegLevelAsync = function(div, semzoom, loadseq, canvas, orgId, regLayout)
{
    var t0 = performance.now();

    var root = (window.location.protocol == "file:") ? './' : '/';     // use relative path with debugging locally
    var level = loadseq[0];

    /* 
       The initial query -- derived from the orgId -- triggers the server to generate the wg and desc files for current level is not already cached.
       Returns scale factors between levels and the path to the wg and desc files. 
       ie.
         url: /ECOLI/reg-overview-image?zoomlevel=0 
	 returns:
	    [[50,280,450,600],"/tmp/"]

	    where [50,280,450,600] is the relative scale factors between levels, and the .wg and desc files are in /tmp.
	    ie.
	      /tmp/ov/ECOLIZ0Linside-out-regOv.wg
	      /tmp/ov/ECOLIZ0Ltop-to-bottom-regOv.wg
	      ...
              /tmp/ov/ECOLI-regOvDescLocations.json
            the latter the same for all zoomlevels.
    */
    var uniqueId = document.getElementById('regUniqueID').value;
    var uniqueIdP = ((uniqueId == undefined) || (uniqueId == null) || (uniqueId == '')) ? false : true;
    var inq = uniqueIdP
	? root + orgId + '/reg-overview-image?zoomlevel=' + level + '&layout=' + regLayout + '&uniqueid=' + uniqueId
	: root + orgId + '/reg-overview-image?zoomlevel=' + level + '&layout=' + regLayout;
    var wg = WG.wgactive;
    var reCreateHighlightsP = (uniqueIdP)
	? false 
	: (wg && wg.highlightList.length > 0 && wg.highlightList[0][2].length == 0)
           ? true 
	   : false;
    
    WG.LoadJSON(inq, function(res) {
	if (res.length != 2) {
	    console.log("WG.LoadLevel failed", inq);
	    return;
	}
	if (level < 0 || level >= res[0].length) {
	    console.log("WG.LoadLevel: invalid level", level);
	    return -1;
	}

	if (res[1] == '/') {
	    console.log("warning:", inq, res, "=>/tmp/");
	    res[1] = '/tmp/';
	}
	let regLayoutUpCase = regLayout.toUpperCase();
	// initialize semzoom structure if first level loaded 
	if (semzoom == null) {
	    var scaleFactors = res[0];
	    var base = res[1];
	    var nlevels = scaleFactors.length;
	    semzoom = [];
	    var nodeDesc = []; //common node description table for all levels
	    for(var l = 0; l < nlevels; l++) {
		let wgFilenameStr = uniqueIdP 
		    ? base +  orgId + "Z" + l + "L" + regLayoutUpCase + "-" + uniqueId + "-regOv.wg"
		    : base + "ov/" + orgId + "Z" + l + "L" + regLayoutUpCase + "-regOv.wg";
		let tipsFilenameStr = uniqueIdP
		    ? base + orgId + "-regOvDescLocations" + "-" + uniqueId + ".json"
		    : base + "ov/" + orgId + "-regOvDescLocations.json";
		semzoom[l] = {
		    //derived wg file for this level
		    wgFilename: wgFilenameStr,
		    //derived desc file for this level
		    tipsFilename: tipsFilenameStr,
		    //zoom range for this level
		    zoom: {
			min: (l > 0) ? 1 : .2,
			max: (l <  nlevels-1) ?  scaleFactors[l+1] / scaleFactors[l] : 3,
			scale: scaleFactors[l] / scaleFactors[0]
		    },
		    scaleFactor: scaleFactors[l],
		    wg: null,
		    nodeDesc: nodeDesc,
		    orgId: orgId
		};
	    }

	    // initialize load order for remaining levels
	    for(var l = 1; l < nlevels; l++) {
		if (level-l >= 0)
		    loadseq.push(level-l);
		if (level+l < nlevels)
		    loadseq.push(level+l);
	    }
	}

	//load wg file for current level
	WG.LoadJSON(semzoom[level].wgFilename, function(wgfile) {
	    var wg = new WG.Wg(wgfile);
	    wg.filename = semzoom[level].wgFilename;
	    semzoom[level].wg = wg;
	    wg.semzoom = semzoom;
	    wg.orgId = orgId;
	    wg.zoom.min = semzoom[level].zoom.min;
	    wg.zoom.max = semzoom[level].zoom.max;
	    wg.zoom.scale = semzoom[level].zoom.scale;
	    wg.zoom.level = level;
	    wg.zoom.controlValue = 20 * (level+1);
	    wg.zoom.controlActive = false;
	    wg.nodeDesc = semzoom[level].nodeDesc;
	    WG.Init(wg, div, canvas);

	    //initial level?
	    if (canvas == null) {
		if ((WG.wgactive) && (WG.wgactive.orgId == wg.orgId))
		    wg.highlightList = WG.wgactive.highlightList;
		WG.wgactive = wg;
		/*
		wg.zoom.px.x = wg.canvas.clientWidth/2;
		wg.zoom.px.y = wg.canvas.clientHeight/2;
		wg.zoom.pt = wg.ctx.transformedPoint(wg.zoom.px.x, wg.zoom.px.y);
		*/
		WG.Resize(wg, wg.width, wg.height);

//		var uniqueId = document.getElementById('regUniqueID').value;
//		var uniqueIdP = ((uniqueId == undefined) || (uniqueId == null) || (uniqueId == '')) ? false : true;
/*		if (!uniqueIdP)  {
		    // load desc file for this level
		    WG.LoadJSON(semzoom[level].tipsFilename, function(tips) {
			console.log(semzoom[level].tipsFilename, "loaded");
			// last entry in json is set to null. remove it.
			if (tips && tips[tips.length-1] == null) {
			    tips.pop();
			}
			WG.NodeDescInit(wg, tips);
			WG.NodeTableInit(wg);
			WG.Draw(wg);
			// load remaining levels recursively
						loadseq.shift();
			if (loadseq.length > 0) {
			    WG.LoadRegLevelAsync(div, semzoom, loadseq, canvas, orgId, regLayout);
			}
		    });


		    })
		    } else { */
		if ( !uniqueIdP) {
		    WG.Draw(wg);
		} else {
		    if ( !uniqueIdP && !reCreateHighlightsP) {
		    WG.Draw(wg);
		    }}
		canvas = wg.canvas;
		wg.active = true;

		replayCelOperationsURL(); // may be ok to use this CEL fn
		
	    } else {
		wg.active = false;
	    }
	
	    var dt = parseInt(performance.now() - t0);
	    console.log(wg.filename,
			"level", wg.zoom.level,
			"scale", wg.zoom.scale,
			"min", wg.zoom.min,
			"max", wg.zoom.max,
			"ms", dt,
			"loaded");

	    // load desc file for this level
	    WG.LoadJSON(semzoom[level].tipsFilename, function(tips) {
		console.log(semzoom[level].tipsFilename, "loaded");
		// last entry in json is set to null. remove it.
		if (tips && tips[tips.length-1] == null) {
		    tips.pop();
		}
		WG.NodeDescInit(wg, tips);
		if ((uniqueIdP || reCreateHighlightsP) && wg.active) WG.Draw(wg);
		// load remaining levels recursively
		loadseq.shift();
		if (loadseq.length > 0) {
		    WG.LoadRegLevelAsync(div, semzoom, loadseq, canvas, orgId, regLayout);
		}
	    });
	});
    });
};

/*
 herson:Dec-1-2018

  public API:
      WG.LoadCellularOverview(orgId, initLevel, divId)

    Description : 
      -Asynchronously loads all levels of a celOv diagram. One wg file per zoom level.
      -creates a wg drawing canvas as the only child of a <div> element

    Arguments : 
      orgId: name of celOv org (ie. ECOLI). 
      initLevel: zoom level to start load sequence. 
        ie. if initLevel=2, then load order is levels 2,1,3,0
            if initLevel=0, then load order is levels 0,1,2,4 
      divId: name of the html <div> element to hold the wg diagram.

    Returns : 
      0: success -- async load started. Does not indicated load succeeded.
      -1: error

    Example usage on html page :
        <div id='celOv-div'>
	  <script>
	    WG.LoadCellularOverview('ECOLI', 0, 'celOv-div');
          </script>
	</div>

*/

WG.LoadCellularOverview = function(orgId, initLevel, divId)
{

    //locate div to hold wg
    var div = document.getElementById(divId);
    if (div == undefined) {
	console.log(divId, "not found or already loaded");
	return 0;
    }
    div.id = divId + '-loaded'; //flag to prevent double loading in Ajax tabs load callbacks

    // finish this...
    var celOv = {
	orgId: orgId,
	loadseq:  [initLevel],
	loadId: 0,
	root: 0,
	canvas: null
    };

    WG.contextMenuFn = CelOvContextMenu;

    var loadseq = [initLevel];

    // start load layers sequentially 
    WG.LoadLevelAsync(div, null, loadseq, null, orgId);
};

/*
 herson:Dec-1-2018

  private:
     WG.LoadLevelAsync(div, semzoom, loadseq, canvas, orgId)

    Description : 
      -Asynchronously loads all levels of a celOv diagram. One wg file per zoom level.
      -creates a wg drawing canvas as the only child of a <div> element

    Arguments : 
      div: html <div> element being loaded
      semzoom: celOv structure containing wg and scale factors for each level. 
      loadseq: array of levels to load in order.
      canvas: <canvas> element to share between all levels
      orgId: name of organism (ie. ECOLI)

    Returns : 
      0: success -- async load started. Does not indicated load succeeded.
      -1: error
*/

WG.LoadLevelAsync = function(div, semzoom, loadseq, canvas, orgId)
{
    var t0 = performance.now();
    
    var root = (window.location.protocol == "file:") ? './' : '/';     // use relative path with debugging locally
    var level = loadseq[0];

    /* 
       The initial query -- derived from the orgId -- triggers the server to generate the wg and desc files for current level is not already cached.
       Returns scale factors between levels and the path to the wg and desc files. 
       ie.
         url: /ECOLI/cel-overview-image?zoomlevel=0 
	 returns:
	    [[50,280,450,600],"/tmp/"]

	    where [50,280,450,600] is the relative scale factors between levels, and the .wg and desc files are in /tmp.
	    ie.
	      /tmp/ov/ECOLIZ0-celOv-web-graphics.wg
	      /tmp/ov/ECOLI-V1-celOvDescLocations-L0.json 
	      /tmp/ov/ECOLIZ1-celOv-web-graphics.wg
	      /tmp/ov/ECOLI-V1-celOvDescLocations-L1.json 
	      ...
    */
    var inq = root + orgId + '/cel-overview-image?zoomlevel=' + level;

    if (semzoom == null)
	WG.WaitForLevel(0);
    
    WG.LoadJSON(inq, function(res) {
	if (res.length != 2) {
	    console.log("WG.LoadLevel failed", inq);
	    return;
	}
	if (level < 0 || level >= res[0].length) {
	    console.log("WG.LoadLevel: invalid level", level);
	    return -1;
	}

	if (res[1] == '/') {
	    console.log("warning:", inq, res, "=>/tmp/");
	    res[1] = '/tmp/';
	}

	// initialize semzoom structure if first level loaded 
	if (semzoom == null) {
	    var scaleFactors = res[0];
	    var base = res[1];
	    var nlevels = scaleFactors.length;
	    semzoom = [];
	    var nodeDesc = []; //common node description table for all levels
	    for(var l = 0; l < nlevels; l++) {
		semzoom[l] = {
		    //derived wg file for this level
		    wgFilename: base + "ov/" + orgId + "Z" + l + "-celOv-web-graphics.wg",
		    //derived desc file for this level
		    tipsFilename: base + "ov/" + orgId + "-V1-celOvDescLocations-L" + l + ".json",
		    //zoom range for this level
		    zoom: {
			min: (l > 0) ? 1 : .2,
			max: (l <  nlevels-1) ?  scaleFactors[l+1] / scaleFactors[l] : 4,
			scale: scaleFactors[l] / scaleFactors[0]
		    },
		    scaleFactor: scaleFactors[l],
		    wg: null,
		    nodeDesc: nodeDesc,
		    orgId: orgId
		};
	    }

	    // initialize load order for remaining levels
	    for(var l = 1; l < nlevels; l++) {
		if (level-l >= 0)
		    loadseq.push(level-l);
		if (level+l < nlevels)
		    loadseq.push(level+l);
	    }
	}

	//load wg file for current level
	WG.LoadJSON(semzoom[level].wgFilename, function(wgfile) {
	    var wg = new WG.Wg(wgfile);
	    wg.filename = semzoom[level].wgFilename;
	    semzoom[level].wg = wg;
	    wg.semzoom = semzoom;
	    wg.orgId = orgId;
	    wg.zoom.min = semzoom[level].zoom.min;
	    wg.zoom.max = semzoom[level].zoom.max;
	    wg.zoom.scale = semzoom[level].zoom.scale;
	    wg.zoom.level = level;
	    wg.zoom.controlValue = (100/(semzoom.length+1)) * (level+1);
	    wg.zoom.controlActive = false;
	    wg.nodeDesc = semzoom[level].nodeDesc;
	    WG.Init(wg, div, canvas);

	    //initial level?
	    if (canvas == null) {
		WG.wgactive = wg;
		/*
		wg.zoom.px.x = wg.canvas.clientWidth/2;
		wg.zoom.px.y = wg.canvas.clientHeight/2;
		wg.zoom.pt = wg.ctx.transformedPoint(wg.zoom.px.x, wg.zoom.px.y);
		*/
		WG.Resize(wg, wg.width, wg.height);

		WG.Draw(wg);
		canvas = wg.canvas;
		wg.active = true;

		replayCelOperationsURL();

		// dismiss level 0 loading dialog
		if (WG.dialogLoading) 
		    WG.dialogLoading.hide();

	    } else {
		wg.active = false;
	    }
	
	    var dt = parseInt(performance.now() - t0);
	    console.log(wg.filename,
			"level", wg.zoom.level,
			"scale", wg.zoom.scale,
			"min", wg.zoom.min,
			"max", wg.zoom.max,
			"ms", dt,
			"loaded");

	    // load desc file for this level
	    WG.LoadJSON(semzoom[level].tipsFilename, function(tips) {
		console.log(semzoom[level].tipsFilename, "loaded");
		// last entry in json is set to null. remove it.
		if (tips && tips[tips.length-1] == null) {
		    tips.pop();
		}
		WG.NodeDescInit(wg, tips);

		// were we waiting for this level to load?
		if (WG.OnDelayZoom) {
		    WG.OnDelayZoom();
		}
		
		// load remaining levels recursively
		loadseq.shift();
		if (loadseq.length > 0) {
			WG.LoadLevelAsync(div, semzoom, loadseq, canvas, orgId);
		}
	    });
	});
    });
};

WG.LoadMultiViews = function(viewlist, initView, divId)
{
    //locate div to hold wg
    var div = document.getElementById(divId);
    if (div == undefined) {
	console.log(divId, "not found or already loaded");
	return 0;
    }
    div.id = divId + '-loaded'; //flag to prevent double loading in Ajax tabs load callbacks

    // load layers sequentially
    let keys = Object.keys(viewlist);
    let nloaded = 0;
    let wgfiles = {};
    div.wgviews = {};
    
    for(let v = 0; v < keys.length; v++) {
	(function(viewId, wgfilename) {
	    WG.LoadJSON(wgfilename, function(wgfile) {
		nloaded++;
		if (viewId == initView) {
		    let wg = new WG.Wg(wgfile);
		    wg.filename = wgfilename;
		    WG.Init(wg, div, null);
		    wg.active = true;
		    WG.Resize(wg, wg.width, wg.height);
		    WG.Draw(wg);
		    div.wgviews[viewId] = wg;
		} else {
		    let wg = new WG.Wg(wgfile);
		    wg.filename = wgfilename;
		    wg.div = div;
		    div.wgviews[viewId] = wg;
		}

		if (nloaded == keys.length) {
		    for(let v = 0; v < keys.length; v++) {
			let wg = div.wgviews[keys[v]];
			if (keys[v] != initView) {
			    WG.Init(wg, div, div.wg.canvas);
			}
		    }
		}
	    });
	})(keys[v], viewlist[keys[v]]);
    }
};

WG.ShowView = function(divId, viewId)
{
    var div = document.getElementById(divId + "-loaded");
    if (div == undefined) {
	console.log(divId, "not found or already loaded");
	return 0;
    }
    let wgOld = div.wg;
    let wgNew = div.wgviews[viewId];
    wgNew.scaleCanvas = wgOld.scaleCanvas;
    wgNew.scaleDevice = wgOld.scaleDevice;

    wgNew.active = true;
    wgOld.active = false;

    wgNew.infocus = 1;
    wgNew.mouseMoves = 0;// -100; //hack to not reset mousemoves on (delayed) enter

    wgNew.zoom.controlActive = wgOld.zoom.controlActive;
    wgOld.zoom.controlActive = false;	

    WG.SetEventHandlers(wgNew);

    wgNew.markerId = wgOld.markerId;
    wgNew.alpha = wgOld.alpha;
    wgNew.omics = wgOld.omics;
    
    WG.wgactive = wgNew;
	
    div.wg = wgNew;
    WG.Resize(wgNew, wgNew.canvas.clientWidth, wgNew.canvas.clientHeight);
    WG.Draw(wgNew);
};

WG.Init = function(wg, div, canvas)
{
    if (WG.ErrorCheckPrimitives(wg) == -1) {
	return -1;
    }

    WG.FixRoundedRectangles(wg);

    // init primitive bounding boxes to limit drawing to visible regions
    WG.PrimitiveTableInit(wg);

    // init node bounding boxes for tooltips
    WG.NodeTableInit(wg);

    // Grasper text centering bug
    WG.FixTextCentering(wg);

    // Init GCs stipple patterns, add defaults gc
    if (WG.InitGCs(wg) == -1) {
	return -1;
    }

    wg.noresize = (wg.autoRescale == "scaletoparent");
    if (wg.noresize) {
	wg.border.x = 1;
	wg.border.y = 1;
    } else {
	wg.border.x = 25;
	wg.border.y = 5;
    }
    
    wg.width = wg.boundingBox.right - wg.boundingBox.left + wg.border.x + 5;
    wg.height = wg.boundingBox.bottom - wg.boundingBox.top + wg.border.y + 5;

    // Share canvas between levels in CellOv
    if (canvas) {
	wg.canvas = canvas;
	wg.ctx = wg.canvas.getContext("2d");
    } else {

	//create canvas
	wg.canvas = document.createElement('canvas');
	wg.canvas.id = 'canvas-' + div.id.substring(0, div.id.indexOf('-loaded'));
	wg.ctx = wg.canvas.getContext("2d");
	trackTransforms(wg.ctx);
	
	if (wg.enablePan) {
	    wg.canvas.style.width = '99vw';
	    wg.canvas.style.height = '99vh';
	    div.style.overflowX = 'hidden';
	    div.style.overflowY = 'hidden';	    
	}

	WG.SetEventHandlers(wg);

	// debugging
	if (div.id == "testdiv-loaded") {
	    document.addEventListener('keydown', function(evt) {
		WG.OnKey(evt, wg);
	    });
	    wg.testpage = true;
	} else {
	    wg.testpage = false;
	    /*
	    console.log("debug keyboard version");
	    document.addEventListener('keydown', function(evt) {
		WG.OnKey(evt, wg);
	    })
	    */;
	}

	
	if (div) {
	    wg.div = div;
	    div.wg = wg;
	    div.appendChild(wg.canvas);
	    /* 
	       ptools loads tabs with ajax. After each tab is loaded, all 
	       scripts in any WebGraphics class div are executed. This can 
	       result in multiple loading of 
	       the same div when a different tab is loaded. Avoid this by
	       clear the class of any div alread loaded.
	    */
	    div.className = '';
	}
    }

    if (wg.enablePan) {
	wg.width = wg.canvas.clientWidth;
	wg.height = wg.canvas.clientHeight;
    } else {
	wg.enablePan = false; 
	wg.width = wg.boundingBox.right - wg.boundingBox.left + wg.border.x;
	wg.height = wg.boundingBox.bottom - wg.boundingBox.top + wg.border.y;
    }

    if (!canvas) {
	if (!wg.noresize)
	    WG.Resize(wg, wg.width, wg.height);

	// canvas pixel to zoom around
	wg.zoom.px = {x:0, y:0};
	wg.zoom.pt = {x:wg.boundingBox.left, y:wg.boundingBox.top};
    }
    
    // scale strings from server fonts to browser fonts
    //wg.ctx.textBaseline="top";
    WG.ScaleStrings(wg);

    wg.id = WG.wglist.length;
    WG.wglist.push(wg);

    //    if (!wg.semzoom && wg.links && wg.links.length > 0) {
    {
	WG.PrimIdMapInit(wg);
    }
    
};

WG.ErrorCheckPrimitives = function(wg)
{
    var npolys = 0, npolypts=0, nclosed=0, nfilled=0
    var nroundpolys = 0;
    var nlines = 0;
    var nrects = 0;
    var nroundrects = 0;
    var ncliprects = 0;
    var nellipses = 0;
    var nstrings = 0;
    var novals = 0;
    var narrows = 0;
    var hist10=0,hist100=0,hist500=0,hist1000=0,histbig=0;
    //    var dl=0, dll=0, dr=0, ds=0, da=0, de=0, dx=0, dp=0;

    // last entry in json primitives is set to null. remove it.
    if (wg.primitives && wg.primitives[wg.primitives.length-1] == null) {
	wg.primitives.pop();
    }

    for(var n = 0; n < wg.primitives.length; n++) {
	var primitive = wg.primitives[n];

	switch(primitive[0]) {
	case 'P': //polygon
	    if (primitive.length !=  7 || WG.IsGC(wg, primitive[2]) == 0) {
		console.log(wg.filename, ":", n, "error:", primitive);
		wg.primitives.splice(n--, 1);
		continue;
	    }

	    npolypts += primitive[3];
	    nclosed += primitive[4];
	    nfilled += primitive[5];
	    npolys++;

	    var npts = primitive[3];
	    if (npts < 10)
		hist10++;   
	    else if (npts < 100)
		hist100++;   
	    else if (npts < 500)
		hist500++;   
	    else if (npts < 1000)
		hist1000++;   
	    else {
		console.log("big=%d", npts);
		histbig++;
	    }
	    break;

	case 'RP': //rounded polygon
	    if (primitive.length !=  8 || WG.IsGC(wg, primitive[2]) == 0) {
		console.log(wg.filename, ":", n, "error:", primitive);
		wg.primitives.splice(n--, 1);
		continue;
	    }

	    npolypts += primitive[3];
	    nclosed += primitive[4];
	    nfilled += primitive[5];
	    nroundpolys++;

	    var npts = primitive[3];
	    if (npts < 10)
		hist10++;   
	    else if (npts < 100)
		hist100++;   
	    else if (npts < 500)
		hist500++;   
	    else if (npts < 1000)
		hist1000++;   
	    else {
		console.log("big=%d", npts);
		histbig++;
	    }
	    break;

	case 'L': // line
	    if (primitive.length !=  7 || WG.IsGC(wg, primitive[2]) == 0) {
		console.log(wg.filename, ":", n, "error:", primitive);
		wg.primitives.splice(n--, 1);
		continue;
	    } 
	    //if (wg.primitives[n-1][0] == 'L') dl++;
	    //if (wg.primitives[n-1][0] == 'L' && wg.primitives[n-1][2] == primitive[2]) dll++;
	
	    nlines++;
	    break;

	case 'R': // rectangle
	    if (primitive.length !=  8 || WG.IsGC(wg, primitive[2]) == 0) {
		console.log(wg.filename, ":", n, "error:", primitive);
		wg.primitives.splice(n--, 1);
		continue;
	    }
	    //if (wg.primitives[n-1][0] == 'R') dr++;
	    nrects++;
	    break;

	case 'RR': // rounded rectangle
	    if (primitive.length !=  9 || WG.IsGC(wg, primitive[2]) == 0) {
		console.log(wg.filename, ":", n, "error:", primitive);
		wg.primitives.splice(n--, 1);
		continue;
	    }
	    //if (wg.primitives[n-1][0] == 'RR') dr++;
	    nroundrects++;
	    break;

	case 'CR': // clipped rectangle
	    if (primitive.length !=  9 || WG.IsGC(wg, primitive[2]) == 0) {
		console.log(wg.filename, ":", n, "error:", primitive);
		wg.primitives.splice(n--, 1);
		continue;
	    }
	    //if (wg.primitives[n-1][0] == 'CR') dr++;
	    ncliprects++;
	    break;

	case 'S': // string
	    if (primitive.length !=  10 || WG.IsGC(wg, primitive[2]) == 0 || WG.IsFont(wg, primitive[3]) == 0) {
		console.log(wg.filename, ":", n, "error:", primitive);
		wg.primitives.splice(n--, 1);
		continue;
	    }
	    //if (wg.primitives[n-1][0] == 'S') ds++;
	    nstrings++;
	    break;

	case 'E': // ellipse
	    if (primitive.length !=  10 || WG.IsGC(wg, primitive[2]) == 0) {
		console.log(wg.filename, ":", n, "error:", primitive);
		wg.primitives.splice(n--, 1);
		continue;
	    }
	    //if (wg.primitives[n-1][0] == 'E') de++;
	    nellipses++;
	    break;

	case 'O': // oval
	    if (primitive.length !=  8 || WG.IsGC(wg, primitive[2]) == 0) {
		console.log(wg.filename, ":", n, "error:", primitive);
		wg.primitives.splice(n--, 1);
		continue;
	    }
	    //if (wg.primitives[n-1][0] == 'O') dx++;
	    novals++;
	    break;

	case 'A': // arrow
	    if (primitive.length !=  11 || WG.IsGC(wg, primitive[2]) == 0) {
		console.log(wg.filename, ":", n, "error:", primitive);
		wg.primitives.splice(n--, 1);
		continue;
	    }
	    //if (wg.primitives[n-1][0] == 'A') da++;
	    narrows++;
	    break;

	default:
	    console.log(wg.filename, ":", n, "error:", primitive);
	    wg.primitives.splice(n--, 1);
	    continue;
	}
	//if (n > 0 && wg.primitives[n][2] == wg.primitives[n-1][2]) dp++;
    }
/*
    console.log(wg.filename, 
		"prims", wg.primitives.length,
		"poly", npolys, nroundpolys, "(", npolypts, nclosed, nfilled, ")",
		"e", nellipses,
		"l", nlines, 
		"r", nrects, nroundrects, ncliprects,
		"s", nstrings,
		"o", novals,
		"a", narrows,
		"hist", hist10, hist100, hist500, hist1000, histbig);
		//"dl", dl, dll, "dr", dr, "de", de, "ds", ds, "da", da, "dx", dx, "dp", dp);
*/
    return 0;
};

WG.ScaleStrings =  function(wg)
{
    var ctx = wg.ctx;

    for(var p = 0; p < wg.primitives.length; p++) {
	var str = wg.primitives[p];
	if (str[0] == 'S') {
	    var fontId = str[3],
	    len = str[6],
	    text = str[8];
	    ctx.font = wg.fonts[fontId];
	    var actlen = wg.ctx.measureText(text).width;
	    var scale = len/actlen;
	    str[9] = scale;
	}
    }
    wg.fontId = -1;
};

WG.InitGCs = function(wg)
{
    for(var n = 0; n < wg.gc.length; n++) {
	var gc = wg.gc[n];

	if (gc.style == "stipple") {

	    // hack highlight stipple pattern
	    let foreground = gc.foreground;
	    gc.foreground = "#FF0000";
	    gc.fillpatternHighlight = CreatePattern(gc);
	    gc.foreground = foreground;
	    
	    gc.fillpattern = CreatePattern(gc);
	    if (!gc.fillpattern)  {
		console.log(wg.filename, "invalid GC stipple", n, gc);
		return -1;
	    }
	}

	gc.foreground = gc.foreground.toLowerCase();
	gc.background = gc.background.toLowerCase();

	gc.edgeColorSaved = gc.foreground;
	gc.foregroundSaved = gc.foreground;	
	gc.backgroundSaved = gc.background;
	gc.widthSaved = gc.width;
    }
    
    // add a GC for drawing frame when in focus.
    if (WG.gc.frame == null) {
	WG.gc.frame = {
	    width: 1, 
	    foreground: "#040404", 
	    background: "#000000",
	    style: "solid",
	    flip: 0
	};
    }

    if (WG.gc.focus == null) {
	WG.gc.focus = {
	    width: 1, 
	    foreground: "#FF0000", 
	    background: "#000000",
	    style: "solid",
	    flip: 0
	};
    }
    
    return 0;
};

WG.Resize = function(wg, width, height)
{
    if (wg.noresize)
	return;
    
    wg.scaleDevice = DevicePixelRatio(wg.ctx);
    width=Math.round(width);
    height=Math.round(height);

    let maxcanvas = 0x4000;

    if (wg.zoom.controlValueLast == undefined)
	wg.zoom.controlValueLast = wg.zoom.controlValue;

    if (width * wg.scaleDevice >= maxcanvas ||
        height * wg.scaleDevice >= maxcanvas) {
	console.log("too large", width, height, maxcanvas);
	return;
	if (width > height) {
	    width = maxcanvas / wg.scaleDevice;
	    wg.scaleCanvas = width / wg.width;
	    wg.zoom.controlValue = wg.zoom.controlValueLast;
	} else {
	    height = maxcanvas / wg.scaleDevice;
	    wg.scaleCanvas = height / wg.height;
	    wg.zoom.controlValue = wg.zoom.controlValueLast;
	}
    }
    wg.zoom.controlValueLast = wg.zoom.controlValue;

    if (wg.enablePan == false) {
	width = wg.width * wg.scaleCanvas + wg.border.x;// + 15;
	height = wg.height * wg.scaleCanvas + wg.border.y;// + 15;
	var minheight = Math.max(40, height);
	wg.canvas.style.width = width + 'px';
	wg.canvas.style.height = minheight + 'px';
    } else {
//	wg.canvas.style.width = "500px";
//	wg.canvas.style.height = "500px";
//	wg.canvas.style.width = width * wg.scaleCanvas + 'px';
//	wg.canvas.style.height = height * wg.scaleCanvas + 'px';
    }
    //console.log("resize", width, height, wg.scaleCanvas);
    var minheight = Math.max(40, height);
    wg.canvas.width = width * wg.scaleDevice;
    wg.canvas.height = minheight * wg.scaleDevice;

    // reset transform
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.scale(wg.scaleCanvas * wg.scaleDevice, wg.scaleCanvas * wg.scaleDevice);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);

    //console.log('wg', wg.width, wg.height, 'canvas', wg.canvas.width, wg.canvas.height, 'scale', wg.scaleCanvas, wg.scaleDevice, wg.scale);
    
    // keep zoompt at same position on canvas
    var oldZoom = wg.zoom.pt;
    var newZoom = wg.ctx.transformedPoint(wg.zoom.px.x, wg.zoom.px.y);

    var xoff = newZoom.x - oldZoom.x;
    var yoff = newZoom.y - oldZoom.y;

    // translate to .5 pixel boundry for cleaner single pixel lines
    var xoff0 = Math.round(xoff);
    var yoff0 = Math.round(yoff);

    xoff +=  (xoff0 > xoff) ? -.5 + (xoff0 - xoff) : .5 - (xoff - xoff0);
    yoff +=  (yoff0 > yoff) ? -.5 + (yoff0 - yoff) : .5 - (yoff - yoff0);

    if (minheight > height) {
	var dy = (minheight - height) * wg.scale;
	yoff += dy/2;
    }
    
    wg.translate.x = -xoff;
    wg.translate.y = -yoff;    

    wg.ctx.translate(xoff, yoff);
    //console.log('off', xoff, yoff, wg.border.x, wg.border.y);

    if (wg.primIdMap) {
	if (wg.enablePan == false) {
	    wg.primIdMap.style.width = wg.canvas.style.width;
	    wg.primIdMap.style.height = wg.canvas.style.height;
	} else {
	    wg.primIdMap.style.width = '100%';
	    wg.primIdMap.style.height = '100%';
	}
	
	wg.primIdMap.width = wg.canvas.width;
	wg.primIdMap.height = wg.canvas.height;
	var ctx = wg.primIdMap.getContext('2d');
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.scale(wg.scaleCanvas * wg.scaleDevice, wg.scaleCanvas * wg.scaleDevice);
	ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);
	ctx.translate(xoff, yoff);	
	wg.primIdFlags = 'redraw';
    }

    /*
    console.log("px", wg.zoom.px.x, wg.zoom.px.y,
		"old", oldZoom.x, oldZoom.y, 
		"new", newZoom.x, newZoom.y,
		"off", xoff, yoff);
    */
};

WG.Draw = function(wg)
{
    var t0 = performance.now();
    var width = wg.canvas.width;
    var height = wg.canvas.height;

    var min = wg.ctx.transformedPoint(0,0);
    var max = wg.ctx.transformedPoint(width, height);
    wg.viewPort = [min.x, min.y, max.x, max.y];
    
    // really weird, obscure error! Without this the first focus clears the background to black?????
    /*
    if (wg.backingStore == null) {
	wg.backingStore = wg.ctx.getImageData(0, 0, 10, 10); 
    }
    */
    wg.scale = wg.scaleCanvas * wg.scaleDevice;
    wg.ctx.save();
    wg.ctx.setTransform(1,0,0,1,0,0);
    wg.ctx.clearRect(0,0,width,height);
    wg.ctx.restore();

    wg.x0 = min.x;
    wg.y0 = min.y;
    wg.scale = wg.scaleCanvas * wg.scaleDevice;
    
    if (wg.semzoom) {
	for(let g = 0; g < wg.gc.length; g++) {
	    wg.gc[g].width = g_edgeWidth;
	    wg.gc[g].widthSaved = g_edgeWidth;
	}
    }

    WG.DrawPrimitives(wg);

    if (wg.alpha < 1) {
	wg.ctx.save();
	wg.ctx.setTransform(1,0,0,1,0,0);
	wg.ctx.fillStyle = "#FFFFFF";
	wg.ctx.globalAlpha = 1 - wg.alpha;
	wg.ctx.fillRect(0,0,width,height);
	wg.ctx.globalAlpha = 1;
	wg.ctx.restore();
    }

    WG.DrawHighlights(wg);
    WG.DrawMarker(wg, wg.markerId);
    for(var j = 0; j < wg.regMarkerIds.length; j++)
	WG.DrawMarker(wg, wg.regMarkerIds[j]);
    WG.DrawOmics(wg);
    WG.tooltip.DrawConnections(wg);

    if (wg.focusId != -1)
	WG.DrawFocus(wg, wg.focusId, 1);
    
    if (wg.infocus == 1 || wg.semzoom) {
	WG.SetGC(wg, WG.gc.frame);

	if (wg.enablePrint)
	    WG.PrintDraw(wg);
	
	if (wg.enableZoom) {
	    WG.zoomControl.Draw(wg, wg.semzoom ? wg.semzoom.length : 0);
	}
    }

    //WG.debugRefPt(wg);
    //WG.debugNodeBoxes(wg, wg.nodeTable, "#00FFFF");
    //WG.debugBBoxes(wg, wg.primBox, "#FF00FF");    
    //WG.debugFontSizes(wg);
    //WG.debugLinks(wg); 
    //WG.debugStringBoxes(wg); 
    //WG.debugBoundingBox(wg);

    WG.DrawPopupConnections();

//    console.log("draw", parseInt(performance.now()-t0));
};

WG.DrawFocus = function (wg, id, on)
{
    return; //disabled red focus box on CelOv 5/23/23
    //console.log('drawfocus', id, on);
    
    var gcId = -1;
    
    if (id < 0 ||
	id >= wg.nodeTable.length ||
	wg.nodeTable[id] == null)
	return;

    if (on == 0) {
	wg.focusId = -1;
	WG.Draw(wg);
	return;
    }

    wg.fontId = -1;
    let edgeWidth = Math.max(g_edgeWidth, g_edgeWidthHighlight);
    for(var g = 0; g < wg.gc.length; g++) {
	wg.gc[g].foreground = WG.gc.focus.foreground;
	wg.gc[g].background = WG.gc.focus.background;
	wg.gc[g].width = edgeWidth;
    }

    //WG.Draw(wg);

    var box = wg.nodeTable[id][0];
    var x = (box[0]-1 - wg.x0) * wg.scale;
    var y = (box[1]-1 - wg.y0) * wg.scale;
    var l = ((box[2]+1) - (box[0]-1)) * wg.scale;
    var h = ((box[3]+1) - (box[1]-1)) * wg.scale;
    
    wg.ctx.save();
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);
    wg.ctx.strokeStyle = WG.gc.focus.foreground;
    wg.ctx.strokeRect(x, y, l, h);
    wg.ctx.restore();
    
    // restore GC colors
    for(var g = 0; g < wg.gc.length; g++) {
	wg.gc[g].foreground = wg.gc[g].foregroundSaved;
	wg.gc[g].background = wg.gc[g].backgroundSaved;
	wg.gc[g].width = wg.gc[g].widthSaved;
    }

    return;
};

WG.DrawPrimitives = function(wg)
{
    //var t0 = performance.now();
    var roi = [wg.viewPort[0],
	       wg.viewPort[1],
	       wg.viewPort[2],
	       wg.viewPort[3]];
    var nprim=0, nprim2=0, nprim3=0;
    var gcId = -1;

    wg.ctx.save();
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);
    wg.fontId = -1;
    //wg.ctx.textBaseline="top";

    // If omics data, draw primitives in omicsNoColor(light white)
    var omicsNoColor=0;
    if (wg.omics &&
	wg.omics.display &&
	wg.omics.data) {

	// hack to make sure we're modifying all CelOv GCs except the pathway background polygons
	if (wg.semzoom &&
	    wg.primitives[0][0] == 'RP' &&
	    wg.primitives[0][2] == 0 &&
	    wg.gc[0].foreground == "#efefef") {
	    omicsNoColor = WG.omicsNoColor;
	    for(let g = 1; g < wg.gc.length; g++) {
		wg.gc[g].foreground = WG.omicsNoColor;
		wg.gc[g].background = WG.omicsNoColor;
	    }
	}
    }
    
    for(var n = 0; n < wg.primitives.length; n++) {
	if (wg.semzoom && wg.zoom.level == 0 && wg.primitives[n][0] == 'L')
	    continue;

	nprim2++;

	var box = wg.primBox[n];
	if (box[0] > roi[2] ||
	    box[1] > roi[3] ||
	    box[2] < roi[0] ||
	    box[3] < roi[1]) {
	    continue;
	}
	nprim++;

	var p = wg.primitives[n];

	if (p[2] != gcId) {
	    gcId = p[2];
	    WG.SetGC(wg, wg.gc[gcId]);
	    if (p[0] == 'RR') {
		wg.ctx.lineWidth = 1.5;
		gcId = -1;
	    }
	}

	if (omicsNoColor && p[0] == 'S') {
	    wg.ctx.fillStyle = wg.gc[gcId].foregroundSaved;
	}

	if (wg.focusIdx != -1 && wg.focusIdx == p[1]) {
	    var gc = wg.gc[gcId];
	    //console.log(gcId, gc.foreground);
	    if (gc.foreground != "#ffffff") {
		wg.ctx.fillStyle = "#666666";
		wg.ctx.strokeStyle = "#000000";
	    }
	    if (gc.style == 'stipple') {
		wg.ctx.fillStyle = gc.fillpatternHighlight;
		wg.ctx.strokeStyle = gc.fillpatternHighlight;
	    } else {
		//wg.ctx.strokeStyle = "#FF0000";
	    }

	    if (gc.scaleThickness) {
		wg.ctx.lineWidth = gc.width * wg.scale + 1;
	    } else {
		wg.ctx.lineWidth = gc.width + 1;
	    }
	    if (p[0] == 'S') {
		wg.ctx.fillStyle = "#000000"; //wg.gc[gcId].foreground;
		wg.fontId = p[3];
		wg.ctx.font = wg.fonts[p[3]];
		wg.ctx.font = "28px";
		console.log(wg.ctx.font);
		wg.fontId = -1;
	    }
	    
	    wg.ctx.globalCompositeOperation = 'source-over';
	    gcId = -1;
	}
/*
	if (wg.focusIds && wg.focusIds[n]) {
	    let gc = wg.gc[gcId];
	    if (p[0] == 'S') {
		wg.ctx.fillStyle = "#FF0000"; //wg.gc[gcId].foreground;
	    } else if (gc.style == 'stipple') {
		wg.ctx.fillStyle = gc.fillpatternHighlight;
		wg.ctx.strokeStyle = gc.fillpatternHighlight;
	    } else {
		wg.ctx.strokeStyle = "#FF0000";
	    }

	    if (gc.scaleThickness) {
		wg.ctx.lineWidth = gc.width * wg.scale + 1;
	    } else {
		wg.ctx.lineWidth = gc.width + 1;
	    }
	    gcId = -1;
	}
*/	
	WG.DrawPrimitive(wg, p);

	if (omicsNoColor && p[0] == 'S') {
	    wg.ctx.fillStyle = wg.gc[gcId].foreground;
	}
    }

    if (wg.semzoom && wg.zoom.level == 0) {
	gcId = -1;
	wg.ctx.beginPath();
	var s = wg.scale, x0=wg.x0, y0 = wg.y0;

	for(var n = 0; n < wg.primitives.length; n++) {
	    p = wg.primitives[n];
	    if (p[0] != 'L')
		continue;

	    var box = wg.primBox[n];
	    if (box[0] > roi[2] ||
		box[1] > roi[3] ||
		box[2] < roi[0] ||
		box[3] < roi[1]) {
		continue;
	    }
	    nprim3++;

	    if (p[2] != gcId) {
		wg.ctx.stroke();
		wg.ctx.beginPath();
		gcId = p[2];
		WG.SetGC(wg, wg.gc[gcId]);
	    }
	    var 
		x1 = (p[3]-x0)*s,
		y1 = (p[4]-y0)*s,
		x2 = (p[5]-x0)*s,
		y2 = (p[6]-y0)*s;

	    wg.ctx.moveTo(x1, y1);
	    wg.ctx.lineTo(x2, y2);
	}
	wg.ctx.stroke();
    }
    wg.ctx.restore();

    // restore GC colors
    for(var g = 0; g < wg.gc.length; g++) {
	wg.gc[g].foreground = wg.gc[g].foregroundSaved;
	wg.gc[g].background = wg.gc[g].backgroundSaved;
	wg.gc[g].width = wg.gc[g].widthSaved;
    }
/*
    var t1 = performance.now();
    console.log("draw", nprim, nprim2, nprim3, 
		"ms", parseInt(t1-t0), 
		"roi", roi[2]-roi[0], roi[3]-roi[1]);
*/
    return;
};

function setpixelated(context)
{
    context['imageSmoothingEnabled'] = false;       /* standard */
    context['mozImageSmoothingEnabled'] = false;    /* Firefox */
    context['oImageSmoothingEnabled'] = false;      /* Opera */
    context['webkitImageSmoothingEnabled'] = false; /* Safari */
    context['msImageSmoothingEnabled'] = false;     /* IE */
}

WG.DrawLink = function(wg, link, focusId)
{
    //console.log("drawlink", link[0], focusId, wg.focusLink ? wg.focusLink[0] : -1);
    if (!focusId) {
	wg.focusIdx = -1;
	WG.Draw(wg);
	return;
    }
    if (link != wg.focusLink)
	WG.Draw(wg);
    wg.focusLink = link;

    wg.ctx.save();
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);

    var x1 = link[2],
	y1 = link[3],
	x2 = link[4],
	y2 = link[5];

    x1 = (x1 - wg.x0) * wg.scale;
    y1 = (y1 - wg.y0) * wg.scale;	
    x2 = (x2 - wg.x0) * wg.scale;
    y2 = (y2 - wg.y0) * wg.scale;	

    y1 = Math.max(0, y1);

    var xmin = (wg.boundingBox.left - wg.x0) * wg.scale;
    var ymin = (wg.boundingBox.top - wg.y0) * wg.scale;
    var xmax = (wg.boundingBox.right - wg.x0) * wg.scale;
    var ymax = (wg.boundingBox.bottom - wg.y0) * wg.scale;

    x1 = Math.max(x1-2, xmin);
    y1 = Math.max(y1-2, ymin);
    x2 = Math.min(x2+2, xmax);
    y2 = Math.min(y2+2, ymax);
    //console.log(parseInt(y1), parsey2, ymin, ymax, 'x', x1, 2, xmin, xmax);

    wg.ctx.strokeStyle = "#000000";
    wg.ctx.lineWidth = 1;
    wg.ctx.strokeRect(x1, y1, x2-x1, y2-y1);
    wg.ctx.restore();
    return;
};

WG.DrawPrimIds = function(wg)
{
    var t0 = performance.now();
    var roi = [wg.viewPort[0],
	       wg.viewPort[1],
	       wg.viewPort[2],
	       wg.viewPort[3]];
    var nprim0=0, nprim1=0, nprim2=0;
    var gcId = -1;

    var tmpctx = wg.ctx;
    wg.ctx = wg.primIdMap.getContext("2d");
    wg.ctx.save();
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.clearRect(0, 0, wg.primIdMap.width, wg.primIdMap.height);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);

    var err = 0;
    for(var n = 0; n < wg.primitives.length; n++) {
	var p = wg.primitives[n];
	nprim0++;
	if (p[1] == -1)
	    continue;

	nprim1++;

	var box = wg.primBox[n];
	if (box[0] > roi[2] ||
	    box[1] > roi[3] ||
	    box[2] < roi[0] ||
	    box[3] < roi[1]) {
	    continue;
	}
	nprim2++;

	if (p[2] != gcId) {
	    gcId = p[2];
	    WG.SetGC(wg, wg.gc[gcId]);
	}
	var primId = n+1;

	primId = '#' + ('000000' + primId.toString(16).toUpperCase()).slice(-6);
	wg.ctx.fillStyle = primId;
	wg.ctx.strokeStyle = primId;

	var gc = wg.gc[gcId];
	if (gc.scaleThickness) {
	    wg.ctx.lineWidth = gc.width * wg.scale + 5;
	} else {
	    wg.ctx.lineWidth = gc.width + 5;
	}
	
	if (p[0] == 'S') {
	    //'R', id, gc, x, y, length, width, filled
    	    WG.DrawRectangle(wg, p[4], p[5]-p[7], p[6], p[7], 1);
	} else {
	    WG.DrawPrimitive(wg, p);
	}
    }

    //draw block of group primitives in non-overlapping nodes
    for(var l = 0; l < wg.links.length; l++) {
	var link = wg.links[l];
	if (link[7] == 1)
	    continue;

	var x1 = link[2];
	var y1 = link[3];
	var x2 = link[4];
	var y2 = link[5];

	x1 = (x1 - wg.x0) * wg.scale;
	y1 = (y1 - wg.y0) * wg.scale;	
	x2 = (x2 - wg.x0) * wg.scale;
	y2 = (y2 - wg.y0) * wg.scale;	
	
	primId = wg.primitives.length + link[0] + 1;
	primId = '#' + ('000000' + primId.toString(16).toUpperCase()).slice(-6);
	wg.ctx.fillStyle = primId;
	wg.ctx.fillRect(x1-1, y1-1, x2-x1+2, y2-y1+2);
    }
    
    wg.ctx.restore();
    wg.ctx = tmpctx;
    
    wg.primIdFlags = null;

    var t1 = performance.now();
    /*
      console.log("DrawPrimId", nprim0, nprim1, nprim2, 
      "ms", parseInt(t1-t0), 
      "roi", roi[2]-roi[0], roi[3]-roi[1]);
    */
    return;
};

WG.DrawPrimitive = function(wg, p)
{ 
    switch(p[0]) {
    case 'P':
	// 'P', id, gc, npts, closed, filled, [x1,y1, x2,y2 ... xN,yN]
       	WG.DrawPolygon(wg, p[3], p[4], p[5], p[6]);
	break;

    case 'RP':
        //'RP', id, gc, npts, closed, filled, radius, [x1,y1, x2,y2 ... xN,yN]
    	WG.DrawPolygon(wg, p[3], p[4], p[5], p[7]);
	break;

    case 'L':
	//'L', id, gc, x1, y1, x2, y2
   	WG.DrawLine(wg, p[3], p[4], p[5], p[6]);
	break;

    case 'R':
	//'R', id, gc, x, y, length, width, filled
    	WG.DrawRectangle(wg, p[3], p[4], p[5], p[6], p[7]);
	break;
	
    case 'RR':
	//'RR', id, gc, x, y, length, height, radius, filled
    	WG.DrawRoundedRectangle(wg, p[3], p[4], p[5], p[6], p[7], p[8]);
	break;

    case 'CR':
	//'CR', id, gc, x, y, length, height, radius, filled
    	WG.DrawClippedRectangle(wg, p[3], p[4], p[5], p[6], p[7], p[8]);
	break;

    case 'S':
	//'S' id, gc, font, x, y, length, height, text, scale [scale computed at load]
       	WG.DrawString(wg, p[3], p[4], p[5], p[6], p[7], p[8], p[9]);
	break;

    case 'E':
	//'E', id, gc, center-x, center-y, radius-x, radius-y, start-angle-in-radians, end-angle-in-radians, filled-p
        WG.DrawEllipse(wg, p[3], p[4], p[5], p[6], p[7], p[8], p[9]);
	break;

    case 'O':
	//["O", id, gc, x, y, x-radius, y-radius, filled
    	WG.DrawOval(wg, p[3], p[4], p[5], p[6], p[7]);
	break;

    case 'A': 
        //["A", id, gc, xtail, ytail, xhead, yhead,fromhead, tohead, headLength, headWidth]
    	WG.DrawArrow(wg, p[3], p[4], p[5], p[6], p[7], p[8], p[9], p[10]);
	break;

    default:
	console.log(wg.filename, "invalid primitive", p);
    }
};

WG.DrawPolygon = function(wg, npts, closed, filled, pts)
{
    var s = wg.scale, x0=wg.x0, y0 = wg.y0;
    var ctx = wg.ctx;

    ctx.beginPath();

    ctx.moveTo( (pts[0]-x0)*s, (pts[1]-y0)*s);
    for(var p = 2; p < npts*2; p+=2) {
	ctx.lineTo((pts[p]-x0)*s, (pts[p+1]-y0)*s);
    }

    if (closed)
	ctx.lineTo((pts[0]-x0)*s, (pts[1]-y0)*s);

    ctx.stroke();
    if (filled) {    
	ctx.fill();
    } 
};

WG.DrawLine = function(wg, x1, y1, x2, y2)
{
    var s = wg.scale, x0=wg.x0, y0 = wg.y0;
    x1 = (x1-x0)*s;
    y1 = (y1-y0)*s;
    x2 = (x2-x0)*s;
    y2 = (y2-y0)*s;

    wg.ctx.beginPath();
    wg.ctx.moveTo(x1, y1);
    wg.ctx.lineTo(x2, y2);
    wg.ctx.stroke();
};

WG.DrawRectangle = function(wg, x, y, length, height, filled)
{
    var s = wg.scale, x0=wg.x0, y0 = wg.y0;
    x = (x-x0)*s;
    y = (y-y0)*s;
    length *= s;
    height *= s;

    if (filled) {
	wg.ctx.fillRect(x, y, length, height);
    } else {
	wg.ctx.strokeRect(x, y, length, height);
    }
};

WG.DrawString = function(wg, fontId, x, y, l, h, text, scale)
{
    var s = wg.scale, x0=wg.x0, y0 = wg.y0;

    x = (x-x0)*s;
    y = (y-y0)*s;

    scale *= s;

    if (wg.fontId != fontId) {
	wg.ctx.font = wg.fonts[fontId];
	wg.fontId = fontId;
    }
    //    wg.ctx.font = wg.fonts[fontId];

    wg.ctx.save();
    wg.ctx.translate(x, y);
    wg.ctx.scale(scale, scale);
    wg.ctx.fillText(text, 0, 0);
    wg.ctx.restore();
};

WG.DrawEllipse = function(wg, x, y, rx, ry, theta0, thetaN, filled)
{
    var s = wg.scale, x0=wg.x0, y0 = wg.y0;
    x = (x-x0)*s;
    y = (y-y0)*s;
    rx *= s;
    ry *= s;

    var ctx = wg.ctx,
        ccw = false,  // always draw clockwise
        concave_fill = 0;  // flag if filling arc > PI

    //use clim constant value for PI*2, PI/2 rather than Math.PI() to avoid rounding erros in comparisons
    var PI = 3.1415927,
        PI2 = 6.2831855;

    // NOTE, clim and canvas have flipped Y coordinates.
    // ie. PI/2 = -y canvas, +y clim.
    {
	var tmp = -theta0;
	theta0 = -thetaN;
	thetaN = tmp;
	ccw = false;
    }

    while (thetaN < theta0) 
	thetaN += PI2;

    if (filled &&
	(thetaN - theta0) > PI &&
	(thetaN - theta0) < PI2)
	concave_fill = 1;
    
    ctx.beginPath();

    if (rx == ry) {
	if (concave_fill) {
	    ctx.arc(x, y, rx, theta0, theta0+PI, ccw);
	    ctx.fill();
	    ctx.beginPath();
	    theta0 += PI - PI / 180.0 * 3;
	}
	ctx.arc(x, y, rx, theta0, thetaN, ccw);
    } else if (ctx.ellipse) {
	if (concave_fill) {
	    ctx.ellipse(x, y, rx, ry, 0, theta0, theta0+PI, ccw);
	    ctx.fill();
	    ctx.beginPath();
	    theta0 += PI - PI / 180.0 * 3;
	}
	ctx.ellipse(x, y, rx, ry, 0, theta0, thetaN, ccw);
    } else {
	ctx.save();
	ctx.translate(x, y);
	ctx.scale(1, ry/rx);
	if (concave_fill) {
	    ctx.arc(x, y, rx, theta0, theta0+PI, ccw);
	    ctx.fill();
	    ctx.beginPath();
	    theta0 += PI - PI / 180.0 * 3;
	}
	ctx.arc(0, 0, rx, theta0, thetaN, ccw);
	ctx.restore();
    }

    if (filled) {
	ctx.fill();
	if (thetaN - theta0 < PI) {
	    var dr = .6;
	    var x1 = x + (rx+dr) * Math.cos(theta0);
	    var y1 = y + (ry+dr) * Math.sin(theta0);
	    var x2 = x + (rx+dr) * Math.cos(thetaN);
	    var y2 = y + (ry+dr) * Math.sin(thetaN);
	    ctx.beginPath();
	    ctx.moveTo(x, y);
	    ctx.lineTo(x1, y1);
	    ctx.lineTo(x2, y2);
	    ctx.lineTo(x, y);
	    ctx.fill();
	}
    } else {
	ctx.stroke();
    }
};

WG.DrawOval = function(wg, x, y, xradius, yradius, filled)
{
    var s = wg.scale, x0=wg.x0, y0 = wg.y0;
    x = (x-x0)*s;
    y = (y-y0)*s;
    xradius *= s;
    yradius *= s;

    if (xradius < 1 || yradius < 1)
	return;
    
    // taken from clim medium-draw-oval

    var x1 = x - xradius;
    var y1 = y - yradius;
    var x2 = x + xradius;
    var y2 = y + yradius;

    var ctx = wg.ctx;

    if (xradius > yradius) {
        x1 += yradius;
        x2 -= yradius;

	ctx.beginPath();

	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y1);
	ctx.moveTo(x1, y2);
	ctx.lineTo(x2, y2);
	ctx.stroke();

	if (filled) {
	    ctx.rect(x1-1, y1, x2-x1+2, y2-y1);
	    ctx.fill();
	}

	ctx.beginPath();
	ctx.arc(x1, y, yradius, Math.PI/2, Math.PI*3/2, 0);
	ctx.stroke();
	if (filled)
	    ctx.fill();
	ctx.beginPath();
	ctx.arc(x2, y, yradius, Math.PI/2, Math.PI*3/2, 1);
	ctx.stroke();
	if (filled)
	    ctx.fill();
    } else if (yradius > xradius) {
        y1 += xradius;
        y2 -= xradius;

	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x1, y2);
	ctx.moveTo(x2, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();

	if (filled) {
	    ctx.rect(x1, y1-1, x2-x1, y2-y1+2);
	    ctx.fill();
	}

	ctx.beginPath();
	ctx.arc(x, y1, xradius, 0.0, Math.PI, 1);
	ctx.stroke();
	if (filled)
	    ctx.fill();

	ctx.beginPath();
	ctx.arc(x, y2, xradius, 0.0, Math.PI, 0);
	ctx.stroke();
	if (filled)
	    ctx.fill();
    } else {
	var radius = Math.max(xradius, yradius);

	ctx.beginPath();
	ctx.arc(x, y, radius, 0.0, Math.PI*2, 1);
	ctx.stroke();
	if (filled)
	    ctx.fill();
    }
};

WG.DrawArrow = function(wg, xtail, ytail, xhead, yhead, fromhead, tohead, headLength, headWidth)
{
    if (tohead && fromhead) {
	WG.draw_arrow(wg, xtail, ytail, xhead, yhead, headLength, headWidth, fromhead, tohead);
	WG.draw_arrow(wg, xhead, yhead, xtail, ytail, headLength, headWidth, tohead, fromhead);
    } else if (tohead) {
	WG.draw_arrow(wg, xtail, ytail, xhead, yhead, headLength, headWidth, fromhead, tohead);
    } else if (fromhead) {
	WG.draw_arrow(wg, xhead, yhead, xtail, ytail, headLength, headWidth, tohead, fromhead);
    } else {
	WG.DrawLine(wg, xtail, ytail, xhead, yhead);
    }
};

WG.draw_arrow = function(wg, xtail, ytail, xhead, yhead, headLength, headWidth, fromHead, toHead)
{
    var s = wg.scale, x0=wg.x0, y0 = wg.y0;
    xhead = (xhead-x0)*s;
    yhead = (yhead-y0)*s;
    xtail = (xtail-x0)*s;
    ytail = (ytail-y0)*s;
    headLength *= s;
    headWidth *= s;

    var ctx = wg.ctx;
    var dx = xhead - xtail;
    var dy = yhead - ytail;
    var theta = Math.atan2(dy, dx);
    var len = Math.sqrt(dx*dx + dy*dy);

    ctx.save();
    ctx.translate(xhead, yhead);
    ctx.rotate(theta);

    var xbase = -headLength;
    var ybase = 0;
    xhead = 0;
    yhead = 0;
    if (fromHead)
	xtail = -len + headLength;
    else
	xtail = -len;
    ytail = 0;
    xbase = -headLength;
    ybase = 0;
    var x1 = xbase;
    var y1 = headWidth/2;
    var x2 = xhead;
    var y2 = yhead;
    var x3 = xbase;
    var y3 = -headWidth/2;

    ctx.beginPath();
    ctx.moveTo(xtail, ytail);
    ctx.lineTo(xbase, ybase);
    ctx.stroke();

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.fill();

    ctx.restore();
};


WG.DrawRoundedRectangle = function(wg, x, y, length, height, radius, filled)
{
    var s = wg.scale, x0 = wg.x0, y0 = wg.y0;
    x = (x-x0)*s;
    y = (y-y0)*s;
    length *= s;
    height *= s;
    radius *= s;

    if (radius < 1)
	return;

    var ctx = wg.ctx,
        x1 = x,
        y1 = y,
        x2 = x + length,
        y2 = y + height;

    x1 += .5 - (x1 - Math.floor(x1));
    y1 += .5 - (y1 - Math.floor(y1));    
    x2 += .5 - (x2 - Math.floor(x2));
    y2 += .5 - (y2 - Math.floor(y2));    

    ctx.beginPath();

    if (filled) {
	x1 -= .5; 
	y1 -= .5;
	x2 += .5;
	y2 += .5;
	ctx.rect(x1+radius, y1, x2-x1-radius*2, y2-y1);
	ctx.rect(x1, y1+radius, radius, y2-y1-radius*2);
	ctx.rect(x2-radius, y1+radius, radius, y2-y1-radius*2);

	ctx.moveTo(x1+radius, y1+radius);
	ctx.arc(x1+radius, y1+radius, radius, Math.PI, Math.PI*3/2, false);

	ctx.moveTo(x2-radius, y1+radius);
	ctx.arc(x2-radius, y1+radius, radius, Math.PI*3/2, 0, false);

	ctx.moveTo(x2-radius, y2-radius);
	ctx.arc(x2-radius, y2-radius, radius, 0, Math.PI*2, false);

	ctx.moveTo(x1+radius, y2-radius);
	ctx.arc(x1+radius, y2-radius, radius, Math.PI*2, Math.PI, false);

	ctx.fill();
    } else {
	ctx.moveTo(x1+radius, y1);
	ctx.lineTo(x2-radius, y1);
	ctx.moveTo(x2, y1+radius);
	ctx.lineTo(x2, y2-radius);
	ctx.moveTo(x2-radius, y2);
	ctx.lineTo(x1+radius, y2);
	ctx.moveTo(x1, y1+radius);
	ctx.lineTo(x1, y2-radius);

	ctx.moveTo(x1, y1+radius);
	ctx.arc(x1+radius, y1+radius, radius, Math.PI, Math.PI*3/2, false);

	ctx.moveTo(x2-radius, y1);
	ctx.arc(x2-radius, y1+radius, radius, Math.PI*3/2, 0.0, false);

	ctx.moveTo(x2, y2-radius);
	ctx.arc(x2-radius, y2-radius, radius, 0.0, Math.PI/2, false);

	ctx.moveTo(x1+radius, y2);
	ctx.arc(x1+radius, y2-radius, radius, Math.PI/2, Math.PI, false);

	ctx.stroke();
    }
};


WG.DrawClippedRectangle = function(wg, x, y, length, height, radius, filled)
{
    var s = wg.scale, x0 = wg.x0, y0 = wg.y0;
    x = (x-x0)*s;
    y = (y-y0)*s;
    length *= s;
    height *= s;
    radius *= s;

    if (radius < 1)
	return;

    var ctx = wg.ctx,
        x1 = x,
        y1 = y,
        x2 = x + length,
        y2 = y + height;

    ctx.beginPath();
    ctx.moveTo(x1+radius, y1);
    ctx.lineTo(x2-radius, y1);
    ctx.lineTo(x2, y1+radius);
    ctx.lineTo(x2, y2-radius);
    ctx.lineTo(x2-radius, y2);
    ctx.lineTo(x1+radius, y2);
    ctx.lineTo(x1, y2-radius);
    ctx.lineTo(x1, y1+radius);
    ctx.lineTo(x1+radius, y1);
    ctx.stroke();
    if (filled) {
	ctx.fill();
    }
};

WG.IsGC =  function(wg, gc)
{
    return (wg.gc && gc >= 0 && gc < wg.gc.length) ? 1 : 0;
};

WG.IsFont = function(wg, fid)
{
    return (wg.fonts && fid >= 0 && fid < wg.fonts.length) ? 1 : 0;
};

WG.SetGC = function (wg, gc)
{
    if (gc.style == 'stipple') {
	wg.ctx.fillStyle = gc.fillpattern;
	wg.ctx.strokeStyle = gc.fillpattern;
    } else  {
	wg.ctx.fillStyle = gc.foreground;
	wg.ctx.strokeStyle = gc.foreground;
    }
    if (gc.style == 'dash')  {
	wg.ctx.setLineDash([5]);
    } else {
	wg.ctx.setLineDash([]);
    }

    if (gc.scaleThickness) {
	wg.ctx.lineWidth = gc.width * wg.scale;
    } else {
	wg.ctx.lineWidth = gc.width;
    }
    
    if (gc.flip == 1) {
	wg.ctx.globalCompositeOperation = 'xor';
    } else {
	wg.ctx.globalCompositeOperation = 'source-over';
    }
};

WG.PrimitiveTableInit = function(wg)
{
    //var t0 = performance.now();
    var xmin, ymin, xmax, ymax;
    var noNodeIds = 0;
    var zeroNodeIds = 0;
    
    wg.primBox = new Array(wg.primitives.length);

    for(var n =0; n < wg.primitives.length; n++) {
	var primitive = wg.primitives[n];

	if (primitive[1] == -1)
	    noNodeIds++;
	if (primitive[1] == 0)
	    zeroNodeIds++;
	
	switch(primitive[0]) {
	case 'P': //polygon
	    var npts = primitive[3];
	    var pts = primitive[6];
	    xmin = xmax = pts[0];
	    ymin = ymax = pts[1];
	    for(var p = 2; p < npts*2; p+=2) {
		if (pts[p] < xmin)
		    xmin = pts[p];
		else if (pts[p] > xmax)
		    xmax = pts[p];

		if (pts[p+1] < ymin)
		    ymin = pts[p+1];
		else if (pts[p+1] > ymax)
		    ymax = pts[p+1];
	    }
	    break;

	case 'RP': //rounded polygon
	    var npts = primitive[3];
	    var pts = primitive[7];
	    xmin = xmax = pts[0];
	    ymin = ymax = pts[1];
	    for(var p = 2; p < npts*2; p+=2) {
		if (pts[p] < xmin)
		    xmin = pts[p];
		else if (pts[p] > xmax)
		    xmax = pts[p];

		if (pts[p+1] < ymin)
		    ymin = pts[p+1];
		else if (pts[p+1] > ymax)
		    ymax = pts[p+1];
	    }
	    break;

	case 'L': // line
	    if (primitive[3] < primitive[5]) {
		xmin = primitive[3];
		xmax = primitive[5];
	    } else {
		xmin = primitive[5];
		xmax = primitive[3];
	    }

	    if (primitive[4] < primitive[6]) {
		ymin = primitive[4];
		ymax = primitive[6];
	    } else {
		ymin = primitive[6];
		ymax = primitive[4];
	    }
	    if (xmin == xmax)
		xmax;// += 1;
	    if (ymin == ymax)
		ymax;// += 1;

	    break;

	case 'R': // rectangle
	case 'RR': // rounded rectangle
	case 'CR': // clipped rectangle
	    xmin = primitive[3];
	    ymin = primitive[4];
	    xmax = primitive[3] + primitive[5];
	    ymax = primitive[4] + primitive[6];
	    break;

	case 'S': // string
	    xmin = primitive[4];
	    ymax = primitive[5];
	    xmax = primitive[4] + primitive[6];
	    ymin = primitive[5] - primitive[7];
	    ymin += 2;
	    ymax += 2;	    
	    break;

	case 'E': // ellipse
	    xmin = primitive[3] - primitive[5];
	    ymin = primitive[4] - primitive[6];
	    xmax = primitive[3] + primitive[5];
	    ymax = primitive[4] + primitive[6];
	    break;

	case 'O': // oval 
	    xmin = primitive[3] - primitive[5];//*2;
	    ymin = primitive[4] - primitive[6];//*2;
	    xmax = primitive[3] + primitive[5];//*2;
	    ymax = primitive[4] + primitive[6];//*2;
	    break;

	case 'A': // arrow
	    xmin = Math.min(primitive[3], primitive[5]);
	    ymin = Math.min(primitive[4], primitive[6]);
	    xmax = Math.max(primitive[3], primitive[5]);
	    ymax = Math.max(primitive[4], primitive[6]);
	    var tol = Math.max(primitive[9], primitive[10])/2;//headLength, headWidth);
	    xmin -= tol;
	    ymin -= tol;
	    xmax += tol;
	    ymax += tol;
	    break;

	default:
	    console.log(wg.filename, ":", n, "error:", primitive);
	    wg.primitives.splice(n--, 1);
	    continue;
	}

	wg.primBox[n] = [
	    Math.min(xmin, xmax),
	    Math.min(ymin, ymax),
	    Math.max(xmin, xmax),
	    Math.max(ymin, ymax)
	];
    }
    
    WG.FixEllispeBoxes(wg);
    /*
      var dt = parseInt(performance.now() - t0);
      console.log(wg.primitives.length, "primitive bboxes init",
      "-1", noNodeIds,
      "0", zeroNodeIds,
      "ms",
      dt);
    */
};

WG.FixEllispeBoxes = function(wg) 
{
    var e=0;
    for(var n=0; n < wg.primitives.length; n++) {
	var p = wg.primitives[n];
	if (p[0] != 'E')
	    continue;

	var x0 = p[3];
	var y0 = p[4];
	var r = Math.max(p[5], p[6]);
	var theta1 = p[7];
	var theta2 = p[8];
	var x, y, xmin, ymin, xmax, ymax;

	if (theta2 - theta1 > Math.PI * 3 / 2 ||
	    theta1 - theta2 > Math.PI * 3 / 2)
	    continue;
	
	x = Math.cos(-theta1) * r + x0;
	y = Math.sin(-theta1) * r + y0;
	xmin = xmax = x;
	ymin = ymax = y;

	x = Math.cos(-theta2) * r + x0;
	y = Math.sin(-theta2) * r + y0;
	xmin = Math.min(x, xmin);
	ymin = Math.min(y, ymin);
	xmax = Math.max(x, xmax);
	ymax = Math.max(y, ymax);

	if (theta2 < theta1)
	    theta2 += 2*Math.PI;

	for(var theta = 0; theta < theta2; theta += Math.PI/2) {
	    if (theta > theta1 && theta < theta2) {
		x = Math.cos(-theta) * r + x0;
		y = Math.sin(-theta) * r + y0;
		xmin = Math.min(x, xmin);
		ymin = Math.min(y, ymin);
		xmax = Math.max(x, xmax);
		ymax = Math.max(y, ymax);
	    }
	}
	
	var box = wg.primBox[n];
	box[0] = parseInt(xmin - .5);
	box[1] = parseInt(ymin - .5);
	box[2] = parseInt(xmax + .5);
	box[3] = parseInt(ymax + .5);
    }
};

function D(t) 
{
    var d = t * 180.0 / Math.PI;
    return parseInt(d);
};

WG.FixFilterEmptyLinks = function(wg)
{
    var nfiltered = 0;
    var nlinks = wg.links.length;
    
    for(var l = 0; l < wg.links.length; l++) {
	if (wg.links[l][6] == "")  {
	    wg.links.splice(l--, 1);
	    nfiltered++;
	} else {
	}
    }

    console.log("%d of %d/%d links filtered\n", nfiltered, nlinks, wg.links.length);
};

WG.FixRoundedRectangles = function(wg)
{

    /* search for either:
       a) filled RR =  5 ellipses followed by 3 rectangles that overlap (one ellipse belongs to the outline RR but the output order is messed up)

       b) outline RR = 4 ellipses followed by 4 lines
    */

    for(var p = 0; p < wg.primitives.length; p++) {

	if (wg.primitives[p][0] != 'E')
	    continue;

	var id = wg.primitives[p][1];
	var ellipses = [];
	var rectangles = [];
	var lines = [];
	var nfilled = 0;
	var pp = p;
	for(; pp < wg.primitives.length; pp++) {
	    if (wg.primitives[pp][0] != 'E' ||
		wg.primitives[pp][1] != id) {
		break;
	    }
	    if (wg.primitives[pp][9] == 1)
		nfilled++;
	    ellipses.push(wg.primitives[pp]);
	}

	for( ; pp < wg.primitives.length; pp++) {
	    if (wg.primitives[pp][0] != 'R' ||
		wg.primitives[pp][1] != id) {
		break;
	    }
	    rectangles.push(wg.primitives[pp]);
	}

	for( ; pp < wg.primitives.length; pp++) {
	    if (wg.primitives[pp][0] != 'L' ||
		wg.primitives[pp][1] != id) {
		break;
	    }
	    lines.push(wg.primitives[pp]);
	}

	// fill rectangle?
	if (ellipses.length == 5 && nfilled == 4 &&
	    rectangles.length == 3 &&
	    lines.length == 0) {
	    WG.replaceRoundedRectangle(wg, p, ellipses, rectangles, lines, 1);
	} else if (ellipses.length == 4 && nfilled == 0 &&
		   rectangles.length == 0 &&
		   lines.length == 4) {
	    WG.replaceRoundedRectangle(wg, p, ellipses, rectangles, lines, 0);
	}
    }
};

WG.replaceRoundedRectangle = function(wg, p, ellipses, rectangles, lines, filled)
{
    var rect;
    var ncorners = 0;
    var radius = 0;

    console.log("fixedRoundedRectangle", ellipses, rectangles, lines);

    // compute bounding rectangle (for filled RR)
    if (filled) {
	for(var r = 0; r < rectangles.length; r++) {
	    var x1 = rectangles[r][3];
	    var y1 = rectangles[r][4];
	    var x2 = x1 + rectangles[r][5];
	    var y2 = y1 + rectangles[r][6];

	    if (x1 > x2) {var tmp=x1; x1 = x2; x2 = tmp;}
	    if (y1 > y2) {var tmp=y1; y1 = y2; y2 = tmp;}

	    if (r == 0) {
		rect = {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2};
	    } else {
		if (x1 < rect.x1) 
		    rect.x1 = x1; 
		if (y1 < rect.y1) 
		    rect.y1 = y1; 
		if (x2 > rect.x2) 
		    rect.x2 = x2; 
		if (y2 > rect.y2) 
		    rect.y2 = y2; 
	    }
	}
    } else {  // compute bounding rectangle for outline RR
	for(var l = 0; l < lines.length; l++) {
	    var x1 = lines[l][3];
	    var y1 = lines[l][4];
	    var x2 = lines[l][5];
	    var y2 = lines[l][6];

	    if (x1 > x2) {var tmp=x1; x1 = x2; x2 = tmp;}
	    if (y1 > y2) {var tmp=y1; y1 = y2; y2 = tmp;}

	    if (l == 0) {
		rect = {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2};
	    } else {
		if (x1 < rect.x1) 
		    rect.x1 = x1; 
		if (y1 < rect.y1) 
		    rect.y1 = y1; 
		if (x2 > rect.x2) 
		    rect.x2 = x2; 
		if (y2 > rect.y2) 
		    rect.y2 = y2; 
	    }
	}
    }

    // ellipse overlap a corner of the inner rect?
    for(var e = 0; e < ellipses.length; e++) {
	var x = ellipses[e][3];
	var y = ellipses[e][4];
	var r = ellipses[e][5];

	if ((Math.abs((x-r) - rect.x1) < 2 && Math.abs((y-r) - rect.y1) < 2) ||
	    (Math.abs((x-r) - rect.x1) < 2 && Math.abs((y+r) - rect.y2) < 2) ||
	    (Math.abs((x+r) - rect.x2) < 2 && Math.abs((y-r) - rect.y1) < 2) ||
	    (Math.abs((x+r) - rect.x2) < 2 && Math.abs((y+r) - rect.y2) < 2)) {
	    radius += r;
	    ncorners++;
	} else {
	    return -1;
	}
    }
    if (ncorners < 4) {
	return -1;
    }
    radius /= ncorners;;

    // add replacement rounded rectangle
    var rr = ['RR', 
	      ellipses[0][1], //id
	      ellipses[0][2], //gc
	      rect.x1,
	      rect.y1,
	      rect.x2 - rect.x1,
	      rect.y2 - rect.y1,
	      radius,
	      ellipses[0][9]]; //filled
    wg.primitives.splice(p, 0, rr);
    wg.primitives.splice(p+1, 8);     // remove fake rounded rectangle primitives

    return 0;
};

WG.FixTextCentering = function(wg)
{
    //var t0 = performance.now();

    var nfixed=0, nskipped=0;

    for(let n = 0; n < wg.nodeTable.length; n++) {
	if (wg.nodeTable[n] && wg.nodeTable[n][2].length > 1) {
	    var primList = wg.nodeTable[n][2];
	    for(let p1 = 0; p1 < primList.length; p1++) {
		if (primList[p1][0] == 'RR') {
		    let x0 = primList[p1][3];
		    let y0 = primList[p1][4];
		    let length = primList[p1][5];
		    let height = primList[p1][6];
		    let s1 = p1+1;
		    let s2 = p1+1;
		    for(; s2 < primList.length; s2++) {
			if (primList[s2][0] != 'S')
			    break;
		    }
		    if (s1 == s2)
			continue;

		    let p = primList[s1];
		    let xmin = p[4];
		    let ymin = p[5] - p[7];
		    let xmax = p[4] + p[6];
		    let ymax = p[5];
		    let nlines = 1;
		    let ytol = p[7]/2;
		    for(let s = s1+1; s < s2; s++) {
			let p = primList[s];
			let y = p[s] - p[7];
			if (y < ymin-ytol ||
			    y > ymin+ytol) {
			    ymin = p[5] - p[7];
			    ymax = p[5];
			    ytol = p[7]/2;
			    nlines++;
			} else {
			    xmin = Math.min(xmin, p[4]);
			    ymin = Math.min(ymin, p[5] - p[7]);
			    xmax = Math.max(xmax, p[4] + p[6]);
			    ymax = Math.max(ymax, p[5]);
			}
		    }
		    if (nlines == 1) {// && s2-s1==1) {
			let dx = xmin - (x0 + (length - (xmax-xmin)) / 2);
			let dy = ymin - (y0 + (height - (ymax-ymin)) / 2);
			for(let s = s1; s < s2; s++) {
			    primList[s][4] -= dx;
			    //primList[s][5] -= dy;
			    nfixed++;
			}
		    } else {
			nskipped++;
			//console.log("center nlines", nlines, s2-s1, s1, s2);
		    }
		}
	    }
	}
    }
    //console.log("Centered Text", nfixed, nskipped, performance.now()-t0);
};

// debugging functions...

WG.debugRefPt = function(wg)
{
    wg.ctx.save();
    wg.ctx.strokeStyle = 'purple';
    wg.ctx.lineWidth = 3;
    wg.ctx.strokeRect(wg.zoom.pt.x,//wg.refPt.X,
		      wg.zoom.pt.y,//wg.refPt.Y,
		      10,
		      10);
    wg.ctx.restore();    
};

WG.debugNodeBoxes = function(wg, nodeTable, color)
{
    var ctx = wg.ctx;
    var nboxes = 0;

    wg.ctx.save();
    wg.ctx.setTransform(1,0,0,1,0,0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);

    ctx.beginPath();
    ctx.strokeStyle = color;
    wg.ctx.lineWidth = 1;
    for(var n = 0; n < nodeTable.length; n++) {
	if (!nodeTable[n] || nodeTable[n][0].length != 4)
	    continue;
	var bbox = nodeTable[n][0];
	var x = (bbox[0] - wg.x0) * wg.scale;
	var y = (bbox[1] - wg.y0) * wg.scale;
	var l = (bbox[2] - wg.x0) * wg.scale - x;
	var h = (bbox[3] - wg.y0) * wg.scale - y;
	ctx.rect(x, y, l, h);
	nboxes++;
    }
    wg.ctx.stroke();
    ctx.restore();
    console.log('bboxes drawn', nboxes);
};

WG.debugBBoxes = function(wg, bbox, color)
{
    var ctx = wg.ctx;
    var nboxes = 0;

    wg.ctx.save();
    wg.ctx.setTransform(1,0,0,1,0,0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.fileStyle = color;
    wg.ctx.lineWidth = 1;
    for(var n = 0; n < bbox.length; n++) {
	if (bbox[n]) {
	    var x = (bbox[n][0] - wg.x0) * wg.scale;
	    var y = (bbox[n][1] - wg.y0) * wg.scale;
	    var l = (bbox[n][2] - wg.x0) * wg.scale - x;
	    var h = (bbox[n][3] - wg.y0) * wg.scale - y;
	    ctx.rect(x, y, l, h);
	    ctx.fillText(n, x+6, y-3);
	    nboxes++;
	}
    }
    wg.ctx.stroke();
    ctx.restore();
};

WG.debugFontSizes = function(wg)
{
    wg.ctx.save();
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);
    wg.ctx.scale(wg.scale, wg.scale);
    var x = 50, y = 50;
    wg.ctx.clearRect(x-20, y-20, 500, 1000);
    for(var f = 0; f < wg.fonts.length; f++) {
	var pts = wg.fonts[f].split(" ")[2];
	var str = pts + " => " + Math.round(parseInt(pts) * wg.scale * 100)/100 + "pts"; 
	str += " (" + Math.round(wg.scaleDevice*100)/100 + " * " + Math.round(wg.scale*100)/100 + " = " + Math.round(wg.scaleDevice * wg.scale * 100) / 100 + ")";
	//	    wg.ctx.font = "normal normal 12pt Helvetica";
	//	    wg.ctx.fillText(str, x, y);

	str += wg.fonts[f];
	wg.ctx.font = wg.fonts[f];
	wg.fontId = f;
	wg.ctx.fillText(str, x, y);

	y += 20;
    }
    wg.ctx.restore();
    wg.fontId = -1;
};

WG.debugBoundingBox = function (wg)
{
    wg.ctx.save();
    wg.ctx.setTransform(1,0,0,1,0,0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);

    var x1 = (wg.boundingBox.left - wg.x0) * wg.scale;
    var y1 = (wg.boundingBox.top - wg.y0) * wg.scale;
    var x2 = (wg.boundingBox.right - wg.x0) * wg.scale;
    var y2 = (wg.boundingBox.bottom - wg.y0) * wg.scale;

    wg.ctx.lineWidth = 3;
    wg.ctx.beginPath();
    wg.ctx.strokeStyle = 'orange';
    wg.ctx.rect(x1, y1, x2-x1, y2-y1);
    wg.ctx.stroke();
    wg.ctx.lineWidth = 1;
    wg.ctx.restore();
};

WG.debugStringBoxes =  function(wg)
{
    var ctx = wg.ctx;
    var s = wg.scale, x0=wg.x0, y0 = wg.y0;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);

    ctx.strokeStyle = 'green';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    for(var p = 0; p < wg.primitives.length; p++) {
	var str = wg.primitives[p];
	if (str[0] == 'S') {
	    var id = str[1],
		x = str[4],
		y = str[5],
		l = str[6],
		h = str[7],
		scale = str[9];

	    x = (x-x0)*s;
	    y = (y-y0)*s;

	    ctx.strokeRect(x, y, l*s, -h*s);
	    /*
	      if (str[8] == "Nucleosides and Nucleotides Degradation")
	      console.log(str, s, scale, s*scale);
	      ctx.save();
	      ctx.translate(x, y);
	      //  ctx.scale(scale, scale);
	      ctx.strokeRect(0, 0, l*s, -h*s);
	      ctx.restore();
	    */
	}
    }
    ctx.restore();
    wg.fontId = -1;
};

WG.debugLinks = function(wg)
{
    wg.ctx.save();
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);

    wg.ctx.beginPath();
    wg.ctx.strokeStyle = '#00ff00';
    wg.ctx.fillStyle = '#0000ff';    
    wg.ctx.lineWidth = 1;

    for(var n = 0; n < wg.links.length; n++) {
	var 
	tooltip = wg.links[n],
	id = tooltip[0],
	url = tooltip[1],
	x1 = tooltip[2],
	y1 = tooltip[3],
	x2 = tooltip[4],
	y2 = tooltip[5],
	tip = tooltip[6];

	x1 = (x1 - wg.x0) * wg.scale;
	y1 = (y1 - wg.y0) * wg.scale;	
	x2 = (x2 - wg.x0) * wg.scale;
	y2 = (y2 - wg.y0) * wg.scale;	

	wg.ctx.strokeStyle = tooltip[7] ? '#FFFF00' : '#00ff00';
	wg.ctx.rect(x1, y1, x2-x1, y2-y1);
	wg.ctx.fillText(id, x1+2, y1+15);
    }
    wg.ctx.stroke();
    wg.ctx.restore();
};

WG.PrimIdMapInit = function(wg)
{
    if (!wg.links || wg.links.length <= 0)
	return;
    
    wg.primIdMap = document.createElement('canvas');
    var ctx = wg.primIdMap.getContext('2d');
    setpixelated(ctx);
    //wg.div.appendChild(wg.primIdMap);

    //flag overlapping links
    var nover = 0;
    for(var l = 0; l < wg.links.length; l++) {
	var link1 = wg.links[l];
	for(var ll = l+1; ll < wg.links.length; ll++) {
	    var link2 = wg.links[ll];
	    var xover = Math.min(link1[4], link2[4]) - Math.max(link1[2], link2[2]);
	    var yover = Math.min(link1[5], link2[5]) - Math.max(link1[3], link2[3]);
	    if (xover > 4 && yover > 4) {
		link1[7] = 1;
		link2[7] = 1;
	    }
	}
    }

    //tighten up all link boxes
    var links = [];
    for(var n = 0; n < wg.primitives.length; n++) {
	var linkId = wg.primitives[n][1];
	if (linkId == -1)
	    continue;
	var link = wg.links.find( link => link[0] == linkId);
	if (!link) {
	    console.log("can't locate link", linkId);
	    continue
	}
	var pbox = wg.primBox[n];
	if (!links[linkId]) {
	    links[linkId] = link;
	    link[2] = pbox[0];
	    link[3] = pbox[1];
	    link[4] = pbox[2];
	    link[5] = pbox[3];
	} else {
	    if (pbox[0] < link[2])
		link[2] = pbox[0];
	    if (pbox[1] < link[3])
		link[3] = pbox[1];
	    if (pbox[2] > link[4])
		link[4] = pbox[2];
	    if (pbox[3] > link[5])
		link[5] = pbox[3];
	}
    }

    for(var link of wg.links) {
	wg.boundingBox.left = Math.min(wg.boundingBox.left, link[2]);
	wg.boundingBox.top = Math.min(wg.boundingBox.top, link[3]);
	wg.boundingBox.right = Math.max(wg.boundingBox.right, link[4]);
	wg.boundingBox.bottom = Math.max(wg.boundingBox.bottom, link[5]);
    }
};

WG.CheckLinks = function(wg)
{
    if (!wg.links || wg.links.length <= 0)
	return 0;

    var primcount = [];
    for(var n = 0; n < wg.primitives.length; n++) {
	var id = wg.primitives[n][1];
	if (id != -1) {
	    if (!primcount[id])
		primcount[id] = 1;
	    else
		primcount[id]++;
	    if (!wg.links || !wg.links.find(l => l[0] == id)) {
		console.log("no link located for primitive", n);
		err++;
	    }
	}
    }

    var err = 0;
    for(var l = 0; l < wg.links.length; l++) {
	var id = parseInt(wg.links[l][0]);
	if (id != -1 && !primcount[id]) {
//	    console.log("Invalid Link", l, id);
	    err++;
	}
    }
    console.log("link errors", err, primcount.length);

    
    return err > 0 ? -1 : 0;
};

// event handlers
WG.OnMouseEnter = function(evt, wg)
{
    wg.mouseIgnore = evt.buttons;

    if (wg.mouseIgnore)
	return;

    wg.canvas.style.cursor = 'default';

    wg.infocus = 1;
    wg.mouseMoves = 0;	

    WG.Draw(wg);
};

WG.OnMouseLeave = function (e, wg)
{
    if (wg.mouseIgnore)
	return;

    wg.canvas.style.cursor = 'default';

    var pt = EventCoords(e, wg.scaleDevice);

    if (pt.x < 0 ||
	pt.y < 0 ||
	pt.x > wg.canvas.width ||
	pt.y > wg.canvas.height) {
	if (wg.activeLink) {
	    WG.overlay.hide();
	    WG.DrawLink(wg, wg.activeLink, false);
	    wg.activeLink = null;
	}
	if (WG.tooltip.delayTimer != -1) {
	    clearTimeout(WG.tooltip.delayTimer);
	    WG.tooltip.delayTimer = -1;
	}
    }
    
    wg.infocus = 0;
    wg.mouseMoves = 0;

    WG.Draw(wg);
};

function openLink(url, evt)
{
    let a = document.createElement("a");    
    a.href = url;
	a.target = "_blank";
    let fakeEvt = new MouseEvent("click",
				 {
				     ctrlKey: evt.ctrlKey,
				     altKey: evt.altKey,
				     shiftKey: evt.shiftKey,
				     metaKey: evt.metaKey,
				     button: evt.button,
				     buttons: evt.buttons
				 });
    a.dispatchEvent(fakeEvt);
}

WG.OnMouseDown = function (evt, wg)
{
    if (wg.mouseIgnore)
	return;

    // canvas coordinate
    var px = EventCoords(evt, wg.scaleDevice);
    
    if (wg.enableZoom && WG.zoomControl.OnMouseDown(wg, px) == true) {
	return;
    }

    if (wg.enablePrint && WG.PrintOnClick(wg, px))
	return;

    if (WG.JupyterOnClick(wg, px))
	return;
    
    // tooltip w/ url clicked?
    if (wg.activeLink) {
	var url = wg.activeLink[1];
	if (url != "javascript:void(0);") {
	    wg.delayOpen = url;
	    wg.mouseMoves = 0;
	    //openLink(url, evt);
	}	    
	return;
    }

    if (wg.enablePan) {
	wg.zoom.px = px;
	wg.zoom.pt = wg.ctx.transformedPoint(px.x, px.y);
	WG.Draw(wg);
	wg.canvas.style.cursor = 'pointer';
	wg.primIdFlags = 'redraw';
    }
    
    return;
};

WG.OnMouseUp = function (evt, wg)
{
    if (wg.mouseIgnore)
	wg.mouseIgnore = evt.buttons

    if (wg.mouseIgnore)
	return;

    wg.canvas.style.cursor = 'default';

    if (evt.button == 0) {
	if (wg.delayOpen && wg.mouseMoves < 5) {
	    WG.Save(wg);
	    openLink(wg.delayOpen, evt);
	}
	wg.delayOpen = null;
	wg.zoom.controlActive = false;
    }
    
    WG.Draw(wg);    
};

WG.OnMouseMove = function(evt, wg) 
{
    if (wg.mouseIgnore)
	return;

    wg.mouseMoves++;

    // chrome bug when reentering window!
    if (wg.mouseMoves < 10)
	return;

    var px = EventCoords(evt, wg.scaleDevice);
    
    if (px.x < 0 ||
	px.y < 0 ||
	px.x > wg.canvas.width ||
	px.y > wg.canvas.height) {
	if (wg.activeLink) {
	    WG.overlay.hide();
	    WG.DrawLink(wg, wg.activeLink, false);
	    wg.activeLink = null;
	}
    }
    
    switch(evt.buttons) {
    case 0:
	if (wg.semzoom)
	    WG.tooltip.OnMouseMoveCelOv(wg, px);
	else
	    WG.tooltip.OnMouseMoveLinks(wg, px, evt);
	break;

    case 1:
	if (wg.zoom.controlActive) {
	    WG.zoomControl.OnMouseDrag(wg, px);
	    return;
	}
	
	if (wg.enablePan) {
	    if (wg.activeLink) {
		WG.overlay.hide();
		WG.DrawLink(wg, wg.activeLink, false);
		wg.activeLink = null;
	    }
	    // wg coordinates
	    var pt = wg.ctx.transformedPoint(px.x, px.y);

	    // pan
	    wg.zoom.px = px;
	    wg.translate.x -= pt.x - wg.zoom.pt.x;
	    wg.translate.y -= pt.y - wg.zoom.pt.y;
	    wg.ctx.translate(pt.x - wg.zoom.pt.x, pt.y - wg.zoom.pt.y);
	    WG.Draw(wg);
	}
	break;

    default:
	//console.log("unknown button", evt.buttons);
    }
};

var t00=performance.now();

WG.OnWheel = function(evt, wg)
{
    if (wg.enableZoom != true)
	return true;

    if (wg.activeLink) {
	WG.overlay.hide();
	WG.DrawLink(wg, wg.activeLink, false);
	wg.activeLink = null;
    }

    var popup = WG.tooltip.popups[0];
    if (popup && popup.visible == true && popup.keep == false) {
	popup.hide();
	popup.visible = false;
    }

    var delta = -evt.deltaY;

    /*
    var t1 = performance.now();
    console.log("wheel", delta, parseInt(t1-t00));
    t00 = t1;
    */
    if (delta > 2)
	delta = 2;
    if (delta < -2)
	delta = -2;
    
    if (wg.enablePan) {
	wg.zoom.px = EventCoords(evt, wg.scaleDevice);
	wg.zoom.pt = wg.ctx.transformedPoint(wg.zoom.px.x, wg.zoom.px.y);
    }
    var px0 = EventCoords(evt, wg.scaleDevice);
    var pt0 = wg.ctx.transformedPoint(px0.x, px0.y);

    if (!wg.view0) {
	wg.view0 = {
	    width: wg.canvas.width / wg.scaleDevice,
	    height: wg.canvas.height / wg.scaleDevice,
	    scrollX: window.scrollX,
	    scrollY: window.scrollY
	};
    }
    
    var zoom = wg.zoom.controlValue;
    zoom += delta;
    WG.OnZoom(wg, zoom, true);

    //scroll window rather than pan PWYs
  if (wg.autoRescale == "scaletoviewport" || wg.autoRescale == "scaletoparentwidthorviewport") {
	let w = wg.boundingBox.right - wg.boundingBox.left;
	let h = wg.boundingBox.bottom - wg.boundingBox.top;
	if (w * wg.scaleCanvas > window.innerWidth &&
	    h * wg.scaleCanvas > window.innerHeight) {
	    wg.enablePan = true;
	} else if (wg.enablePan) {
	    console.log("resetting");
	    wg.zoom.px.x = 0;
	    wg.zoom.px.y = 0;
	    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
	    wg.ctx.scale(wg.scaleCanvas * wg.scaleDevice, wg.scaleCanvas * wg.scaleDevice);
	    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);
	    wg.ctx.translate(.5, .5);
	    wg.zoom.pt = wg.ctx.transformedPoint(wg.zoom.px.x, wg.zoom.px.y);
	    WG.Resize(wg, wg.view0.width, wg.view0.height);
	    window.scrollTo(wg.view0.scrollX, wg.view0.scrollY); 
	    wg.enablePan = false;
	    return WG.OnWheel(evt, wg);
	}
	//console.log(wg.enablePan, h, h*wg.scaleCanvas, window.innerHeight, wg.translate.y);
	if (!wg.enablePan)
	    return false;
	
	var pt1 = wg.ctx.transformedPoint(px0.x, px0.y);
	var dx = pt0.x - pt1.x;
	var dy = pt0.y - pt1.y;
	var wx = window.scrollX;
	var wy = window.scrollY;

	if (wg.canvas.clientWidth - window.innerWidth)  {
	    wx += dx * wg.scaleCanvas;
	}
	if (wg.canvas.clientHeight - window.innerHeight) {
	    wy += dy * wg.scaleCanvas;
	}
	window.scrollTo(wx, wy);
    }
    
    return false;
};

function EventCoords(evt, scaleDevice)
{
    var bounds = evt.target.getBoundingClientRect();
    var x = evt.clientX - bounds.left;
    var y = evt.clientY - bounds.top;

    x *= scaleDevice;
    y *= scaleDevice;

    return {x: x, y: y};
}

WG.OnZoom = function(wg, zoomPercent, wheelEvent)
{
    if (wg.focusId != -1) {
	WG.DrawFocus(wg, wg.focusId, 0);
	wg.focusId = -1;
    }
    
    if (wg.semzoom) {
	zoomPercent = Math.max(zoomPercent, 4); //generalize this from level[0].zoom.min
	var step = 100/(wg.semzoom.length+1);
	var level = parseInt(zoomPercent/step);
	var levelPercent = (zoomPercent - level*step) / step;
	var scaling=1;
	
	level -= 1;
	if (level < 0) {
	    level = 0;
	    scaling = levelPercent;
	} else if (level >= wg.semzoom.length) {
	    return;
	} else {
	    scaling = 1 + (wg.zoom.max - 1) * levelPercent;
	}

	if (WG.dialogLoading)
	    WG.dialogLoading.hide();
	WG.OnDelayZoom = null;
	
	if (level != wg.zoom.level) {
	    if (wg.semzoom[level].wg == null) {
		WG.WaitForLevel(level);
		WG.OnDelayZoom = function() {
		    console.log("Delayed zoom", level, zoomPercent, wheelEvent);
		    WG.OnDelayZoom = null;
		    return WG.OnZoom(wg, zoomPercent, wheelEvent);
		};
		return;
	    }
	    var wgOld = wg;
	    
	    var wgNew = wg.semzoom[level].wg;

	    if (wheelEvent) {
		wgNew.scaleCanvas = (wgNew.zoom.level > wgOld.zoom.level) ? wgNew.zoom.min : wgNew.zoom.max;
	    } else {
		wgNew.scaleCanvas = scaling;
	    }
	    wgNew.scale = wgNew.scaleCanvas * wgNew.scaleDevice;
	    WG.SwitchLevels(wgOld, wgNew);
	    wg = wgNew;
	} else {
	    wg.scaleCanvas = scaling;
	}
	
	wg.scaleCanvas =  Math.max(wg.scaleCanvas, wg.zoom.min);
	wg.scaleCanvas =  Math.min(wg.scaleCanvas, wg.zoom.max);
	/*
	console.log("zoom%", zoomPercent, 
		    "level%", levelPercent, 
		    "level", level, 
		    "scaleCanvas", wg.scaleCanvas);
	*/
	wg.zoom.controlValue = zoomPercent;
	WG.Resize(wg, wg.canvas.clientWidth, wg.canvas.clientHeight);
	WG.Draw(wg);
    } else if (wg.enablePan) {
	var scaleFactor = 1.02;
	var delta = zoomPercent - wg.zoom.controlValue;
	var factor = Math.pow(scaleFactor, delta);

	wg.scaleCanvas *= factor;
	//console.log("zoom", zoomPercent, wg.zoom.controlValue, wg.scaleCanvas);
	wg.zoom.controlValue = zoomPercent;
	WG.Resize(wg, wg.canvas.clientWidth, wg.canvas.clientHeight);
	WG.Draw(wg);
    } else {
	//resize canvas zooms
	// fix this!
	var scaleFactor = 1.02;
	var delta = zoomPercent - wg.zoom.controlValue;
	if (delta == 0)
	    delta = -1;
	var factor = Math.pow(scaleFactor, delta);

	if (factor < 1 && wg.width * wg.scaleCanvas * factor < 10 ||
	    factor < 1 && wg.height * wg.scaleCanvas * factor < 10) {
	    return;
	}

	let maxcanvas = 0x4000;
	if (wg.width * wg.scale * factor > maxcanvas ||
	    wg.height * wg.scale * factor > maxcanvas) {
	    return;
	}
	wg.scaleCanvas *= factor;
	wg.zoom.controlValue = zoomPercent;
	WG.Resize(wg, wg.width * wg.scaleCanvas, wg.height * wg.scaleCanvas);
	WG.Draw(wg);
    }
};

WG.WaitForLevel = function(level)
{
    if (!WG.dialogLoading) {
	WG.dialogLoading = new YAHOO.widget.SimpleDialog("loading",
					      {
						  visible: true,
						  zindex: 999,
						  close: false
					      } );
    }
    var popup = WG.dialogLoading;
    var body = "<h1>Please wait --- computing magnification level " + (level+1) + "</h1>";       
    popup.setBody(body);
    popup.body.style.backgroundColor = 'white';
    popup.body.style.border = '2px solid black';
    popup.body.style.padding = "8px";
    popup.show();
    popup.render(document.body);
    popup.header.style.display = 'none';
    popup.center();
};

WG.SwitchLevels = function(wgOld, wgNew)
{
    wgNew.active = true;
    wgOld.active = false;

    wgNew.infocus = 1;
    wgNew.mouseMoves = 0;// -100; //hack to not reset mousemoves on (delayed) enter

    var dx = (wgOld.zoom.pt.x - wgOld.refPt.X) / wgOld.zoom.scale;
    var dy = (wgOld.zoom.pt.y - wgOld.refPt.Y) / wgOld.zoom.scale;
    wgNew.zoom.pt.x = wgNew.refPt.X + dx * wgNew.zoom.scale;
    wgNew.zoom.pt.y = wgNew.refPt.Y + dy * wgNew.zoom.scale;
    wgNew.zoom.px = wgOld.zoom.px;
    wgNew.zoom.controlActive = wgOld.zoom.controlActive;
    wgOld.zoom.controlActive = false;	

    WG.SetEventHandlers(wgNew);

    wgNew.highlightList = wgOld.highlightList;
    var highlightList = wgNew.highlightList;
    for(var l = 0; l < highlightList.length; l++) {
	WG.UpdateHighlightedNodes(wgNew, highlightList[l][0], highlightList[l][2]);
    }

    wgNew.markerId = wgOld.markerId;
    wgNew.alpha = wgOld.alpha;
    wgNew.omics = wgOld.omics;
    
    WG.wgactive = wgNew;
	
    for(var p = 0; p < WG.tooltip.popups.length; p++) {
	var popup = WG.tooltip.popups[p];
	if (popup.wg)
	    popup.wg = wgNew;
	if (popup.visible == true && wgNew.nodeTable[popup.nodeId] == null) {
	    popup.hide();
	    popup.visible = 'levelHidden';
	} else
	if (popup.visible == 'levelHidden' && wgNew.nodeTable[popup.nodeId] != null) {
	    popup.visible = true;
	    popup.show();
	}
    }

    WG.OmicsFlagNodes(wgNew);
};


// utilties
WG.LoadJSON = function(url, callback)
{
    console.log("loading", url);
    var req = new XMLHttpRequest();
    req.open("GET", url);
    req.overrideMimeType("application/json");
    req.onload = function() {
	if (req.readyState == 4 && req.status == 200) {
	    var json = JSON.parse(req.responseText);
            callback(json);
	} else {
	    console.log(url, "load failed");
	}
    };

    req.send(null);
};

WG.FetchJSON = function(url, hdr, body)
{
    var args = {
	method: "GET"
    };
    if (body) {
	args.method = "POST";
	args.body = body;
    }
    if (hdr) {
	args.headers = hdr;
    };
    //console.log(url, args);

    return fetch(url, args)
	.then(function(response) {
	    if (!response.ok) {
		const message = url + " " + response.status;
		console.log(message);
		return null;
	    }
	    return response.json();
	});
    /*
      .catch(function(err) {
      console.log('err', err, url);
      return err;
      });
    */
}

WG.LoadFile = function(url, callback)
{
    //console.log("loading", url);
    var req = new XMLHttpRequest();
    req.open("GET", url);
    //req.overrideMimeType("application/json");
    req.onload = function() {
	if (req.readyState == 4 && req.status == 200) {
	    var data = req.responseText;
            callback(data);
	} else {
	    console.log(url, "load failed");
	}
    };
    
    req.send(null);
};

function ParseColor(spec)
{
    var color = [];

    if (spec.length == 7)
      spec += "FF";

    if (/^#([0-9a-f]{8})$/i.test(spec) == false)
	return false;

    color[0] = parseInt(spec.substring(1,3), 16);
    color[1] = parseInt(spec.substring(3,5), 16);
    color[2] = parseInt(spec.substring(5,7), 16);
    color[3] = parseInt(spec.substring(7,9), 16);
    return color;
}

function CreatePattern(gc)
{
    var fg = ParseColor(gc.foreground);
    var bg = ParseColor(gc.background);
    if (!fg || !bg || !gc.fillpattern) {
	console.log("Invalid stipple colors", gc);
	return false;
    }

    // Make a temporary canvas to be the template for a pattern
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var cols = gc.fillpattern[0];
    var rows = gc.fillpattern[1];
    var bitmap = gc.fillpattern[2];
    if (cols*rows != bitmap.length) {
	console.log("Invalid bitmap size", ncols*rows, bitmap.length, gc);
	return false;
    }
    canvas.width = cols;
    canvas.height= rows;

    var imageData = ctx.getImageData(0, 0, cols, rows);
    var data = imageData.data;

    for(var i = 0, b = 0; b < bitmap.length; i += 4, b++) {
	if (bitmap[b] == 1) {
	    data[i] = fg[0];
	    data[i + 1] = fg[1];
	    data[i + 2] = fg[2];
	    data[i + 3] = fg[3];
	} else {
	    data[i] = bg[0];
	    data[i + 1] = bg[1];
	    data[i + 2] = bg[2];
	    data[i + 3] = bg[3];
	}
    }
    ctx.putImageData(imageData, 0, 0);

    var pattern = ctx.createPattern(canvas, 'repeat');

    return pattern;
}

// modified from "Gavin Kistner@phrogz.net. Written to support http://stackoverflow.com/questions/5189968/zoom-to-cursor-calculations/5526721#5526721-->

// Adds ctx.getTransform() - returns an SVGMatrix
// Adds ctx.transformedPoint(x,y) - returns an SVGPoint

function trackTransforms(ctx){
    var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
    var xform = svg.createSVGMatrix();
    ctx.getTransform = function(){ return xform; };
    
    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function(){
	savedTransforms.push(xform.translate(0,0));
	return save.call(ctx);
    };
    var restore = ctx.restore;
    ctx.restore = function(){
	xform = savedTransforms.pop();
	return restore.call(ctx);
    };

    var scale = ctx.scale;
    ctx.scale = function(sx,sy){
	xform = xform.scaleNonUniform(sx,sy);
	return scale.call(ctx,sx,sy);
    };
    var rotate = ctx.rotate;
    ctx.rotate = function(radians){
	xform = xform.rotate(radians*180/Math.PI);
	return rotate.call(ctx,radians);
    };
    var translate = ctx.translate;
    ctx.translate = function(dx,dy){
	xform = xform.translate(dx,dy);
	return translate.call(ctx,dx,dy);
    };
    var transform = ctx.transform;
    ctx.transform = function(a,b,c,d,e,f){
	var m2 = svg.createSVGMatrix();
	m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
	xform = xform.multiply(m2);
	return transform.call(ctx,a,b,c,d,e,f);
    };
    var setTransform = ctx.setTransform;
    ctx.setTransform = function(a,b,c,d,e,f){
	xform.a = a;
	xform.b = b;
	xform.c = c;
	xform.d = d;
	xform.e = e;
	xform.f = f;
	return setTransform.call(ctx,a,b,c,d,e,f);
    };
    var pt  = svg.createSVGPoint();
    ctx.transformedPoint = function(x,y){
	pt.x=x; pt.y=y;
	return pt.matrixTransform(xform.inverse());
    }
    /*
    var pix = svg.createSVGPoint();
    ctx.point2pixel = function(x,y){
	pix.x=x; pix.y=y;
	return pix.matrixTransform(xform);
    }
    */
}

function DevicePixelRatio(ctx)
{
    var devicePixelRatio = window.devicePixelRatio || 1;
    var backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
	ctx.mozBackingStorePixelRatio ||
	ctx.msBackingStorePixelRatio ||
	ctx.oBackingStorePixelRatio ||
	ctx.backingStorePixelRatio || 1;
    var ratio = devicePixelRatio / backingStoreRatio;

    return ratio;
}

WG.OnResize = function()
{
    WG.ResizeOverlay();

    for(var n = 0; n < WG.wglist.length; n++) {
	var wg = WG.wglist[n];
	if (wg.active &&
            wg.canvas.clientWidth > 10 &&
            wg.canvas.clientHeight > 10) {
	    WG.Resize(wg, wg.canvas.clientWidth, wg.canvas.clientHeight);
	    WG.Draw(wg);
	}
    }

//    WG.DrawPopupConnections();
    
};

function saveFile(data, filename)
{
    var blob = new Blob( [ data ], {
	    type: 'application/octet-stream'
	});
    
    var url = URL.createObjectURL( blob );
    var link = document.createElement( 'a' );
    link.setAttribute( 'href', url );
    link.setAttribute( 'download', filename );

    var event = document.createEvent( 'MouseEvents' );
    event.initMouseEvent( 'click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    link.dispatchEvent( event );

}

// hardwired zoom control widget
WG.zoomControl = {
    plus: {},
    bar: {},
    minus: {},
    slider: {},
    bbox: {},
    levels: {},
    Draw: function(wg, nlevels) {},
    OnMouseDown: function(wg, pt) {},
    OnMouseDrag: function(wg, pt) {}
};

WG.zoomControl.Draw = function(wg, nlevels)
{
    var zoomControl = WG.zoomControl;
    var icon = WG.icon;
    var x0 = 3.5;
    var y0 = 3.5;

    if (wg.enablePrint)
	y0 += 20;
    
    wg.ctx.save();
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.scale(wg.scaleDevice, wg.scaleDevice);
    wg.ctx.translate(.5, .5);

    if (wg.semzoom) {
	zoomControl.plus.x = x0;
	zoomControl.plus.y = y0;
	zoomControl.plus.w = icon.zoomPlus.width;
	zoomControl.plus.h = icon.zoomPlus.height;
	wg.ctx.drawImage(icon.zoomPlus, x0, y0);
	y0 += zoomControl.plus.h;

	if (nlevels > 0) {
	    zoomControl.bar.x = x0;
	    zoomControl.bar.y = y0;
	    zoomControl.bar.w = icon.zoomBar.width;
	    zoomControl.bar.h = icon.zoomBar.height/24 * (nlevels+1);
	    var w = zoomControl.bar.w;
	    var h = zoomControl.bar.h;
	    wg.ctx.drawImage(WG.icon.zoomBar, 0, 0, w, h, x0, y0, w, h);
	    y0 += h;
	} else {
	    zoomControl.bar.x = x0;
	    zoomControl.bar.y = y0;
	    zoomControl.bar.w = 0;
	    zoomControl.bar.h = 0;
	}
	
	zoomControl.minus.x = x0;
	zoomControl.minus.y = y0;
	zoomControl.minus.w = icon.zoomMinus.width;
	zoomControl.minus.h = icon.zoomMinus.height;
	wg.ctx.drawImage(icon.zoomMinus, x0, y0);

	if (nlevels > 0) {
	    x0 += 1;
	    y0 = zoomControl.bar.y + zoomControl.bar.h * (100 - wg.zoom.controlValue) / 100;
	    zoomControl.slider.x = x0;
	    zoomControl.slider.y = y0
	    zoomControl.slider.w = icon.zoomSlider.width;
	    zoomControl.slider.h = icon.zoomSlider.height;
	    y0 -= 2;
	    wg.ctx.drawImage(icon.zoomSlider, 2, 2, 16, 5, x0, y0, 16,5);
	} else {
	    zoomControl.slider.x = x0;
	    zoomControl.slider.y = y0
	    zoomControl.slider.w = 0;
	    zoomControl.slider.h = 0;
	}
	
	zoomControl.bbox.x = zoomControl.plus.x;
	zoomControl.bbox.y = zoomControl.plus.y;
	zoomControl.bbox.w = zoomControl.plus.w;
	zoomControl.bbox.h = zoomControl.plus.h + zoomControl.bar.h + zoomControl.minus.h;
    } else {
	zoomControl.levels.x = x0;
	zoomControl.levels.y = y0;
	zoomControl.levels.w = icon.zoomLevels.width;
	zoomControl.levels.h = icon.zoomLevels.height;
	wg.ctx.drawImage(icon.zoomLevels, x0, y0);

	zoomControl.bbox.x = zoomControl.levels.x;
	zoomControl.bbox.y = zoomControl.levels.y;
	zoomControl.bbox.w = zoomControl.levels.w;
	zoomControl.bbox.h = zoomControl.levels.h
    }
    wg.ctx.restore();
};

WG.zoomControl.OnMouseDown = function(wg, mouse)
{
    var zoomControl = WG.zoomControl;
    var value = wg.zoom.controlValue;
    var roi;

    var pt = {
	x: mouse.x / wg.scaleDevice,
	y: mouse.y / wg.scaleDevice
    };

    if (wg.zoom.controlActive == false &&
	pt.x > zoomControl.levels.x &&
	pt.y > zoomControl.levels.y &&
	pt.x < zoomControl.levels.x + zoomControl.levels.w &&
	pt.y < zoomControl.levels.y + zoomControl.levels.h) {
	var dy = (pt.y - zoomControl.levels.y)
	dy = 100 - (pt.y - zoomControl.levels.y) * 100 / zoomControl.levels.h;
	dy = Math.max(dy, 0);
	dy = Math.min(dy, 100);
	var dz = 5;
	
	if (dy > 70)
	    value += dz;
	else if (dy < 20)
	    value -= dz;
	else {
	    dy -= 45;
	    value += dz * dy/50;
	}
//	value = Math.max(value, 0);
//	value = Math.min(value, 100);
	WG.OnZoom(wg, value, false);
	wg.mouseMoves = 0;
	return true;
    }
    if (wg.zoom.controlActive == false &&
	pt.x > zoomControl.plus.x &&
	pt.y > zoomControl.plus.y &&
	pt.x < zoomControl.plus.x + zoomControl.plus.w &&
	pt.y < zoomControl.plus.y + zoomControl.plus.h) {
	value += .5;
	//value = Math.min(value, 100);
	WG.OnZoom(wg, value, false);
	wg.mouseMoves = 0;
	return true;
    }
    else if (wg.zoom.controlActive == false &&
	     pt.x > zoomControl.minus.x &&
	     pt.y > zoomControl.minus.y &&
	     pt.x < zoomControl.minus.x + zoomControl.minus.w &&
	     pt.y < zoomControl.minus.y + zoomControl.minus.h) {
	value -= .5;
	//value = Math.max(value, 0);
	WG.OnZoom(wg, value, false);	
	wg.mouseMoves = 0;
	return true;
    }
    else if (pt.x > zoomControl.bar.x &&
	     pt.y > zoomControl.bar.y &&
	     pt.x < zoomControl.bar.x + zoomControl.bar.w &&
	     pt.y < zoomControl.bar.y + zoomControl.bar.h) {
	var dy = (pt.y - zoomControl.bar.y)
	value = 100 - (pt.y - zoomControl.bar.y) * 100 / zoomControl.bar.h;
	value = Math.max(value, 0);
	value = Math.min(value, 100);
	wg.zoom.controlActive = true;
	WG.OnZoom(wg, value, false);		
	wg.mouseMoves = 0;
	return true;
    }

    return false;
};

WG.zoomControl.OnMouseDrag = function(wg, mouse)
{
    var zoomControl = WG.zoomControl;

    var pt = {
	x: mouse.x / wg.scaleDevice,
	y: mouse.y / wg.scaleDevice
    };

    if (pt.x > zoomControl.bar.x &&
	pt.y > zoomControl.bar.y &&
	pt.x < zoomControl.bar.x + zoomControl.bar.w &&
	pt.y < zoomControl.bar.y + zoomControl.bar.h) {
	var value = 100 - (pt.y - zoomControl.bar.y) * 100 / zoomControl.bar.h;
	value = Math.max(value, 0);
	value = Math.min(value, 100);
	wg.zoom.controlValue = value;
	WG.OnZoom(wg, value, false);		
	return true;
    }
    
    return false;
};

// nodetable[ [[xmin,ymin,xmax,ymax], tip, [prim0, prim1...], hasOmics, overlappedNode], ... ] index by nodeId
WG.NodeTableInit = function(wg)
{
    //var t0 = performance.now();
    var xmin, ymin, xmax, ymax;
    var maxId=-1;

    for(var n = 0; n < wg.primitives.length; n++) {
	var id = wg.primitives[n][1];
	if (id > maxId)
	    maxId = id;
    }

    for(var id = 0; id <= maxId; id++) {
	wg.nodeTable[id] = null;
    }

    for(var n = 0; n < wg.primitives.length; n++) {
	var id = wg.primitives[n][1];
	if (id != -1) {
	    var primBox = wg.primBox[n];
	    var node = wg.nodeTable[id];
	    if (node == null) {
		node = [[primBox[0], primBox[1], primBox[2], primBox[3]], //bbox
			null, // tooltip (obsolete. all tips now in nodeDesc)
			[wg.primitives[n]], //primitive list
			0, //has omics data
			0, //overlaps with other nodes
		       ];
		wg.nodeTable[id] = node;
	    } else {
		if (node[0][0] > primBox[0])
		    node[0][0] = primBox[0];
		if (node[0][1] > primBox[1])
		    node[0][1] = primBox[1];
		if (node[0][2] < primBox[2])
		    node[0][2] = primBox[2];
		if (node[0][3] < primBox[3])
		    node[0][3] = primBox[3];
		node[2].push(wg.primitives[n]);
	    }
	}
    }
/*
    var dt = parseInt(performance.now() - t0);
    console.log(wg.nodeTable.length, "nodes initialized in", dt, "ms");

    var nempty=0, none=0, ndups=0;
    for(var n = 0; n < wg.nodeTable.length; n++) {
	if (wg.nodeTable[n]) {
	    if (wg.nodeTable[n][2].length > 1)
		ndups++;
	    else none++;
	} else
	    nempty = 0;
    }
    console.log("empty", nempty, "one", none, "two+", ndups, wg.nodeTable.length);
*/

};

WG.NodeDescInit = function(wg, tips)
{
    var ndups=0, nbad=0, nmissing=0, nunknown=0;;

    // grow node desc table (single table for used at all levels)
    for(let n = wg.nodeDesc.length; n < wg.nodeTable.length; n++) {
	wg.nodeDesc[n] = null;
    }

    for(var t=0; t < tips.length; t++) {
	var id = tips[t][8];
	if (id <= 0 || 
	    id > wg.nodeDesc.length) {
	    console.log("Invalid tip nodeID", id, t, tips[t]);
	    nbad++;
	    continue;
	}
	if (wg.nodeDesc[id] != null) {
	    ndups++;
	    //console.log("duplicate tips", id, t, wg.nodeDesc[id]);
	    continue;
	} 

	wg.nodeDesc[id] = tips[t];
	let tip = tips[t];
	tip[6][0] =
	    "<a href = javascript:window.open('" + generateObjectURL(tip[0], wg.orgId) + "');void(0);>" + tip[6][0] + "</a>";
    }

    var nnodes = 0;
    for(var n = 0; n < wg.nodeDesc.length; n++) {
	if (wg.nodeDesc[n])
	    nnodes++;
	if (wg.nodeTable[n] && wg.nodeDesc[n] == null) {
	    //console.log("no tooltip found for node", n, wg.nodeTable[n]);
	    nmissing++;
	}
    }

    //kr:Jul-29-2022 Post-processing, to collect mappings to the lists of rxns and cpd that are part of a pwy
    WG.PwyToObjIdxsMapInit(wg, 'Reactions');
    WG.PwyToObjIdxsMapInit(wg, 'Compounds');
    //kr:Nov-16-2022 For the DataTable, and the menu of pwy-blocks
    WG.PwyBlockToPwyFrameIdsMapInit(wg);

/*
    console.log("inittips", 
		wg.zoom.level, "level",
		nbad, "errors", 
		nmissing, "missing",
		ndups, "dups", 
		tips.length, "tips",
		nnodes, "nodes",
		wg.nodeDesc.length, "nodeDesc",
                wg.nodeTable.length, "nodetable",
		wg.primitives.length, "prims");
*/

};

///kr:Jul-28-2022 This builds a mapping between a pwyFrameId and its rxnIdxs or cpdIdxs,
/// by traversing all nodeDesc entries.  Should be called after
/// the .json files for the zoomlevels have been loaded into the WG space.
/// This mapping will be used by the DataTable functionality,
/// which will populate a DataTable with all the rxns or cpds contained in a selected pwy.
///
///   objectType : Either 'Reactions' or 'Compounds'
///

WG.PwyToObjIdxsMapInit = function(wg, objectType)
{
    let pwysSlot = 1;
    let typeSlot = 2;
    let objIdxSlot = 8;
    // This Map has a pwy as a key and a list of Object Idxs as a value.
    let PwyToObjIdxsMap ;
    switch(objectType){
    case 'Reactions': PwyToObjIdxsMap = wg.PwyToRxnIdxsMap;  break;
    case 'Compounds': PwyToObjIdxsMap = wg.PwyToCpdIdxsMap;  break;
    default: alert('In WG.PwyToObjIdxsMapInit() , objectType is unsupported, namely: ' + objectType);
    };
    // scanning through all nodeDesc entries, which were loaded from .json files for the zoomlevels
    for(var n = 0; n < wg.nodeDesc.length; n++) {
      let nodeDesc = wg.nodeDesc[n];
      // only look at nodes of the selected objectType
      if ((nodeDesc) && (nodeDesc[typeSlot] == objectType)) {
	let pwys = nodeDesc[pwysSlot]; // The pwy list for the rxn or cpd, if any
	if ( (objectType == 'Reactions') && (pwys == null) )   pwys = ["GRAVEYARD"] ; //kr:Dec-13-2023 The "rxn maze"
	if (pwys) {
	  // accumulate more values of the objectType, for a given pwy key
	  for(var p = 0; p < pwys.length; p++) {
	    let objIdxsOfPwy = PwyToObjIdxsMap.get(pwys[p]);
	    if (objIdxsOfPwy) {
	      // don't add duplicates.  supposedly, this is ES6 syntax:
	      if (objIdxsOfPwy.includes(nodeDesc[objIdxSlot]) === false) objIdxsOfPwy.push(nodeDesc[objIdxSlot]); // add the current objIdx
	    } else {
	      objIdxsOfPwy = [nodeDesc[objIdxSlot]]; // initialize with the current 1 objIdx
	      PwyToObjIdxsMap.set(pwys[p], objIdxsOfPwy); // store in Map
	    }
	  }
	}
      }
    }
    switch(objectType){
    case 'Reactions':
    console.log('kr WG.wgactive.PwyToRxnIdxsMapInit() :  pwy count = ' + WG.wgactive.PwyToRxnIdxsMap.size );
    break;
    case 'Compounds':
    console.log('kr WG.wgactive.PwyToCpdIdxsMapInit() :  pwy count = ' + WG.wgactive.PwyToCpdIdxsMap.size );
    }

};

///kr:Nov-16-2022 This builds a mapping between a pwyBlockName and its pwyFrameIds,
/// by traversing all nodeDesc entries.  This should be called after
/// the .json files for the zoomlevels have been loaded into the WG space.
/// This mapping will be used by the DataTable functionality,
/// which will populate a DataTable with all the rxns or cpds contained in a selected pwyBlock.
///
/// This is a loop that is (somewhat) similar to WG.PwyToObjIdxsMapInit()
///

WG.PwyBlockToPwyFrameIdsMapInit = function(wg)
{
    let pwysSlot = 1;
    let pwyBlockNamesSlot = 10;
    // This Map has a pwyBlockName as a key and a list of pwyFrameIds as a value.
    let PwyBlockToFrameIdsMap = wg.PwyBlockToFrameIdsMap ;
    // scanning through all nodeDesc entries, which were loaded from .json files for the zoomlevels
    for (var n = 0; n < wg.nodeDesc.length; n++) {
      let nodeDesc = wg.nodeDesc[n];
      // only look at nodes that have a pwyBlockName
      if ((nodeDesc) && (nodeDesc[pwyBlockNamesSlot])) {
	let pwys = nodeDesc[pwysSlot]; // The pwy list for the rxn or cpd, if any
	if (pwys) {
	  // accumulate more pwyBlockNames, for a given pwy.
	  //## Is there any problem of duplications, if there are 2 pwys in the list, a "normal" pwy and its super-pwy ???
	  for (var p = 0; p < pwys.length; p++) {
	    var pwy = pwys[p];
	    if (pwy) {
		//kr:Dec-7-2022 Found odd problem, coming from Lisp side, whereby
		// the "extra" info can contain strings with commata, joining more
		// than one pwy frameId !!! Example: "GLUTDEG-PWY,ASPARTATESYN-PWY"
		// As a workaround, try to untangle here:
		let separatedPwysV = pwy.split(',');
		for (let sp = 0; sp < separatedPwysV.length; sp++) {
		    let sPwy = separatedPwysV[sp];
		    let pwyBlockNames = nodeDesc[pwyBlockNamesSlot];
		    for (var b = 0; b < pwyBlockNames.length; b++) {
			let pwyBlockName = pwyBlockNames[b];
			let pwyFrameIds = PwyBlockToFrameIdsMap.get(pwyBlockName);
			if (pwyFrameIds) {
			    // don't add duplicates.  supposedly, this is ES6 syntax:
			    if (pwyFrameIds.includes(sPwy) === false) pwyFrameIds.push(sPwy); // add the current pwy
			} else {
			    pwyFrameIds = [sPwy]; // initialize with the current 1 pwy
			    PwyBlockToFrameIdsMap.set(pwyBlockName, pwyFrameIds); // store in Map
			}
		    }
		}
	    }
	  }
	}
      }
    }
    console.log('kr WG.wgactive.PwyBlockToPwyFrameIdsMapInit() :  pwyBlock count = ' + WG.wgactive.PwyBlockToFrameIdsMap.size );

};

///kr:Aug-26-2022 This builds a mapping between a frameId and its numerical Omics data values (across the columns).
/// Needed for cellOvToDataTable()
WG.FrameIdToOmicsDataMapInit = function(wg)
{
    // This Map has a FrameId (as a string) as a key and an array of numerical Omics data points as a value.
    //  wg.FrameIdToOmicsDataMap = new Map();
    let FrameIdToOmicsDataMap = wg.FrameIdToOmicsDataMap;
    if (WG.wgactive.omics.columnNames) {
	for(let col = 0; col < WG.wgactive.omics.columnNames.length; col++) {
	    let colData = WG.wgactive.omics.data[col];
	    for(let dp = 0; dp < colData.length; dp++) {
	      //let nodeDataV = WG.wgactive.omics.data[col][dp];
	      //let nodeDataV = [9853, 4]; // for testing...
	      let nodeDataV = colData[dp];
	      let nodeIdx   = nodeDataV[0];
	      let nodeDesc = wg.nodeDesc[nodeIdx];
	      let FrameId = nodeDesc[0];
	      let dataPoint = nodeDataV[1];
	      if (FrameIdToOmicsDataMap.get(FrameId) ) {
		var tpArray = FrameIdToOmicsDataMap.get(FrameId);
	      } else {
		var tpArray = [];
		// store back into Map :
		FrameIdToOmicsDataMap.set(FrameId, tpArray);
	      }
	      // store the dataPoint in the correct column of the tpArray
	      tpArray[col] = dataPoint;
	    }
	}
	console.log('kr WG.FrameIdToOmicsDataMapInit() :  frameId count = ' + wg.FrameIdToOmicsDataMap.size );
    }
};


///kr:Aug-11-2022 This builds a mapping between a nodeIdx and its numerical Omics data values over the columns.
/// (However, what really seems to be needed for cellOvToDataTable() is a mapping from a frameID !  See above.)

WG.NodeIdxToOmicsDataMapInit = function(wg)
{
    // This Map has a nodeIdx (as a string) as a key and an array of numerical Omics data points as a value.
    //  wg.NodeIdxToOmicsDataMap = new Map();
    let NodeIdxToOmicsDataMap = wg.NodeIdxToOmicsDataMap;
    if (WG.wgactive.omics.columnNames) {
      for(let col = 0; col < WG.wgactive.omics.columnNames.length; col++) {
	let colData = WG.wgactive.omics.data[col];
	for(let dp = 0; dp < colData.length; dp++) {
	  let nodeDataV = WG.wgactive.omics.data[col][dp];
	  //let nodeDataV = [9853, 4]; // for testing...
	  let nodeIdx   = nodeDataV[0];
	  let dataPoint = nodeDataV[1];
	  if (NodeIdxToOmicsDataMap.get(nodeIdx) ) {
	    var tpArray = NodeIdxToOmicsDataMap.get(nodeIdx);
	  } else {
	    var tpArray = [];
	  }
	  tpArray[col] = dataPoint; // store the dataPoint in the correct column of the tpArray
	  //NodeIdxToOmicsDataMap.set(nodeIdx, tpArray); // store back into Map
	}
      }
    }
};

WG.OmicsFlagNodes = function(wg)
{
    for(let n = 0; n < wg.nodeTable.length; n++) {
	if (wg.nodeTable[n]) {
	    wg.nodeTable[n][3] = 0;
	}
    }

    if (wg.omics.data == undefined || 
	wg.omics.data.length <= 0 ||
	wg.omics.column < 0)
	return;

    var pathwayTable = [];
    let tok="NEW-IMAGE?type=PATHWAY&object=";

    let data = wg.omics.data[wg.omics.column];
    for(let r = 0; r < data.length; r++) {
	let id = data[r][0];
	if (wg.nodeTable[id]) {
	    wg.nodeTable[id][3] = 1;

	    // parse out pathway name
	    let tip = wg.nodeDesc[id]; 
	    if (tip && tip[6][2]) {
		let n1 = tip[6][2].indexOf(tok);
		if (n1 == -1)
		    continue;
		n1 += tok.length;
		let n2 = tip[6][2].indexOf("'", n1);
		if (n2 == -1 || n2 <= n1)
		    continue;
		let pathway = tip[6][2].substring(n1, n2);
		if (pathwayTable[pathway] == undefined) {
		    pathwayTable[pathway] = 1;
		}
	    }
	}
    }

    for(let id = 0; id < wg.nodeTable.length; id++) {
	if (wg.nodeTable[id] && wg.nodeTable[id][3] == 0) {
	    let tip = wg.nodeDesc[id];
	    if (tip && tip[6][2]) {
		let n1 = tip[6][2].indexOf(tok);
		if (n1 == -1)
		    continue;
		n1 += tok.length;
		let n2 = tip[6][2].indexOf("'", n1);
		if (n2 == -1 || n2 <= n1)
		    continue;
		let pathway = tip[6][2].substring(n1, n2);
		if (pathwayTable[pathway]) {
		    wg.nodeTable[id][3] = 2;
		}
	    }
	}
    }
};

/* RAB doc - This is the WG.tooltip section - there are 10 functions
*/
WG.tooltip.OnMouseMoveCelOv = function(wg, px)
{
    // ignore if inside zoom control
    let box = WG.zoomControl.bbox;
    if (px.x/wg.scaleDevice < box.x + box.w &&
	px.y/wg.scaleDevice < box.y + box.h) {
	return;
    }

    wg.ctx.save();
    wg.ctx.setTransform(1,0,0,1,0,0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);
    let pt = wg.ctx.transformedPoint(px.x, px.y);
    pt.x = pt.x / wg.scale + wg.x0;
    pt.y = pt.y / wg.scale + wg.y0;
    wg.ctx.restore();
    //console.log(pt, wg.x0, wg.y0, wg.scale, wg.scaleDevice, wg.boundingBox.left, wg.boundingBox.top);

    var popup = this.popups[0];
    if (popup && popup.visible == true && popup.keep == false) {
	let nodeBox = wg.nodeTable[popup.nodeId][0];
	// inside current popup node?
	if (pt.x >= nodeBox[0] &&
	    pt.y >= nodeBox[1] &&
	    pt.x <= nodeBox[2] &&
	    pt.y <= nodeBox[3]) {
	    if (popup.timer) {
		clearTimeout(popup.timer);
		popup.timer = 0;
	    }
	    return;
	}

	// between node & tooltip?
	if (pt.y >= nodeBox[1]-10/wg.scale &&
	    pt.y <= nodeBox[3]+10/wg.scale &&
	    (popup.onleft ? 
	     (pt.x <= nodeBox[2]+1 && pt.x > popup.tiePt.x) :
	     (pt.x >= nodeBox[0]-1 && pt.x < popup.tiePt.x))) {
	    if (popup.timer) {
		clearTimeout(popup.timer);
		popup.timer = 0;
	    }
	    return;
	}
	if (popup.timer) {
	    return;
	}
	    
	// delay dismiss current tooltip
	popup.timer = setTimeout(function() {
	    popup.hide();
	    popup.visible = false;
	    WG.Draw(wg);
	}, 500);

	popup.element.onmouseover = function() {
	    if (popup.timer) {
		clearTimeout(popup.timer);
		popup.timer = 0;
	    }
	};
    }

    let id = this.NearestNode(wg, pt);
    if (id == wg.focusId) {
	return;
    }

    if (wg.focusId != -1) {
	WG.DrawFocus(wg, wg.focusId, 0)
	wg.focusId = -1;
    }

    if (id == -1 || wg.nodeTable[id] == null || wg.nodeDesc[id] == null)
	return;

    WG.DrawFocus(wg, id, 1);
    wg.focusId = id;

    if (this.delayTimer != -1)
	clearTimeout(this.delayTimer);
    this.delayTimer = setTimeout(function() { WG.tooltip.Activate(wg); }, 50);

    return;
};

WG.tooltip.NearestNode = function(wg, pt)
{
    var minprim = -1;
    var dist, mindist=999;

    for(var n = 0; n < wg.primBox.length; n++) {
	var box = wg.primBox[n];
	if (pt.x+1 > box[0] &&
	    pt.y+1 > box[1] &&
	    pt.x-1 < box[2] &&
	    pt.y-1 < box[3]) {

	    var nodeId = wg.primitives[n][1];

	    if (nodeId == -1)
		continue;

	    if (wg.nodeDesc[nodeId] == null)
		continue;

	    dist = (pt.x+3) - box[0];
	    if (dist > 0 && dist < mindist) {
		mindist = dist;
		minprim = n;
	    }
	    dist = (pt.y+3) - box[1];
	    if (dist > 0 && dist < mindist) {
		mindist = dist;
		minprim = n;
	    }
	    dist = box[2] - (pt.x-3);
	    if (dist > 0 && dist < mindist) {
		mindist = dist;
		minprim = n;
	    }
	    dist = box[3] - (pt.y-3);
	    if (dist > 0 && dist < mindist) {
		mindist = dist;
		minprim = n;
	    }
	}
    }

    if (minprim == -1)
	return -1;
    
    return wg.primitives[minprim][1];
};

// overlay is a tooltip link. fix this!

WG.overlay.show = function() 
{
    var popup = WG.overlay.popup;
    if (!popup)
	return;
    popup.show();
};

WG.overlay.hide = function() 
{
    var popup = WG.overlay.popup;
    if (!popup)
	return;
    popup.hide();
};

WG.overlay.move = function(x,y) 
{
    var popup = WG.overlay.popup;
    if (!popup)
	return;
    popup.moveTo(x, y);
};

WG.overlay.set = function(el, value)
{
    var popup = WG.overlay.popup;
    if (!popup)
	WG.overlay.popup = WG.overlay.create();
    popup = WG.overlay.popup;

    popup.setBody(value);
};

WG.overlay.create = function()
{
    var popup = new YAHOO.widget.SimpleDialog("popup" + this.popupCount++,
					      {
						  visible: false,
						  zindex: 99,
						  close: false
					      } );
    popup.visible = false;
    popup.nodeId = -1;
    popup.setBody("");
    popup.body.style.maxWidth = '400px';
/*
    popup.subscribe("destroy", function()
		    {
			console.log("destroy")
		    });
    popup.subscribe("hide", function()
		    {
			console.log("hide")
		    });
    popup.subscribe("drag", function (type, args)
		    {
			console.log("drag", type, args[0], WG.tooltip.dragState, popup.visible);
		    });
    popup.subscribe("move", function (type, args)
		    {
			console.log("move", type, args);
		    });

    popup.subscribe("enter", function (type, args)
		    {
			console.log("Enter", type, args[0][0], args[0][1]);
		    });
    popup.subscribe("leave", function (type, args)
		    {
			console.log("leave", type, args[0][0], args[0][1]);
		    });
*/
    popup.render(document.body);

    popup.header.style.display = 'none';

    return popup;
};

WG.tooltip.OnMouseMoveLinks = function(wg, px, evt)
{
    // ignore if no links
    if (!wg.links || wg.links.length <= 0 || !wg.primIdMap) {
	return;
    }
    
    // ignore if inside zoom control
    if (wg.enableZoom) {
	var zoomBox = WG.zoomControl.bbox;
	if (px.x/wg.scaleDevice < zoomBox.x + zoomBox.w &&
	    px.y/wg.scaleDevice < zoomBox.y + zoomBox.h) {
	    return;
	}
    }
    
    // ingore if on edge of canvas
    if (px.x < 1 ||
	px.y < 1 ||
	px.x >= wg.primIdMap.width - 1 ||
	px.y >= wg.primIdMap.height - 1) {
	return;
    }

    // draw primIDmap
    if (wg.primIdFlags == "redraw")
	WG.DrawPrimIds(wg);

    var ctx = wg.primIdMap.getContext("2d");
    var imageData = ctx.getImageData(px.x, px.y, 1, 1);

    var primId =
	imageData.data[0] << 16 |
	imageData.data[1] << 8 |
	imageData.data[2];

    if (primId == 0) 
	return UnfocusLink(wg);
    primId -= 1;
    
    var linkId;
    if (primId >= wg.primitives.length) {
	linkId = primId - wg.primitives.length;
    } else {
	linkId = wg.primitives[primId][1];
    }
    var link = wg.links.find(l => l[0] == linkId);
    if (!link) {
	return UnfocusLink(wg);
    }

    //convert to diagram coordinates to double check bbox
    wg.ctx.save();
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);
    var pt = wg.ctx.transformedPoint(px.x, px.y);
    wg.ctx.restore();

    var x1 = (link[2] - wg.x0) * wg.scale;
    var y1 = (link[3] - wg.y0) * wg.scale;
    var x2 = (link[4] - wg.x0) * wg.scale;
    var y2 = (link[5] - wg.y0) * wg.scale;
    if (pt.x+2 < x1 ||
	pt.y+2 < y1 ||
	pt.x-2 > x2 ||
	pt.y-2 > y2) {
	//console.log("bad",linkId, pt.x, x1, x2);
	return;
    }
    
    var id = link[0];
    var url = link[1];
    var tip = link[6];
    if (wg.activeLink != link) {
	wg.activeLink = link;
	WG.overlay.set("bodyContent", tip);
	wg.ttHasHRef = tip.indexOf("<a href=") == -1 ? 0 : 1;
	/*
	if (wg.ttHasHRef)
	    WG.overlay.move(evt.pageX, evt.pageY);
	*/
	if (tip != "")
	    WG.overlay.show();
	WG.DrawLink(wg, link, true);
    }
    if (tip) //wg.ttHasHRef == 0)
	WG.overlay.move(evt.pageX+10, evt.pageY+10);

    if (url != "javascript:void(0);") {
	wg.canvas.style.cursor = 'pointer';
    } else {
	wg.canvas.style.cursor = 'default';
    }

    function UnfocusLink(wg)
    {
	if (wg.activeLink) {
	    WG.overlay.hide();
	    WG.DrawLink(wg, wg.activeLink, false);
	    wg.canvas.style.cursor = 'default';
	    wg.activeLink = null;
	}
	return;
    }
}; 

WG.tooltip.Activate = function(wg)
{
//    console.log("ToolTipDelayed", "f", wg.focusId, "timer", this.delayTimer);
    WG.tooltip.delayTimer = -1;

    var focusId = wg.focusId;
    if (focusId < 0 || !wg.nodeTable[focusId])
	return;

    var tip = wg.nodeDesc[focusId];
    if (tip == null)
	return;

    if (WG.tooltip.dialogs == [])
	return;

    var dx=0, dy=0;
    if (wg.enableZoom) {
//    	dx = wg.border.x;// * wg.scaleDevice;
//	dy = wg.border.y;// * wg.scaleDevice;
//	console.log("dx", dx,dy);
    }

    for(var p = 0; p < WG.tooltip.popups.length; p++) {
	var popup = WG.tooltip.popups[p];
	if (popup.visible && popup.keep && popup.tip == tip) {
	    return;
	}
    }

    var popup = WG.tooltip.popups[0];
    if (!popup || popup.keep == true)
	popup = WG.tooltip.Create();

    popup.visible = false;
    popup.hide();
    popup.nodeId = focusId;
    popup.wg = wg;
    WG.tooltip.UpdateContent(popup, tip);

    var nodeBox = wg.nodeTable[focusId][0];

    var nodePt = {
	x: (nodeBox[0] + nodeBox[2])/2 + dx,
	y: (nodeBox[1] + nodeBox[3])/2 + dy
    };

    nodePt.x = nodeBox[2] + dx;
    nodePt.xL = nodeBox[0] - dx;

    var tipOffset = {
	x: (nodeBox[2]-nodeBox[0])/2 + 15,
	y: -25
    };
	
    var canvasRect = wg.canvas.getBoundingClientRect();
    var tipPx = {
	x: (nodePt.x - wg.x0) * wg.scaleCanvas,
	xL: (nodePt.xL - wg.x0) * wg.scaleCanvas,
	y: (nodePt.y - wg.y0) * wg.scaleCanvas,
    };
    tipPx.x += wg.border.x * wg.scaleDevice;
    tipPx.xL += wg.border.x * wg.scaleDevice;
    tipPx.y += wg.border.y * wg.scaleDevice;
	
    //console.log(nodePt, tipOffset, tipPx);
    tipPx.x += canvasRect.left + window.scrollX + tipOffset.x;
    tipPx.xL += canvasRect.left + window.scrollX + tipOffset.x;
    tipPx.y += canvasRect.top + window.scrollY + tipOffset.y;

    tipPx.x += wg.border.x;// * wg.scaleDevice;
    tipPx.xL += wg.border.x;// * wg.scaleDevice;
    tipPx.y += wg.border.y;// * wg.scaleDevice;

    var popupWidth = popup.element.clientWidth;
    //console.log("width", popupWidth, popup.element);
    if (tipPx.x + popupWidth > wg.canvas.clientWidth) {
	tipPx.x -= popupWidth + (nodeBox[2]-nodeBox[0]+10) * wg.scaleCanvas + 80;
	tipOffset.x = popupWidth + 80;
	popup.onleft = 1;
    } else {
	popup.onleft = 0;
	tipPx.x -= 35*(wg.scaleDevice-1); //fix this!
    }
    tipPx.y -= 5*wg.scaleDevice; //fix this!

    wg.popup = popup;
    popup.tip = tip;
    popup.tipType = tip[2];
    popup.btnState = "";
    popup.omicsTimestamp = 0;
    popup.tipOffset = tipOffset;
    popup.tipPx = tipPx;
    popup.moveTo(tipPx.x, tipPx.y);
    
    // weird brower error? popup width can change multiple times after a moveTo()???
    for(let err = 0; err < 5; err++) {
	let xoff = popupWidth - popup.element.clientWidth;
	if (xoff == 0)
	    break;
	console.log("width error", err, xoff, popupWidth, popup.element.clientWidth);
	popupWidth = popup.element.clientWidth;
	popup.moveTo(tipPx.x+xoff, tipPx.y);
	tipOffset.x += xoff;
    }
    popup.visible = true;
    popup.show();
    WG.tooltip.DrawConnections(wg);

    return;
};

WG.tooltip.Update = function()
{
    for(var p = 0; p < WG.tooltip.popups.length; p++) {
	var popup = WG.tooltip.popups[p];
    }
};

WG.tooltip.DrawConnections = function(wg)
{
    wg.ctx.strokeStyle = '#000000';
    wg.ctx.lineWidth = 2;
    var s = wg.scale;

    for(var p = 0; p < WG.tooltip.popups.length; p++) {
	var popup = WG.tooltip.popups[p];
	if (popup.visible == true) {
	    var nodeBox = wg.nodeTable[popup.nodeId][0];
	    var tip = wg.nodeDesc[popup.nodeId];
	    if (nodeBox && tip) {
		let x = nodeBox[0],
		    y = nodeBox[1],
		    l = nodeBox[2] - nodeBox[0],
		    h = nodeBox[3] - nodeBox[1];

		let nodePt = {
		    x: x + l/2,
		    y: y + h/2
		};
		nodePt.x += (popup.onleft) ? -l/2 : l/2;
		
		let nodePx = {
		    x: (nodePt.x - wg.x0) * wg.scaleCanvas,
		    y: (nodePt.y - wg.y0) * wg.scaleCanvas
		};

		var canvasRect = wg.canvas.getBoundingClientRect();
		var tipPx = {
		    x: popup.tipPx.x - (canvasRect.left + window.scrollX),
		    y: popup.tipPx.y - (canvasRect.top + window.scrollY)
		};
		tipPx.x -= wg.border.x;// * wg.scaleDevice;
		tipPx.y -= wg.border.y;// * wg.scaleDevice;
		
		var dx = tipPx.x - (nodePx.x + popup.tipOffset.x);
		var dy = tipPx.y - (nodePx.y + popup.tipOffset.y);

		if (popup.keep &&
		    (Math.abs(dx) > .1 ||
		     Math.abs(dy) > .1)) {
		    console.log("moving popup", dx, dy);
		    popup.visible = false;
		    popup.moveTo(popup.tipPx.x - dx, popup.tipPx.y - dy);
		    popup.visible = true;
		    tipPx.x = popup.tipPx.x - (canvasRect.left + window.scrollX);
		    tipPx.y = popup.tipPx.y - (canvasRect.top + window.scrollY);
		}

		let tiePt = {
		    x: tipPx.x / wg.scaleCanvas + wg.x0,
	    	    y: (tipPx.y+25) / wg.scaleCanvas + wg.y0
		};
		if (popup.onleft) {
		    let popupWidth = popup.element.clientWidth;
		    tiePt.x = (tipPx.x + popupWidth) / wg.scaleCanvas + wg.x0;
		}
		
		popup.nodePt = nodePt;
		popup.tiePt = tiePt;
		
		wg.ctx.save();
		wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
		wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);
    		
		wg.ctx.lineWidth = 1;
		wg.ctx.beginPath();
 		wg.ctx.rect((x-wg.x0)*s-2, (y-wg.y0)*s-2, l*s+4, h*s+4);
		if (popup.onleft) {
		    wg.ctx.moveTo((nodePt.x-wg.x0)*s-2, (nodePt.y-wg.y0)*s);
		} else {
		    wg.ctx.moveTo((nodePt.x-wg.x0)*s+2, (nodePt.y-wg.y0)*s);
		}
		wg.ctx.lineTo((tiePt.x-wg.x0)*s, (tiePt.y-wg.y0)*s);
 		wg.ctx.stroke();
		wg.ctx.restore();
	    }
	}
    }
};

WG.tooltip.BtnHandler = function(btn, popup)
{
    var header = popup.header.childNodes[0];

    switch(btn.value) {
    case "Keep":
	header.btnKeep.style.display = 'none';
	if (popup.tipType == "Reactions") {
	    //header.btnT.value = popup.tip[2][0];
	    header.btnT.style.display = null;
	    header.btnE.style.display = null;
	    header.btnP.style.display = null;
	    popup.btnState = "";
	} else {
	    let desc = popup.tip[6];
	    if (desc[1] || desc[2] ||desc[3]) {
		//header.btnT.value = popup.tip[2][0];
		header.btnT.style.display = null;
	    }
	    if (desc[2] && desc[2].indexOf("In pathway:") > -1)  {
		header.btnP.style.display = null;
	    }
	    popup.btnState = "";		
	}
	popup.keep = true;
	break;
    case "T":
	popup.btnState = (popup.btnState == "T") ? "" : "T";
	break;
    case "E":
	popup.btnState = (popup.btnState == "E") ? "" : "E";
	break;
    case "P":
	popup.btnState = (popup.btnState == "P") ? "" : "P";
	break;
    case "Omics":
	header.btnKeep.style.display = 'none';
	header.btnOmics.style.display = 'none';
	header.btnT.style.display = 'none';
	header.btnE.style.display = 'none';
	header.btnP.style.display = 'none';
	header.btnSummary.style.display = null;
	popup.keep = true;
	popup.btnState = 'omics';
	popup.omicsTimestamp = performance.now();
	OmicsTooltipHandler(popup.tip, popup);

	return;

	//kr:Sep-6-2022 
    case "DataTable":
        let desc = popup.tip[6];
	// Introducing a new state is NOT a good idea.  It messes up the state logic...
        //popup.btnState = 'DataTable';
        ///console.log("btnHandler: kr DataTable  ", popup.value);
        //console.log("btnHandler: kr desc :  ", desc);
        ///console.log("btnHandler: kr popup.tip : ");
	///console.dir(popup.tip);
	//console.log("btnHandler: kr popup : ");
	//console.dir(popup);
        //console.log("btnHandler: kr popup.tipType : " + popup.tipType);
	//kr:Jul-22-2022 If the popup is for a rxn, then the pwy(s) could be used as the 'category' in the DT
	//let rawobjectType = popup.tip[2];
	let subPwy   = (popup.tip[1]) ? popup.tip[1][0] : null;
	let superPwy = (popup.tip[1]) ? popup.tip[1][1] : null; // This should be the pwy that is actually shown on the CellOv.
	                                                          // But for Compounds, can be null .
	let mainPwy = (superPwy) ? superPwy : subPwy ;   // Let the 2nd pwy be the name of the table, if non-null .
	let rawData = [];
	let objIdxsOfPwy = null;
	let dataTableName = 'some table name';
	//                           the pwy list  frameID       EC# or Name   Reaction Equation
	//rawData[rawData.length] = [popup.tip[1], popup.tip[0], popup.tip[4], popup.tip[3] ] ;
	if (popup.tipType == "Reactions") {
	  if (subPwy == null)  subPwy = "GRAVEYARD" ; // Used while building PwyToRxnIdxsMap
	  objIdxsOfPwy = WG.wgactive.PwyToRxnIdxsMap.get(subPwy);
	  //console.log('subPwy: ' + subPwy + ' retrieved objIdxsOfPwy: ' + objIdxsOfPwy)
	  switch(subPwy){
	    //kr:Dec-13-2023 A separate name for all the rxns in the membrane, which are transport rxns.
	    case 'TRANSPORTER': dataTableName = 'Transport Reactions' ;  break;
	    //kr:Dec-13-2023 A separate name for all the rxns in the "rxn maze".
	    case 'GRAVEYARD'  : dataTableName = 'Reactions not in Pathways' ;  break;
	    default: dataTableName = 'Reactions of ' + mainPwy ;
	  };
	  //console.log('WG.wgactive.PwyToRxnIdxsMap.get(pwy) : ' + objIdxsOfPwy);
	} else {
	  if (popup.tipType == "Compounds") {
	    objIdxsOfPwy = WG.wgactive.PwyToCpdIdxsMap.get(subPwy);
	    dataTableName = 'Compounds of ' + mainPwy;
	    //console.log('WG.wgactive.PwyToCpdIdxsMap.get(pwy) : ' + objIdxsOfPwy);
	  }
	}
	if (objIdxsOfPwy) {
	  let rxnIdsAlreadyUsed = [];
	  // Add all the datatable rows:  (except rxn duplicates)
	  for (var i=0; i < objIdxsOfPwy.length; i++) {
	    let skipP = false;
	    let nodeDesc = WG.wgactive.nodeDesc[objIdxsOfPwy[i] ];
	    //kr:Sep-6-2022 This is the new EC# field:                        EC#
	    //let ecOrName = ((popup.tipType == "Reactions") && !nodeDesc[4]) ? nodeDesc[9] : nodeDesc[4] ;
	    let ecOrName = null;
	    if (popup.tipType == "Reactions") {
		//kr:Jan-3-2024 Don't add a rxn duplicate.  This is usually correct,
		// except when there are different genes, which have differing Omics datapoints...
		// But that case is now handled separately, in cellOvToDataTable( )
		if (rxnIdsAlreadyUsed.includes(nodeDesc[0]) === true) {
		    skipP = true;
		} else {
		    rxnIdsAlreadyUsed[rxnIdsAlreadyUsed.length] = nodeDesc[0]; // frameID
		}
	      //                          EC#           common-name string
	      ecOrName = (!nodeDesc[4]) ? nodeDesc[9] : nodeDesc[4] ;
	    } else {
	      // Compounds: the short name (abbrev.)
	      ecOrName = nodeDesc[3];
	    }
	    if (skipP == false) {
		//                                                       Reaction Equation common-name string
		let rxnEqOrCommonName = (popup.tipType == "Reactions") ? nodeDesc[3] :     nodeDesc[4] ;
		//                         frameID      EC# or Name  Reaction Equation
		rawData[rawData.length] = [nodeDesc[0], ecOrName,    rxnEqOrCommonName ] ;
	    }
	  }
	  //                           frameID       EC# or Name   Reaction Equation
	  //rawData[rawData.length] = [popup.tip[0], popup.tip[4], popup.tip[3] ] ;
	} else { // which objects could these still be ???  does this ever happen ?
	  //                         frameID        
	  rawData[rawData.length] = [popup.tip[0], popup.tip[4], popup.tip[3] ] ;
	}
	invokeCellOvDataTableQtip(dataTableName,
				  popup.tipType, // either "Reactions" or "Compounds"
				  rawData,
				  popup.body, // elt is the parent DOM element, to which the qtip should be attached.
				  null, // categoryHeaderStr
				  true); // objectNameColP
	break;

    case "Summary":
	popup.cfg.setProperty("width", "500px");
	popup.body.style.cssText = "";
	header.btnOmics.style.display = null;
	header.btnSummary.style.display = 'none';
	popup.omicsTimestamp = 0;

	if (popup.tipType == "Reactions") {
	    //header.btnT.value = popup.tip[2][0];
	    header.btnT.style.display = null;
	    header.btnE.style.display = null;
	    header.btnP.style.display = null;
	    popup.btnState = "";
	} else {
	    let desc = popup.tip[6];
	    if (desc[1] || desc[2] ||desc[3]) {
		//header.btnT.value = popup.tip[2][0];
		header.btnT.style.display = null;
	    }
	    if (desc[2] && desc[2].indexOf("In pathway:") > -1)  {
		header.btnP.style.display = null;
	    }
	    popup.btnState = "";		
	}
	break;

    default:
        console.log("btnHandler: unknown btnState", popup.value);
	break;
    }
    WG.tooltip.UpdateContent(popup, popup.tip);
};

WG.regOvP = function()
{
    // initRegOverview.orgid bound if this is a regOv, not a celOv
    return (WG.wgactive && globalThis.initRegOverview && initRegOverview.orgid) ? true : false;
};

WG.tooltip.UpdateContent = function(popup, tip)
{
    var title = popup.header.childNodes[0].childNodes[0];

    popup.element.style.maxWidth = Math.max(500, popup.element.clientWidth+40) + "px";

    switch(tip[2]) {
    case "Reactions":
	title.innerHTML = "Reaction ";
	break;
    case "Compounds":
	title.innerHTML = tip[4] + " ";
	break;
    case "All-Genes":
	title.innerHTML = "Gene Information ";
	break;
    default:
	title.innerHTML = tip[2] + " ";
    }

    var header = popup.header.childNodes[0];
    header.btnOmics.style.display = 'none';
    let wg = popup.wg;
    let nodeId = popup.nodeId;
    let hasOmics = 
	(wg && nodeId != -1 && wg.nodeTable[nodeId]) ? wg.nodeTable[nodeId][3] : 0;
    if (hasOmics == 1 && popup.omicsTimestamp == 0) {
	header.btnOmics.style.display = null;
    }

    //kr:Dec-13-2023 Suppress the DataTable button, if there are no Omics data,
    // or if the data type of the tooltip is not matching with the type of available Omics data.
    let matchingTipTypeP = ( ((tip[2]                       == 'Compounds') &&
			      (WG.wgactive.omics.objectType == 'metabolite')) ||
			     // Other objects effectively are Reactions:
			     ((tip[2]                       != 'Compounds') &&
			      (WG.wgactive.omics.objectType != 'metabolite'))
			   )
    //console.log('hasOmics: ' + hasOmics + '  matchingTipTypeP: ' + matchingTipTypeP)
    header.btnDataTable.style.display =  (hasOmics && matchingTipTypeP) ? null : 'none';

    // tooltip desc. (copy each since we might modify pathway desc[2] below)
    /* REG-NET-WG */
    var desc = [];
    for(var i=0; i<tip[6].length; i++)  {
	desc[i]=tip[6][i];
    }
    // modify pathway url if node has omics data
    if (!WG.regOvP() && (hasOmics && desc[2])) {
	let n = desc[2].indexOf("/pathway?");
	if (n > 0) {
	    let desc2 = 
		desc[2].substring(0, n+9) + 
		"prevOmics=Y&detail-level=2&" + 
		desc[2].substring(n+9);
	    //console.log(desc[2]);
	    //console.log(desc2);
	    desc[2] = desc2;
	}
    }

    var body ="";
    if (!WG.regOvP()) {
	switch (popup.btnState) {
	case "T":
	    if (desc[0])
		body += desc[0] + "<br>";
	    break;
	case "E":
	    if (desc[1])
		body += desc[1] + "<br>";
	    break;
	case "P":
	    if (desc[2])
		body += desc[2] + "<br>";
	    break;
	case "":
	    for(var j=0; j<desc.length; j++) {
		if (desc[j])
		    body += desc[j] + "<br>";
	    }
	    break;
	default:
	    console.log("PopupUpdateContent: invalid btnState", popup.btnState);
	    btnState = "";
	}
    } else {
	for(var j=0; j<desc.length; j++) {
	    if (desc[j])
		body += desc[j] + "<br>";
	};
    };

    // If it is a compound added button to highlight all compounds of the same occurrences in tooltip
    if (tip[2] === "Compounds") {
	const tmpbody = body;
	var loc = tmpbody.toString().lastIndexOf("<b>ID:</b> ");
	
	if (loc != -1) {
	    var idStr = tmpbody.toString().slice(loc).split("<br>");
	    var ID = idStr[0].split(" ")[1];
	    var start = tmpbody.split(`<b>ID:</b> ${ID}<br>`)[0];
	    var end = tmpbody.split(`<b>ID:</b> ${ID}<br>`)[1];
	    body = `${start}<b>ID:</b> ${ID}<br><a href='` + `javascript:searchCelNameOrFrameID("` + ID +
		`", "compounds",` + `function (nodes) { celHighlight(` + `"Compound ` + ID + `"` + `, nodes,"` +
		ID + `", "cnids"); }` + `);'>[Highlight All Occurrences]</a><br>${end}`;
	}
    }
    
    /* REG-NET-WG */
    // adjust max width of tooltip to 500px or length of title
    // Unfortunately, it doesn't quite work. Some funky stuff happens on the right when
    // going from small protein popup to large reaction or title name
    //popup.element.style.maxWidth = Math.max(500, popup.element.clientWidth+40) + "px";
    popup.setBody(body);
    //console.log("width", popup.element.style.maxWidth, popup.element.clientWidth);
};

WG.tooltip.Create = function()
{
    // Instantiate the Dialog
    var popup = new YAHOO.widget.SimpleDialog("popup" + WG.tooltip.popupCount++,
					      {
						  //width: "500px",
						  visible: false,
						  draggable: true,
						  close: true
					      } );
    
    popup.element.style.maxWidth = "500px";
    
    var header     = document.createElement('span');
    header.innerHTML = "<span></span>";

    header.btnKeep = createHeaderButton("Keep");
    header.btnKeep.onclick = function() { WG.tooltip.BtnHandler(this, popup); }
    header.appendChild(header.btnKeep);
    
    header.btnT = createHeaderButton("T");
    header.btnT.onclick = function() { WG.tooltip.BtnHandler(this, popup); }
    header.btnT.style.display = 'none';
    header.appendChild(header.btnT);
    
    header.btnE = createHeaderButton("E");
    header.btnE.onclick = function() { WG.tooltip.BtnHandler(this, popup); }
    header.btnE.style.display = 'none';
    header.appendChild(header.btnE);
    
    header.btnP = createHeaderButton("P");
    header.btnP.onclick = function() { WG.tooltip.BtnHandler(this, popup); }
    header.btnP.style.display = 'none';
    header.appendChild(header.btnP);

    header.btnOmics = createHeaderButton("Omics");
    header.btnOmics.onclick = function() {
	WG.tooltip.BtnHandler(this, popup);
    }
    header.btnOmics.style.display = 'none';
    header.appendChild(header.btnOmics);
    
    header.btnSummary = createHeaderButton("Summary");
    header.btnSummary.onclick = function() { WG.tooltip.BtnHandler(this, popup); }
    header.btnSummary.style.display = 'none';
    header.appendChild(header.btnSummary);

    header.btnDataTable = createHeaderButton("DataTable");
    header.btnDataTable.onclick = function() { WG.tooltip.BtnHandler(this, popup); }
    // Only show button, when Omics data exists:
    header.btnDataTable.style.display = (WG.wgactive.omics.columnNames) ? null : 'none';
    header.appendChild(header.btnDataTable);

    // leave room for hide [X] button. can't get style.minWidth to work??
    header.spacer = document.createElement('span');
    header.spacer.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
    header.appendChild(header.spacer);

    popup.btnState = "";
    popup.keep = false;
    popup.omicsTimestamp = 0;
    popup.visible = false;
    popup.nodeId = -1;
    popup.setHeader(header);
    popup.setBody("");

    popup.subscribe("destroy", function()
		    {
			//console.log("destroy")
		    });

    popup.subscribe("hide", function()
		    {
			//console.log("hide")
			popup.visible = false;
			WG.Draw(popup.wg);			
		    });

    popup.subscribe("drag", function (type, args)
		    {
			//if  (args[0] != WG.tooltip.dragState) console.log(type, args, WG.tooltip.dragState);
			
			switch(args[0]) {
			case 'onDrag':
			    /*
			    //missed "startDrag"
			    if (WG.tooltip.dragState == 'endDrag') {
				console.log("error popup drag");
				if (popup.wg && popup.visible == true) {
				    popup.visible = false;
				    WG.Draw(popup.wg);
				    popup.visible = true;				
				}
			    }
			    */
			    break;
			case "startDrag":
			    if (popup.wg && popup.visible == true) {
				popup.visible = false;
				WG.Draw(popup.wg);
				popup.visible = true;				
			    }
			    break;
			case "endDrag":			    
			    break;
			}
			WG.tooltip.dragState = args[0];
		    });

    popup.subscribe("move", function (type, args)
		    {
			//console.log(type, args);			
			if (args[0][0] && args[0][1]) {
			    if (popup.visible && popup.tipOffset && popup.tipPx) {
				popup.tipOffset.x += args[0][0] - popup.tipPx.x;
				popup.tipOffset.y += args[0][1] - popup.tipPx.y;
			    }
			    popup.tipPx.x = args[0][0];
			    popup.tipPx.y = args[0][1];
			    if (popup.wg && popup.visible == true)
				WG.tooltip.DrawConnections(popup.wg);
			}
		    });

    popup.render(document.body);
    WG.tooltip.popups.unshift(popup);

    return popup;
};

function createHeaderButton(value)
{
    var temp = document.createElement('input');
    temp.type = 'button';
    temp.value = value;
    temp.href = '#';
    temp.style.height = "20px";
    temp.style.paddingTop = "0px";
    temp.style.paddingRight = "0px";
    temp.style.paddingBottom = (YAHOO.env.ua.gecko > 0) ? "16px" : "0px";
    temp.style.paddingLeft = "0px";
    return(temp);
}

WG.InitIcons = function()
{
    WG.icon = {};

    WG.icon.marker = new Image(21, 25);
    WG.icon.marker.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAZCAYAAADe1WXtAAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAHrSURBVEjHrdW9a1NxFMbxT9qmNWmaRqlFhE6CLuIL1DcUHDqJm/0HBEUk3RQXpW7dXdysWlAEHQSlo4IoIoggFCko4lJEEaq296aNtvk5JIG2NGmSOjzbuV9+9zzPOUcIwUbCvg7uYGtD9RsVdDCSJh7iT5ofONEyFLkeJvcw/5EQCE8JvRTSjKG9KSiOdvMtz0KxAqzqK+E4cZZ3GNgQikQXV7PET9bAVmqZMMbfNPM4UxOK/iwvB5mfqQNcqTeEHcQ93EVqFRRDaWZHKS41CKzqN2GYQoYv2BtCoJNrvRRe1PnwPeFGpZ+1am5TSrGQ5CJc2E1UqlH8nJCuKFN5WS3wIIUko5DIMjVOab3CEUIbASFLeFwD+Kgct09or/b0cI54rsWXRoQ+Yhxb5X4PDy9TbKWnlyj28mC9SO1MEX9u0v0P5b+YQ9+64e/i+iniZqBHiJLk603Ulm6+P2sQeI9Slmm01Z19DO8iWmog9LmyOYcaWihZ3t5kuR40z2KWiWa21P4eCj/rTFjFnG1N7dMME3kW1wJLhANE7ZxvZUlvTxFNr4GOl82ZQqKlc9LJlZNEVeBseVRjHGz5RiGZYWayAj3HQoZbmz58OD1A9JqQ4hdym4ZWIvaqn8UEZ//Lia5GrJP79cxZqX+cR1gC9S9TwAAAAABJRU5ErkJggg%3D%3D";

    WG.icon.zoomSlider = new Image(20, 9); 
    WG.icon.zoomSlider.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAJCAYAAAAywQxIAAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAACJSURBVCjPY2RgaDBgYGCoAmJvIOZiIA98A+KtQNzGCDRwFZARykAdsBpk4FcKXIbhUpCB/2E8ISEOhtRUYwZGoCgjkADRIICPvXDhBYYHDz7CTUQxcPnyYIaICB2SnHTw4AMGB4eF2A2UkOBmyMszB9v8//9/IIaI42MvWIDpQqqHIdVjmarpEABe5jklgyUQKQAAAABJRU5ErkJggg%3D%3D";

    WG.icon.zoomMinus = new Image(18, 18); 
    WG.icon.zoomMinus.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAC1SURBVDjLY2Bg6P5PHTxq0MAZJCU17b+Gxly8GKQGr0GCgpP+//jx+/+nTz/xYpAaAYFJuA0SEZny//fvv/8/fPiBF4PUgNSiG/QUWcDGZtn/gID1eLG19VJ0rz0FGbSRCoG9EWRQDRUMqgEZZEkFgywZ/v8Hh9M8CgyZBzYDahA/ED8hwxCQHn64QVDDrEk0DKTWGq4fxkByGTHenAdzCVaDkAy0hMbmRmg6ewplg8QssekBANyQQZ5ZVLwfAAAAAElFTkSuQmCC";

    WG.icon.zoomPlus = new Image(18, 18);
    WG.icon.zoomPlus.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEUSURBVDjLvZJBDsFAFIZnqwvtigNwB226qD0rLuEQbiDVkNiQWEnYSHTrCq7BmoRQqnnm1XipGm2JWHyL98+bLzNvhgEAi8NYx+C0OS5nI3BFZkj3xAQqZ8yBFLBHlYr4gslZZ5A8wF7zSSRO8okkKlOjovEXErrm3XEfrLSpXB7BbufBdnuCUmmYJDOYeAlpQ7U6C0WIZU2TRG0mnvWtCE+DpIhcJv4IhYrigKb1Q+r1OYlqtTnluZwTF21YNMjne3A4nMHzfALr/f41w95nWaQoFgfg+wEcjxfieg1eMqwLhcF7EdJsLqDVWoZ0uyu6mm2vKG80FpI5JfyRD4b9J5GuT2jAlcrke9FDli7JIMrOj0Q37gVun8G2OC0AAAAASUVORK5CYII%3D";

    WG.icon.zoomLevels = new Image(20, 65);
    WG.icon.zoomLevels.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAABBCAYAAADRyoRJAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAA1xJREFUWIXlmF9IU1Ecxz/nupwbRGkz6kEqHxrTrCd96CGjHsL1GKFBBv15U19qbo/ZU8SsHrInCyKDAoneUoKoRVj0EhW1stDUoGi6LNmWOL09qNO7e+7dvXNJ0BcGZ7/f+X3u7+x3/t0JpDq/FYqaQOwFfIBnwTEOvAM1AsptCIxkRwrt18ubIX0JOAwUyR+WURrUXuA0BL9JgOF9QC9QlgOUrQmYOwyhR8uAnXtA7QdcNmGLSoI4AIGnAi6sBeUNsCVP2KKGwb3TAcpJM5jbvQa32zGfRjJNMjlj1HUbJI4roDaaPTYYrCUWayEWayEYrM2RpGhSQGzP0cuOtivYr6qZPA6Ztatrf6ZdV7c50/b7K/F4liZCa+vD7FBVQFjVWdWApXSE6NSFKpYibUg65La2paH4/ZU0NGwDoK9vmPv3h+wDu7peZtoejysDfPHiq8Yn0+oMebmSyTQTE6lMO5ekVV6BCl/l/w+4CiulomItfX2HLAU3NNxlbGzKHOh0FlFd7ck2S+V06g9GHXB0dIqamhuWgKOjUzpboSf23Oqt5XC4nl27Nkp9r159p709Yg9YW7uJ+voKqa+42HhghsBAIEJZWYnUF4//NgT++0VRAMMMQ6E64vFWzScUqjPjqaY7tsvloLS0RGczk4DwHLqL51JwNiCVSpNKGR4Fsw7mhywF5giW6q+sFMOi+Hwb8Pm0d6loNE40OmEKNFRjo5ezZ3drbOfODdDRMZBfhtFonHv3PupsZhIQnsmVqQ3Nmk7sPGQ8sU+dqqGycr3UNzQ0ybVrb6Q+Q+DRo1WG21ckMmYKlA65u/s1Dx58lgaNjPwyygMB4Wmg2LCHPaULXRT9b7hunZPm5ipLwT097/j5c1oH1GRYXu7iypX9WFF//7AUqNHk5DRXr5rfo5f3zZIqIJwC5KeRfc0UvCire0jlCyyopEvP67X2xvvhg35vlALfvz9hCSh5G0UBfliKtqZxB6iDIDT71OBg3s8YdIDoBTRrzeu9nidP3FEg0QN8yjelZfoEao8CHUngGJBYASwBSjO0JxbmYfszUA8y/++bXY2D8MOZ56CZ2MEIrNkB3AKsXGhmgJtANQSeLBqllyS4WAGzR0DUzwdQvuCIAW+BxzB3G0JfsiP/APowCP9vY/eXAAAAAElFTkSuQmCC";

    WG.icon.zoomBar = new Image(18, 264);
    WG.icon.zoomBar.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAEICAYAAABS9KQeAAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADwSURBVHja7doxDoMwDEbh3xHXqsqxGBgZuBSQcK4odOvWpbaqKjwO8C32kwXCJO2SinzP0yTt8zyXYRi+EmqtWpYFCCgOCttsEgEiERIBIhESAQIiESAgEgECIhHGD/QTKKWUPWvdWhtN0iEpOxMZmRpQv1ckIhGmBtTxFdkknVwRIBL5lEjmXQSIRLgiQPeDspm5ErmuawyFmBrQX0GHmRXnZseeI6YGFAJN0+SC1nV9b3ZxbvaDRID6hbaU0uncbK4IUM/vImEfokgEiCvCFQG6IST+0QICIhEgIBJh/EAkwtSASISpAZEIiQDdLpEXQ4EKbODcd8QAAAAASUVORK5CYII%3D";

    WG.icon.print = new Image(18, 18);
    WG.icon.print.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAO9JREFUOE+1lLEKwjAQhr9zd/QlHFxcBfUhdBR9B+OqjjYv4eZjWMHRjvocgpM4VE6blmIracWDQFr+fPmTu4uQRrABWWTfX2cRyATmF6eSTG73wMATBMgZGDtYEWgFHEqAy/xmsoX5TLUlILMuBn24DsEMa4CCEUg72USd1wU5n1aP+DeQ7QBHoJlZLrujD0f64wb0BOwJ6PqnPVVeIX6AtIBIQXENiC4Zggnd+h9A8Q4ad4inSfprO8odpMiRptUncjoFaU1oaJ/pWIF31sJ3UVZukcoFWdq0jtT3qWyf+3Gawl4LAFOFAlgwr8fwCal8VVVKZTGiAAAAAElFTkSuQmCC";
    WG.icon.jupyter = new Image(17, 18);
    WG.icon.jupyter.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAASCAYAAAC9+TVUAAAACXBIWXMAABBNAAAQTQFnjAHgAAAC5UlEQVQ4jX2TT2hUVxTGf+e+OzMvmThJBo1/+i+DrQhqcVEogbhRAi2lRSntonWh7UosgSxKhIIowTYiCqVg6cZlobaFRmp31dJGFEoHLNW0NdhJaoxhjKOTNHnvzXv3dDGTdBio3+5+937fOefjXKEFeoL1CO8ivIJSQGhHWUL4C/gWxzn5gLlmjayKj2HweRNlFMi3mjehgjBMwHk5hgMwq1dp3sPx6WMN/Lzw2ucb2dT3GT6HV2gLoB+yl1RmhOffSXP9XA0XQ+8ej8KAJbtBWCorpUsJ5esJnc8Y/G6LMqKjTMsRxkRH6UQZJ72ml92nM/zyccTAJz5P7vKIA8XVwFiwbcJcMeHiwYD7N12jiRJZ+kVPsB/DWQAyXcK+823MXE2YvBhTLTlqy2B9yD0lFF6yFAYsF95aZnFWG0aHREf5AuVlADa+6FH50xFUlP9DqgN6dnrMjCcN5jvRj/gd2IQYSGVBY0FS9erqIAkBhSf6Pe78mJDpEoKKw7YJwQMF7lqgpz5KTugd8IgDSHcIbeuE8JEiAtGi4ncKW/Z5tPcI4SOP0qWkYdJjgRpgsT5EVcXPCwszjlyvx/xNh5eC6t+K3y1ES5CdVxZmlKXZerhKZIEpYCsIlCeUhen6rJVJx+Jdpfs5Q+WWoxnt64Q4XDlNGYQrACzOKtm1sPtUhu5nDf/cq4e7YiACuacN/cczrN3+35Iaxi3wJXAQMNwrOtbvdBz4uZ2Htx33JxxhFTIdkN9iyG81XBmJmL5c71ZIiPnaElAkww1gByLwxzcxCvQdSbPt7dRqxeqU46ejIcWztVVOuUFMUQD0FH3EXGDXSI4XBlOMvbHM1A8JXZsN2Q3Ccll5MOlIguZkQgyvyjDXDIC8z1WEIVwUojHEMSQRzE84pi8nlH9rNYgQhmSYa/WpmqAn7R7EO0MSFloXtQklDEMyzPcrhLS+aHzI14G9wA6ULoSHwK84xljDVzJItVnzL3+JIz54XmhQAAAAAElFTkSuQmCC";

};

WG.InitIcons();

WG.InitOverlay = function()
{
    let canvas = document.createElement('canvas');
    canvas.id = 'WGoverlayCanvas';
    canvas.style.position = 'absolute';
    canvas.style.left = 0;
    canvas.style.top = 0;
    canvas.style.backgroundColor = 'transparent';
    canvas.style.zIndex = 98;
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);
    WG.ovCanvas = canvas;
    WG.ResizeOverlay();
};

WG.ResizeOverlay = function()
{
    if (!WG.ovCanvas)
	return;
    /*
    let sw = document.body.scrollWidth;
    let sh = document.body.scrollHeight;
    let cw = WG.ovCanvas.width;
    let ch = WG.ovCanvas.height;

    if (sw-4 > cw ||
	sh-4 > ch) {
	WG.ovCanvas.width = sw;
	WG.ovCanvas.height = sh;
    }
    */
    var rect = document.body.getBoundingClientRect();
    WG.ovCanvas.style.left = rect.x + "px";
    WG.ovCanvas.style.top = rect.y + "px";
    WG.ovCanvas.width = rect.width;
    WG.ovCanvas.height = rect.height;    
};

WG.OnScroll = function(ev)
{
    WG.ResizeOverlay();
    
    if (WG.dragState == 'endDrag' && WG.wgactive) {
	WG.DrawPopupConnections();//WG.wgactive);
    }
};

function StopEvent(evt)
{ 
    if (evt.preventDefault != undefined)
        evt.preventDefault();

    if (evt.stopPropagation != undefined)
	evt.stopPropagation();

    return false;
};

WG.SetEventHandlers = function(wg)
{
    // event handlers
    wg.canvas.onmouseleave = function(evt) 
    {
	//console.log("leave", evt.buttons);
	WG.OnMouseLeave(evt, wg);
    };

    wg.canvas.onmouseenter = function(evt) 
    {
	//console.log("enter", evt.buttons);
	WG.OnMouseEnter(evt, wg);
    };

    wg.canvas.onmousedown = function(evt)
    {
	//console.log("down", evt.buttons);
	WG.OnMouseDown(evt, wg);
	
	if (WG.tooltip.dragState != 'endDrag') {
	    return;
	}

	//return StopEvent(evt); 
    };

    wg.canvas.onmouseup = function(evt)
    {
	//console.log("up", evt.buttons);
	WG.OnMouseUp(evt, wg);

	if (WG.tooltip.dragState != 'endDrag') {
	    return;
	}

	//return StopEvent(evt);
    };

    wg.canvas.onmousemove = function(evt) 
    {
	//console.log("move", evt.buttons, WG.tooltip.dragState);
	WG.OnMouseMove(evt, wg);

	if (WG.tooltip.dragState != 'endDrag') {
	    return;
	}

	//return StopEvent(evt);
    };

    wg.canvas.onwheel = function(evt)
    {
	//console.log("wheel", evt.buttons);

	// propagate evt if page scrolling
	if (wg.semzoom == null && wg.mouseMoves < 5)
	    return;

	if (WG.OnWheel(evt, wg) == true)
	    return true;

	if (WG.tooltip.dragState != 'endDrag') {
	    return;
	}

	return StopEvent(evt);
    };

    wg.canvas.oncontextmenu = function(evt)
    {
	//	console.log("oncontext");
	var tip=null;
	
	if (wg.focusId >= 0 && wg.nodeTable[wg.focusId])
	    tip = wg.nodeDesc[wg.focusId];

	if (evt.ctrlKey && wg.focusLink) {
	    let frameid = getFrameIdFromURLString(wg.focusLink[1]);
	    if (frameid) {
		frameidInPopup(this, frameid, evt.clientX, evt.clientY);
		return StopEvent(evt);
	    }
	}
      else if (WG.contextMenuFn) {
	WG.contextMenuFn(evt, tip, wg.focusLink);
	return StopEvent(evt);
      }
	/*
	else if (typeof CelOvContextMenu != 'undefined' && initCelOverview.orgid) {
	    CelOvContextMenu(evt, tip); 
	    return StopEvent(evt);
	}
	else if (WG.regOvP()) {
	    RegOvContextMenu(evt, tip);
	    return StopEvent(evt);
	}
	*/
    };
};

    /* HIGHLIGHTS - there are several functions associated, and storage
       These are associated CelOv highlights:
         WG.DrawHighlights - draw all of the highlights
         WG.HighlightList - initial call: add nodeList with given id and color to list of highlight list;
                                          draw all highlights;
                                          and add node info to list for display of detailed node list.
         WG.UpdateHighlightedNodes - add doc info for each node in list for display of detailed node list.
       These are associated with RegOv highlights:
         WG.RegHighlightList - initial call: 
         WG.RegUpdateHighlightNodes - 
       These are used by both:
         WG.ToggleHighlight - mark highlight list with given id as opposite of current display state and draw everything
         WG.ClearHighlight - remove all highlight lists from the HighlightList

    */
WG.CreateOnlyHighlighting = function(wg, uniqueId)
{ // ONLY called when WG.regOvP == true
    // for each layer, use sub layer to denote unique that's rep'd
    // if its different from current, then redraw, if its the same, don't redraw
    for( var i = 0; i < initRegOverview.layers.length; i++ ) {
	if (initRegOverview.layers[i].layer != uniqueId) {
	    initRegOverview.layers[i].layer = uniqueId;
	    initRegOverview.layers[i].nodes = []
	    for(var j = 0; j < initRegOverview.layers[i].frameIDs.length; j++)
		initRegOverview.layers[i].nodes.push(frameIdToIndex(initRegOverview.layers[i].frameIDs[j], WG.wgactive.nodeDesc));
	    initRegOverview.layers[i].collection = [];
	    wg.highlightList[initRegOverview.layers[i].i][2] = [];
	    initRegOverview.layers[i].fn(WG.wgactive.nodeDesc, initRegOverview.layers[i], false, recursionLimitAtStart);
	}
    }
};

WG.DrawGenOvHighlights = function(wg)
{
    wg.ctx.save();
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);
    wg.ctx.lineWidth = 2;
    
    if ((wg.genOvLinks != null) || (wg.genOvLinks != undefined))
	for(var i = 0; i < wg.genOvLinks.length; i++) {
	    var currentLink = wg.genOvLinks[i];
	    var x1 = (currentLink[2] + 1) + wg.x0;
	    var y1 = (currentLink[3] + 1) + wg.y0;
	    var x2 = currentLink[4] + wg.x0;
	    var y2 = currentLink[5] + wg.y0;

	    var xRadius = ((x2 - x1) / 2);
	    var yRadius = ((y2 - y1));
/*
	    WG.DrawRectangle(wg, 
			     x1, // x
			     y1, // y
			     xRadius, // length
			     yRadius); // height
*/
    	    WG.DrawOval(wg, 
			x1 + xRadius, // x
			y1 + yRadius/2, // y
			xRadius, // x-radius
			yRadius) // y-radius

	}
    wg.ctx.restore();
};

WG.genOvP = function () {
  for (let wg of WG.wglist) {
    if (((wg.genOvLinks != null) || (wg.genOvLinks != undefined)) 
	&& (wg.genOvLinks.length > 0))
      return true;
  }
  return false;
};

WG.DrawHighlights = function(wg)
{
    var gcId = -1;
    var nprims = 0;
    var nnodes = 0;
    
    wg.ctx.save();
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);

    wg.fontId = -1;	    
    
    var uniqueId = null;
    var uniqueIdP = false;
    var reCreateHighlightsP = false;
 
     if (WG.genOvP()) { WG.DrawGenOvHighlights(wg);
     } else {
    if (WG.regOvP()) {
	uniqueId = document.getElementById('regUniqueID').value;
	uniqueIdP = ((uniqueId == undefined) || (uniqueId == null) || (uniqueId == '')) ? false : true;
	reCreateHighlightsP = (uniqueIdP)
	    ? false 
	    : (wg && wg.highlightList.length > 0 && wg.highlightList[0][2].length == 0)
            ? true 
	    : false;
	if (uniqueIdP) {
	    WG.CreateOnlyHighlighting(wg, uniqueId) 
	} else {
	    if (reCreateHighlightsP) {
		for( var i = 0; i < initRegOverview.layers.length; i++ ) {
		    if (initRegOverview.layers[i].layer == null) {
			initRegOverview.layers[i].layer = "one";
		    } else {
			if (initRegOverview.layers[i].layer == "one") {
			    initRegOverview.layers[i].layer = "done";
			    for(var j = 0; j < initRegOverview.layers[i].frameIDs.length; j++)
				initRegOverview.layers[i].nodes.push(frameIdToIndex(initRegOverview.layers[i].frameIDs[j], WG.wgactive.nodeDesc));
			    initRegOverview.layers[i].fn(WG.wgactive.nodeDesc, initRegOverview.layers[i], false, recursionLimitAtStart); 
			}}}}}}

    for(var h = 0; h < wg.highlightList.length; h++) { // for each highlight list h
	for(var n = 0; n < wg.highlightList[h][2].length; n++) { // for each item in n in highlight list h
	    if (wg.highlightList[h][3] != 'on')
		continue;
	    var id = wg.highlightList[h][2][n]; // see if its a pair, check pair is in nodeTable
	    let idArray = (Array.isArray(id)) ? id : false;
	    if (idArray) {
		for(var z = 0; z < 2; z++)
		    if (wg.nodeTable[idArray[z]] == null) { 
			console.log("highlight invalid nodeId in pair", idArray[z], idArray);
			continue; }
	    } else {
	    if (wg.nodeTable[id] == null) { 
		console.log("highlight invalid nodeId", id);
		continue;
	    }};
	    nnodes++;
	    // if a pair, do the following for each
	    if (idArray) {
		for(var z = 0; z < 2; z++) {
		    let idZ = idArray[z];
		    let hasOmics = wg.nodeTable[idZ][3]; // if it a pair, no omics? 
		    for(var g = 0; g < wg.gc.length; g++) {  // for every graphic context
			if (wg.gc[g].foreground != "#ffffff")
			    wg.gc[g].foreground = wg.highlightList[h][1]; // foreground color is color for this list
			wg.gc[g].background = wg.highlightList[h][1]; // background color is color for this list
			wg.gc[g].width = hasOmics ? // width of lines for all contexts is ...
			    g_edgeWidthHighlight + 2 : g_edgeWidthHighlight;
		    }}
		} else {
		    let hasOmics = wg.nodeTable[id][3]; // if it a pair, no omics? 
		    for(var g = 0; g < wg.gc.length; g++) { 
			if (wg.gc[g].foreground != "#ffffff")
			    wg.gc[g].foreground = wg.highlightList[h][1];
			wg.gc[g].background = wg.highlightList[h][1];
			wg.gc[g].width = hasOmics ? 
			    g_edgeWidthHighlight + 2 : g_edgeWidthHighlight;
		    }}
	    gcId = -1;
            // if a pair, do the following for each
	    if (idArray) {

		for(var z = 0; z < 2; z++) {
		    let idZ = idArray[z];
		    var primListZ = wg.nodeTable[idZ][2];
		    for(var p = 0; p < primListZ.length; p++) {
			nprims++;
			if (primListZ[p][0] != "S") { // don't take graphics context or draw strings
			    if  (primListZ[p][2] != gcId) {
				gcId = primListZ[p][2];
				WG.SetGC(wg, wg.gc[gcId]);
			    }
			    if (initCelOverview.org-id) // don't highlight primitives for RegOv
				WG.DrawPrimitive(wg, primListZ[p]);
			}
			}}
	    } else {
		var primList = wg.nodeTable[id][2];
		for(var p = 0; p < primList.length; p++) {
		    nprims++;
		    
		    if (primList[p][2] != gcId) {
			gcId = primList[p][2];
			WG.SetGC(wg, wg.gc[gcId]);
		    }
		    WG.DrawPrimitive(wg, primList[p]);
		}}
	    // if a pair, draw the Arrow primitive between them.
	    if (idArray) {
		// xtail, ytail, xhead, yhead,fromhead, tohead, headLength, headWidth
		WG.DrawArrow(wg,
			     ((WG.wgactive.nodeTable[idArray[0]][0][0] + WG.wgactive.nodeTable[idArray[0]][0][2]) / 2), // from x
			     ((WG.wgactive.nodeTable[idArray[0]][0][1] + WG.wgactive.nodeTable[idArray[0]][0][3]) / 2), // from y
			     ((WG.wgactive.nodeTable[idArray[1]][0][0] + WG.wgactive.nodeTable[idArray[1]][0][2]) / 2), // to x
			     ((WG.wgactive.nodeTable[idArray[1]][0][1] + WG.wgactive.nodeTable[idArray[1]][0][3]) / 2), // to y
			     0, 1, 10.0, 8.0);
	    }
	}
    }
     } // genOv else

    // restore GC colors
    for(var g = 0; g < wg.gc.length; g++) {
	wg.gc[g].foreground = wg.gc[g].foregroundSaved;
	wg.gc[g].background = wg.gc[g].backgroundSaved;
	wg.gc[g].width = wg.gc[g].widthSaved;
    }

    wg.ctx.restore();

    //console.log("high", nnodes, nprims);

    return;
};

WG.HighlightList = function(listId, color, nodeList)
{
    var wg = WG.wgactive;
    
    if (!wg)
	return;
    
    wg.highlightList.push([listId, color, nodeList, 'on']);
    WG.DrawHighlights(wg);

    WG.UpdateHighlightedNodes(wg, listId, nodeList);
};

WG.HighlightListN = function(n)
{
    for(var i = 0; i < WG.wgactive.highlightList.length; i++)
	if (WG.wgactive.highlightList[i][0] == n) {  
	    return WG.wgactive.highlightList[i]; }
};

WG.HighlightListNIdx = function(n)
{
    for(var i = 0; i < WG.wgactive.highlightList.length; i++)
	if (WG.wgactive.highlightList[i][0] == n) {  
	    return i }
};

WG.RegHighlightList = function(regLayer, nodeList)
{
    var wg = WG.wgactive;
    let listId = regLayer.i;
    let color = regLayer.color;
    if (!wg)
	return;
    let highlightList = WG.HighlightListN(listId);
    if (highlightList == undefined) {
	highlightList = [listId, color, nodeList, 'on'];
	wg.highlightList.push(highlightList);
    } else {
	highlightList[2] = highlightList[2].concat(nodeList);
    }
    WG.DrawHighlights(wg);

    var newAllNodes = Array.isArray(regLayer.collection) ? regLayer.collection.concat(nodeList) : nodeList;
    regLayer.collection = [...new Set(newAllNodes)]; // simple removeDuplicates     

    // WG.UpdateHighlightedNodes(wg, listId, nodeList);
};

WG.HighlightRegArcs = function(from, to, regLayer, allNodes, drawP = true)
{
    let wg = WG.wgactive;
    let layerId = regLayer.i;
    let n = WG.HighlightListNIdx(layerId); 
    /* There's no list yet, so create it and put the vectors on it */
    if (n == undefined || n == null) {
	wg.highlightList.push([layerId, regLayer.color, [], 'on']);
	n = WG.HighlightListNIdx(layerId);
    }
    /* record in highlightList */
    if (Array.isArray(from)) {
	//node = to 
	for(var i = 0; i < from.length; i++)
	    if (from[i] != to)
		wg.highlightList[n][2].push([ from[i], to ])
    } else {
	//node = from
	for(var i = 0; i < to.length; i++)
	    if (from != to[i])
		wg.highlightList[n][2].push([ from, to[i] ])

    }
    // At this point, we've put the vectors on wg.highlightList
    if (drawP) WG.DrawHighlights(wg);
    // we need to update regLayer.collection to have all the from/to nodes, all the regLayer.nodes,
    //      and we need to get rid of duplicates and sort them
    //var totalNodes = regLayer.nodes.concat(allNodes);
    var newAllNodes = Array.isArray(regLayer.collection) ? regLayer.collection.concat(allNodes) : allNodes;
    regLayer.collection = [...new Set(newAllNodes)]; // simple removeDuplicates
};


WG.UpdateHighlightedNodes = function(wg, listId, nodeList) {
    var highlighted = {};
    for(var n = 0; n < nodeList.length; n++) {
	var id = nodeList[n];
	if (id < 0 || id > wg.nodeTable.length)
	    continue;
	var tip = wg.nodeDesc[id];
	if (tip) {
	    highlighted[id] =
		{
		    name: tip[3],
		    cname : tip[4],
		    doc2: tip[6][1],
		    doc3: tip[6][2],		    
		    frameId: tip[0]
		};
	}
    }

    if (typeof highlightedNodes == 'function')
	highlightedNodes(listId, highlighted);
};

WG.ToggleHighlight = function(listId, mode)
{
    var wg = WG.wgactive;

    if (!wg)
	return;
    
    for(var n = 0; n < wg.highlightList.length; n++) {
	if (wg.highlightList[n][0] == listId) {
	    wg.highlightList[n][3] = mode;
	}
    }
    WG.Draw(wg);
};


WG.ClearHighlight = function(listIds)
{
    var wg = WG.wgactive;

    if (!wg)
	return;
    
    if (listIds == null) {
	wg.highlightList.length = 0;
    } else {
	//untested. CellOv never gives single list to remove
	console.log("clearHighlight listIds list not implemented");
	return;
    }

    WG.Draw(wg);
};

    /* Mark means a google maps style marker. Only one per any display, hence wg.markerId holds one node value */
WG.Mark = function(nodeId)
{
    var wg = WG.wgactive;
    
    if (!wg || nodeId < 0 || nodeId >= wg.nodeTable.length || wg.nodeTable[nodeId] == null) {
	console.log("WG.Mark: invalid nodeId", nodeId);
	return;
    }
    var box = wg.nodeTable[nodeId][0];
    var x = (box[0] + box[2])/2;
    var y = (box[1] + box[3])/2;    

    // center wg around node
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);
    
    wg.zoom.px.x = wg.canvas.width/2;
    wg.zoom.px.y = wg.canvas.height/2;    
    wg.zoom.pt.x = x;
    wg.zoom.pt.y = y;    
    wg.scale = wg.scaleCanvas * wg.scaleDevice;

    wg.translate.x = x - wg.canvas.width/2 / wg.scale;
    wg.translate.y = y - wg.canvas.height/2 / wg.scale;    
    wg.ctx.scale(wg.scaleCanvas * wg.scaleDevice, wg.scaleCanvas * wg.scaleDevice);
    wg.ctx.translate(-wg.translate.x, -wg.translate.y);

    wg.markerId = nodeId;
    wg.focusId = -1;
    WG.Draw(wg);
};

WG.UnMark = function()
{
    var wg = WG.wgactive;

    if (!wg)
	return;
    
    wg.markerId = -1;
    WG.Draw(wg);
};

WG.RegMark = function(nodeId)
{
    var wg = WG.wgactive;
    
    if (!wg || nodeId < 0 || nodeId >= wg.nodeTable.length || wg.nodeTable[nodeId] == null) {
	console.log("WG.Mark: invalid nodeId", nodeId);
	return;
    }
    var box = wg.nodeTable[nodeId][0];
    var x = (box[0] + box[2])/2;
    var y = (box[1] + box[3])/2;    

    // center wg around node
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);
    
    wg.zoom.px.x = wg.canvas.width/2;
    wg.zoom.px.y = wg.canvas.height/2;    
    wg.zoom.pt.x = x;
    wg.zoom.pt.y = y;    
    wg.scale = wg.scaleCanvas * wg.scaleDevice;

    wg.translate.x = x - wg.canvas.width/2 / wg.scale;
    wg.translate.y = y - wg.canvas.height/2 / wg.scale;    
    wg.ctx.scale(wg.scaleCanvas * wg.scaleDevice, wg.scaleCanvas * wg.scaleDevice);
    wg.ctx.translate(-wg.translate.x, -wg.translate.y);

    wg.markerId = nodeId;
    wg.regMarkerIds.push(nodeId);
    wg.focusId = -1;
    WG.Draw(wg);
};

WG.RegUnMark = function()
{
    var wg = WG.wgactive;

    if (!wg)
	return;
    wg.markerId = -1;
    wg.regMarkerIds = [];
    WG.Draw(wg);
};

WG.DrawMarker = function(wg, nodeId)
{
    if (nodeId < 0 ||
	nodeId >= wg.nodeTable.length ||
	wg.nodeTable[nodeId] == null) {
	return;
    }
    
    var box = wg.nodeTable[nodeId][0];
    var x = (box[0] + box[2])/2;
    var y = (box[1] + box[3])/2;    

    wg.ctx.save();
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);

    x = (x - wg.x0) * wg.scale;
    y = (y - wg.y0) * wg.scale;    

    var marker = WG.icon.marker;
    x -= marker.width/2;
    y -= marker.height -2;

    wg.ctx.globalAlpha = 0.75;
    wg.ctx.drawImage(marker, x, y);
    wg.ctx.globalAlpha = 1;

    wg.ctx.restore();
};

WG.GetCurrentZoomLevel = function()
{
    if (WG.wgactive)
	return WG.wgactive.zoom.level;
    else
	return 0;
};

WG.Opacity = function(alpha)
{
    var wg = WG.wgactive;

    if (wg) {
	wg.alpha = alpha;
	WG.Draw(wg);
    }
};

WG.DrawOmics = function(wg)
{
    let t0 = performance.now();
    let gcId = -1;
    let nprims = 0;
    let nnodes = 0;
    
    if (typeof OP === undefined || 
	!wg.omics || 
	!wg.omics.display || 
	!wg.omics.data || 
	!OP.nodehist || 
	!OP.cmap)
	return;

    let nodehist = OP.nodehist;
    let valuehist = OP.valuehist;
    let cmap = OP.cmap;

    wg.ctx.save();
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.translate(wg.border.x * wg.scaleDevice, wg.border.y * wg.scaleDevice);

    wg.fontId = -1;	    

    let c = 0;
    let cc = -1;
    let epsilon = .000001;
    for(let h = 0; h < nodehist.length; h++) {
	if (nodehist[h].length <= 0)
	    continue;

	if (valuehist[h] > cmap[0].value+epsilon) {
	    continue;
	}

	for(; c < cmap.length-1; c++) {
	    if (valuehist[h] <= cmap[c].value+epsilon &&
		valuehist[h] > cmap[c+1].value-epsilon)
		    break;
	}

	if (valuehist[h] < cmap[cmap.length-1].value-epsilon) {
	    break;
	}

	if (cmap[c].enable == false)
	    continue;

	if (c != cc) {
	    for(let g = 0; g < wg.gc.length; g++) {
		if (wg.gc[g].foreground != "#ffffff") {
		    wg.gc[g].foreground = cmap[c].pix;
		    wg.gc[g].background = cmap[c].pix;
		    wg.gc[g].width = g_edgeWidthHighlight;
		}
	    }
	    gcId = -1;
	    cc = c;
	}

	for(let o = 0; o < nodehist[h].length; o++) {
	    let id = nodehist[h][o];
	    if (wg.nodeTable[id] == null) {
		continue;
	    }
	    nnodes++;

	    let primList = wg.nodeTable[id][2];
	    for(var p = 0; p < primList.length; p++) {
		nprims++;

		if (primList[p][2] != gcId) {
		    gcId = primList[p][2];
		    WG.SetGC(wg, wg.gc[gcId]);
		}
		WG.DrawPrimitive(wg, primList[p]);
	    }
	}
    }

    // restore GC colors
    for(var g = 0; g < wg.gc.length; g++) {
	wg.gc[g].foreground = wg.gc[g].foregroundSaved;
	wg.gc[g].background = wg.gc[g].backgroundSaved;
	wg.gc[g].width = wg.gc[g].widthSaved;
    }
    
    wg.ctx.restore();

    var t1 = performance.now();
    if (OP.verbose++ < 10)
	console.log("omics draw", nnodes, nprims, parseInt(t1-t0), "ms");

    return;
};

WG.SetEdgeWidth = function(width)
{
    var wg = WG.wgactive;
    
    g_edgeWidth = Number(width);

    if (wg)
	WG.Draw(wg);
};

WG.SetHighlightEdgeWidth = function(width)
{
    var wg = WG.wgactive;

    g_edgeWidthHighlight = Number(width);

    if (wg)
	WG.Draw(wg);
};

///kr:Dec-16-2022 objectType should be one of:
/// 'reaction' 'metabolite' 'gene' 'protein' 'object'
///
WG.OmicsInit = function( data, colors, minmax, columnNames, exprType, log, objectType)
{
    
    switch(WG.jqueryLoaded) {
    case 0: //not loaded
	WG.jqueryLoaded = -1; //loading
	console.log("JQueryUI loading...");
	LoadJQueryUI(function() {
	    console.log("JQueryUI loaded");
	    WG.jqueryLoaded = 1;
	    return WG.OmicsInit(data, colors, minmax, columnNames, exprType, log, objectType);
	});
	return;
    case -1: //loading
	return;
    case 1: //loaded;
	break;
    }
    
    let wg = WG.wgactive;

    if (!wg) {
	console.log("WG.OmicsInit: wg not loaded");
	return;
    }
	
    wg.omics = {
        data: data,
        colors: colors,
	minmax: minmax,
        columnNames: columnNames,
	exprType: exprType,
	objectType: objectType,
	display: true
    };
    //saveFile(JSON.stringify(wg.omics), "omics.json");

    let minvalue = 1;
    let maxvalue = -1;
    for(let c = 0; c < data.length; c++) {
	for(let n = 0; n < data[c].length; n++) {
	    let v = data[c][n][1];
	    if (minvalue > maxvalue) {
		minvalue = v;
		maxvalue = v;
	    } else {
		if (v > maxvalue)
		    maxvalue = v;
		else if (v < minvalue)
		    minvalue = v;
	    }
	}
    }
    if (minvalue != minmax[0] ||
	maxvalue != minmax[1]) {
	console.log("OmicsInit: invalid minmax", minvalue, minmax[0], maxvalue, minmax[1]);
	minmax[0] = minvalue;
	minmax[1] = maxvalue;
    }
    console.log("OmicsInit: minmax", minvalue, minmax[0], maxvalue, minmax[1]);    
    
    if (exprType == 'absolute') {
	let nfiltered = 0;
	for(let c = 0; c < data.length; c++) {
	    for(let n = 0; n < data[c].length; n++) {
		let v = data[c][n][1];
		if (v < 0) {
		    data[c].splice(n,1);
		    n--;
		    nfiltered++;
		}
	    }
	}
	console.log('absolute omics filtered', nfiltered);
	minvalue = 0;
	minmax[0] = 0;
    }

    if (exprType == 'absolute') {
	//saveFile(JSON.stringify(wg.omics), "omicsAbs.json");
	wg.omics.valueMax = Math.max(Math.abs(minvalue),Math.abs(maxvalue));
	wg.omics.valueMin = 0;
    } else {
	wg.omics.valueMax = Math.max(Math.abs(minvalue),Math.abs(maxvalue));
	wg.omics.valueMin = -wg.omics.valueMax;
    }

    wg.omics.valueMax = Math.round(wg.omics.valueMax*10000) / 10000;
    wg.omics.valueMin = Math.round(wg.omics.valueMin*10000) / 10000;    
    wg.omics.highlightList = [];
    wg.omics.column = 0;
    wg.omics.threshMin = wg.omics.valueMin;
    wg.omics.threshMax = wg.omics.valueMax;    
    wg.omics.colorMin = wg.omics.valueMin;
    wg.omics.colorMax = wg.omics.valueMax;    
    wg.omics.histogram = [];

    WG.OmicsFilterNonVisibleNodes(wg)
    WG.OmicsFlagNodes(wg);
//    WG.OmicsHighlight(0);

    //kr:Aug-26-2022 Post-processing, to collect a mapping from frameIds to their omics datapoints.
    // Needed for DataTable
    WG.FrameIdToOmicsDataMapInit(wg);
    //WG.NodeIdxToOmicsDataMapInit(wg);
    //kr:Nov-11-2022 Change tooltip popups to show the "DataTable" button in their header.
    WG.btnDataTableInPopupsChangeVis(null);

    if (WG.omicsPanel == null) {
	WG.omicsPanel = OP.Create();
    }
    OP.Init();    
    OP.Open();

    WG.Draw(wg);

    return;
};

///kr:Nov-11-2022 Change tooltip popups to show (or not) the "DataTable" button in their header.
///  vis : 'none' to disable and suppress visibility.
///        null   to show.
///
WG.btnDataTableInPopupsChangeVis = function(vis)
{
  for (let p = 0; p < WG.tooltip.popups.length; p++) {
    let popup = WG.tooltip.popups[p];
    let header = popup.header.childNodes[0];
    header.btnDataTable.style.display = vis;
  }
};

WG.OmicsFilterNonVisibleNodes = function(wg)
{
    if (wg.omics.data == undefined || 
	wg.omics.data.length <= 0)
	return;

    let nodeTable = wg.nodeTable;
    let nfiltered = 0;
    for(let c = 0; c < wg.omics.data.length; c++) {
	let data = wg.omics.data[c];
	for(let r = 0; r < data.length; r++) {
	    let id = data[r][0];
	    if (nodeTable[id] == null) {
		data.splice(r--, 1);
		nfiltered++;
	    }
	}
    }
    console.log("OmicsFilterNonVisibleNodes:", nfiltered, "filtered");
};

WG.OmicsHighlight = function(column)
{
    var wg = WG.wgactive;
    
    if (!wg)
	return;

    if (!wg.omics || !wg.omics.data || !wg.omics.colors)
	return;

    if (column >= wg.omics.data.length) {
	console.log("WG.OmicsHighlight: invalid column", column);
	return;
    }
    wg.omics.column = column;
    wg.omics.highlightList.length = 0;
    if (column < 0) {
	console.log("dissmiss omics");
	
	WG.Draw(wg);
	return;
    }

    let highlightList = wg.omics.highlightList;
    let threshMin = wg.omics.threshMin;
    let threshMax = wg.omics.threshMax;
    let colorMin = wg.omics.colorMin;
    let colorMax = wg.omics.colorMax;
    let data = wg.omics.data[column];
    let colors = wg.omics.colors;
    let filteredByValue=0;
    let filteredByColor=0;
    let histogram = wg.omics.histogram;
    let step = (wg.omics.threshMax - wg.omics.threshMin) / (wg.omics.colors.length-2)    
    for(let h = 0; h < colors.length; h++) {
	histogram[h] = 0;
    }

    for(let r = 0; r < data.length; r++) {
	let value = data[r][1];

	let t = (value - wg.omics.threshMin)/step + 1;
	t = parseInt(t);

	if (value < threshMin || value > threshMax) {
	    filteredByValue++;
	} else  if (value < colorMin || value > colorMax) {
	    filteredByColor++;
	} else if (t < 0 || t > wg.omics.colors.length-1) {
	} else {
	    histogram[t]++;
	    highlightList.push(data[r][0]);
	    highlightList.push(colors[t]);
	}

    }
    wg.omics.filteredByValue = filteredByValue;
    wg.omics.filteredByColor = filteredByColor;
/*
    console.log("value", filteredByValue,
		"color", filteredByColor,
		"high", highlightList.length/2);

    for(let h = 0; h < colors.length; h++)
	console.log(h, colors[h], histogram[h]);

    console.log("omics high:", filteredByValue, "color", filteredByColor, data.length,
		wg.omics.colorMin,
		wg.omics.colorMax,
		wg.omics.threshMin,
		wg.omics.threshMax);
*/
    WG.OmicsFlagNodes(wg);

    WG.Draw(wg);
};

WG.OmicsThresholds = function(threshMin, threshMax, colorMin, colorMax)
{
    var wg = WG.wgactive;

    threshMin = Math.round(threshMin*10000) / 10000;
    threshMax = Math.round(threshMax*10000) / 10000;
    colorMin = Math.round(colorMin*10000) / 10000;
    colorMax = Math.round(colorMax*10000) / 10000;
    
    wg.omics.valueMin = Math.round(wg.omics.valueMin*10000) / 10000;    
    
    if (wg) {
	wg.omics.threshMin = threshMin;
	wg.omics.threshMax = threshMax;
	wg.omics.colorMin = colorMin;
	wg.omics.colorMax = colorMax;
	WG.OmicsHighlight(wg.omics.column);
    }
};

WG.OmicsRemove = function()
{
    var wg = WG.wgactive;

    for(let p = 0; p < WG.tooltip.popups.length; p++) {
	WG.tooltip.popups[p].destroy();
    }
    WG.tooltip.popups = [];

    if (WG.omicsPanel) {
	OP.OnPause();
	if (!OP.closeConfirmed) {
	    OP.closeConfirmed = true;	    
	    OP.Close();
	}
    }
    
    if (wg && wg.omics) {
	wg.omics.data = null;
	wg.omics.colors = null;
	wg.omics.highlightList = null;
	wg.omics.column = -1;

	WG.OmicsFlagNodes(wg);
	wg.alpha = 1;
	WG.Draw(wg);
    }
    
    return;
};

WG.OmicsPanelIsOpen = function()
{
    if (OP && OP.init) {
	return $j( "#omicsDialog" ).dialog("isOpen");
    } else
	return false;
};

WG.OmicsUpdateStyle = function(type) //type: 'all', 'recent'
{
    var wg = WG.wgactive;

    if (!wg)
	return;
    
    let popups = WG.tooltip.popups;
    
    switch(type) {
    case 'all':
	for(let p = 0; p < popups.length; p++) {
	    if (popups[p].visible &&
		popups[p].tip &&
		popups[p].omicsTimestamp > 0)
		OmicsTooltipHandler(popups[p].tip, popups[p]);
	}
	break;
    case 'recent':
	let recent = null;
	for(let p = 0; p < popups.length; p++) {
	    if (popups[p].visible &&
		popups[p].tip &&
		(recent == null ||
		 recent.omicsTimestamp < popups[p].omicsTimestamp)) {
		recent = popups[p];
	    }
	}

	if (recent) {
	    OmicsTooltipHandler(recent.tip, recent);
	}
	break;
    }
};

WG.DisplayOmicsPopups = function(nodeList)
{
    var wg = WG.wgactive;

    for(let n = 0; n < nodeList.length; n++) {
	wg.focusId = nodeList[n];
	WG.tooltip.Activate(wg);
	let header = wg.popup.header.childNodes[0];
	let btn = header.btnOmics;
	if (btn.style.display == "") {
	    WG.tooltip.BtnHandler(btn, wg.popup);
	}
    }
};

WG.GetNodesByFrameId = function(frameId)
{
    var wg = WG.wgactive;

    if (!wg)
	return null;

    var nodelist = [];
    for(let id = 0; id < wg.nodeDesc.length; id++) {
	let tip = wg.nodeDesc[id];
	if (tip) {
	    if (frameId == tip[0]) {
		nodelist.push(id);
	    }
	}
    }

    console.log("WG.GetNodesByFrameId", frameId, "=>", nodelist);

    return nodelist;
};

WG.GetNodesByPathwayId = function(pathwayId)
{
    var wg = WG.wgactive;

    if (!wg)
	return null;

    var nodelist = [];
    for(let id = 0; id < wg.nodeDesc.length; id++) {
	let tip = wg.nodeDesc[id];
	if (tip && tip[1]) {
	    for(let p = 0; p < tip[1].length; p++) {
		if (tip[1][p] == pathwayId) {
		    nodelist.push(id);
		    break;
		}
	    }
	}
    }

    console.log("WG.GetNodesByPathwayId", pathwayId, "=>", nodelist);

    return nodelist;
};

var g_edgeWidthHighlight = 1;
var g_edgeWidth = 1;
var g_thresh = [];
var g_oo = 0;
var g_debugP = 0;

WG.OnKey = function(evt, wg)
{
    wg = WG.wgactive;

    switch(evt.key) {
    case 'p':
	g_debugP ^= 1;
	WG.Draw(wg);
	break;
    case 'm':
	console.log("mark", wg.focusId);
	WG.Mark(wg.focusId);
	break;
    case 'M':
	WG.UnMark();
	break;
    case 'h':
	WG.HighlightList(0, "#ff0000", [187, 227, 17, 93, 95]);
	break;
    case 'H':
	WG.ClearHighlight(null);
	break;
    case 'g':
	WG.LoadJSON("json/genOvLinks.json", function(ovLinks) {
	    console.log("ovLinks", ovLinks);
	    wg.genOvLinks = ovLinks;
	    WG.Draw(WG.wglist[0]);
	});
	break;
    case 'o':
	{
	    let omicsFile = [
		"./ECOLI/omics1-3.json",		
		"./ECOLI/feuer1-4abs.json",
		"./ECOLI/feuer1-4rel.json",
		"./ECOLI/omics1-8.json",		
		"./ECOLI/omics1-8abs.json",		
		"./ECOLI/omics1.json",		
		"./ECOLI/omics1abs.json",		
	    ];
	    if (g_oo == 0) {
		WG.SetHighlightEdgeWidth(2);
//		WG.Opacity(.1);
	    }
	    WG.LoadJSON(omicsFile[(g_oo++)%omicsFile.length], function(omics) {
		if (omics.exprType == undefined)
		    omics.exprType = 'relative';
		WG.OmicsInit( omics.data, omics.colors, omics.minmax, omics.columnNames, omics.exprType);
		
            });
	    break;
        }
    case 'O': 
	{
/*
	    let canvas = WG.ov.canvas;
	    let ctx = WG.ov.ctx;
	    let w=canvas.width;
	    let h=canvas.height;
	    console.log(canvas,w,h); 
	    ctx.setTransform(1, 0, 0, 1, 0, 0);
	    ctx.clearRect(0,0,w,h);
	    ctx.beginPath();
	    ctx.strokeStyle = 'red';
 	    ctx.rect(1,1,w-2,h-2);
	    ctx.moveTo(0, 0);
	    ctx.lineTo(w,h);
	    ctx.moveTo(w, 0);
	    ctx.lineTo(0,h);
 	    ctx.stroke();
	    break;
*/
	}
    case 'r':
	WG.OmicsRemove();
	break;

    case 'p':
	WG.PwyOmicsTooltip('testdiv', '0', 0);
	WG.PwyOmicsTooltip('testdiv', '1', 1);
	WG.PwyOmicsTooltip('testdiv', '2', 2);
	WG.PwyOmicsTooltip('testdiv', '3', 3);
	WG.PwyOmicsTooltip('testdiv', '4', 4);
	break;

    case 'j':
	{
	    let t0 = performance.now();
	    let url = "ECOLI/expr-coli-trp-GDS96.txt";
	    //let url = "ECOLI/short-expr-coli-trp-GDS96.txt";
	    let omics = [];
	    let header = null;
	    let hist = [];
	    for(let c = 0; c < 9; c++) {
		hist[c] = [];
		for(let t = 0; t < 11; t++) {
		    hist[c][t] = 0;
		}
	    }
	    WG.LoadFile(url, function(omicsFile) {
		var lines = omicsFile.split('\n');
		for(let l = 0; l < lines.length; l++) {
		    if (lines[l][0] == '#')
			continue;
		    if (lines[l].indexOf('$gene-id') == 0)
			header = lines[l];
		    else {
			omics.push(lines[l].split('\t'));
		    }
		}
		console.log("omics", url, performance.now()-t0);
		console.log("header", header);
		console.log("data", omics);
		let thresholds = g_thresh;
		let nulls = 0;
		for(let o = 0; o < omics.length; o++) {
		    for(let v = 1; v < omics[o].length; v++) {
			let value = omics[o][v];
			if (value == "null" ) {
			    nulls++;
			    continue;
			}
			let t = 0;
			for(t = 0; t < thresholds.length; t++) {
			    if (value <= thresholds[t]) 
				break;
			}
			hist[v-1][t]++;
			if (t == 10)
			    console.log(o, v, omics[o][v], value, t);
		    }
		}
		console.log("nulls", nulls);
		for(let c = 0; c < 9; c++) {
		    let sum = 0;
		    let str = "[ ";
		    for(let h = 0; h < hist[c].length; h++) {
			sum += hist[c][h];
			str += hist[c][h] + ", ";
		    } 
		    str += "]"
		    console.log(c, sum, str);
		}
	    });
	    break;
	}
    }
};

var WGTest = {};

WGTest.OmicsMaxThreshold = function(value, init)
{
    //console.log("omicsMax", value, init);

    var wg = WG.wgactive;
    if (!wg)
	return;
    
    var out = document.getElementById('maxThreshOut');
    if (out)
	out.value = value;

    if (init) {
	var s = document.getElementById("maxThresh");
	if (s) {
	    s.min = wg.omics.threshMin;
	    s.max = wg.omics.threshMax;
	    s.value = value;
	}
    } else {
	    WG.OmicsThresholds(wg.omics.threshMin, value); 
    }
};

WGTest.OmicsMinThreshold = function(value, init)
{
    //console.log("omicsMin", value, init);
    var wg = WG.wgactive;
    if (!wg)
	return;

    var out = document.getElementById('minThreshOut');
    if (out)
	out.value = value;

    if (init) {
	var s = document.getElementById("minThresh");
	if (s) {
	    s.min = wg.omics.threshMin;
	    s.max = wg.omics.threshMax;
	    s.value = value;
	}
    } else {
	WG.OmicsThresholds(value, wg.omics.threshMax); 
    }
};

WGTest.OmicsColumn = function(value, init)
{
    //console.log("omicsColumn", value, init);

    var wg = WG.wgactive;
    if (!wg)
	return;

    var out = document.getElementById('omicsColumnOut');
    if (out)
	out.value = value;

    if (init) {
	var s = document.getElementById("omicsColumn");
	if (s) {
	    s.value = value;
	}
    } else {
	WG.OmicsHighlight(value);
    }
};

WGTest.Opacity = function(alpha, init)
{
    if (init) {
	let out = document.getElementById('opacityOut');
	if (out)
	    out.value = alpha;
    }
    
    WG.Opacity(alpha);
};

WGTest.SetEdgeWidth = function(value)
{
    let out = document.getElementById('edgeWidthOut');
    if (out)
	out.value = value;
    
    WG.SetEdgeWidth(value);
};

WGTest.SetHighlightEdgeWidth = function(value)
{
    let out = document.getElementById('edgeWidthHighlightOut');
    if (out)
	out.value = value;
    
    WG.SetHighlightEdgeWidth(value);
};

WGTest.SetEdgeColor = function(value)
{
    var wg = WG.wgactive;

    if (!wg)
	return;

    var edgeColor = "#334cff";

    for(let z = 0; z < wg.semzoom.length; z++) {
	wg = wg.semzoom[z].wg;

	for(let g = 0; g < wg.gc.length; g++) {
	    if (wg.gc[g].edgeColorSaved == edgeColor) {
		wg.gc[g].foreground = value;
		wg.gc[g].foregroundSaved = value;
	    }
	}
    }

    wg = WG.wgactive;
    WG.Draw(wg);

    let out = document.getElementById('colorOut');
    if (out)
	out.value = value;
};

WGTest.highlightType = function(type)
{
    var wg = WG.wgactive;
    if (!wg)
	return;
    
    let nodelist = [];
    for(let id = 0; id < wg.nodeDesc.length; id++) {
	let tip = wg.nodeDesc[id];
	if (tip) {
	    if (tip[2] == type)
		nodelist.push(id);
	}
    }

    console.log("highlight", type, nodelist.length);

    WG.ClearHighlight(null);
    if (nodelist.length > 0)
	WG.HighlightList(1, "#FF0000", nodelist);
};

function LoadScript(url, callback)
{
    let head = document.getElementsByTagName('head')[0];
    let script = document.createElement('script');
    
    script.onload = function() {
	if (callback)
	    callback();
    }
    script.type= 'text/javascript';
    script.src= url;
    head.appendChild(script);
}

function LoadLink(url)
{
    let head = document.getElementsByTagName('head')[0];
    let link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    head.appendChild(link);
}

function LoadJQueryUI(cb)
{
    LoadLink('/ui/1.11.4/themes/flick/jquery-ui.css');
    LoadLink('/ui/jquery-ui-slider-pips.css');
    LoadLink('/ui/OmicsPanel.css');  //-2.4.css';

    LoadScript('/ui/1.11.4/jquery-ui.min.js', function() {
	LoadScript('/ui/jquery.dialogextend.min.js', function() {
	    LoadScript('/ui/jquery-ui-1.11.4-slider-pips.min.js', function () {
		LoadScript('/ui/OmicsPanel.js', cb); //-2.4.js';
	    });
	});
    });
}


/*
WG.PopupLabel = function(tip)
{
    let istart, iend, name;

    //compound?
    istart = tip.indexOf("<b>Compound</b>");
    if (istart != -1) {
	istart += 16;
	iend = tip.indexOf("<br>", istart);
	if (iend == -1)
	    iend = tip.length;
	name = tip.substring(istart, iend);
	return name;
    }

    //rxn ID?
    istart = tip.indexOf("<b>ID</b>:");
    if (istart != -1) {
	istart += 11;
	iend = tip.indexOf("<br>", istart);
	if (iend == -1)
	    iend = tip.length;
	name = tip.substring(istart, iend);
	return name;
    }

    return "???";
}
*/

WG.PwyOmicsTooltip = function(divId, label, nodeIdx) 
{
    //console.log("WG.PwyOmicsTooltip", divId, nodeIdx);

    var div = document.getElementById(divId+'-loaded');
    if (div == null || !div.wg) {
	console.log("WG.PwyOmicsTooltip: can not locate div", divId);
	return null;
    }

    //locate nodeId
    var wg = div.wg;
    for(let n = 0; n < wg.links.length; n++) {
	var 
	tooltip = wg.links[n],
	id = tooltip[0],
	url = tooltip[1],
	x1 = tooltip[2],
	y1 = tooltip[3],
	x2 = tooltip[4],
	y2 = tooltip[5],
	tip = tooltip[6],
	l = x2 - x1,
	h = y2 - y1;

	x1 += wg.boundingBox.left;
	y1 += wg.boundingBox.top;
	x2 += wg.boundingBox.left;
	y2 += wg.boundingBox.top;

	if (id == nodeIdx) {
	    let popup = new YAHOO.widget.SimpleDialog("popup" + WG.tooltip.popupCount++,
						      {
							  zindex: 99,
							  width: "250px"
						      });

	    let header  = document.createElement('span');
	    header.innerHTML = "<span>" + label + "</span>";
	    popup.setHeader(header);
	    popup.render(document.body);

	    popup.nodePt = {
		x: (x1+x2)/2,
		y: (y1+y2)/2
	    };
	    popup.tipOffset = {
		x: 20,
		y: 30
	    };

	    popup.wg = wg;
	    popup.link = wg.links[n];
	    popup.visible = true;
	    wg.popup.push(popup);

	    popup.subscribe("destroy", function()
			    {
				console.log("destroy")
			    });

	    popup.subscribe("hide", function()
			    {
				console.log("hide")
				popup.visible = false;
				WG.DrawPopupConnections();
			    });

	    popup.subscribe("drag", function (type, args)
			    {
				WG.dragState = args[0];
				WG.wgactive = popup.wg;				
				switch(args[0]) {
				case 'onDrag':
				    break;
				case "startDrag":
				    if (popup.wg && popup.visible == true) {
					popup.visible = false;
					WG.DrawPopupConnections();//popup.wg);
					popup.visible = true;				
				    }
				    break;
				case "endDrag":
				    const rect = wg.canvas.getBoundingClientRect();
				    let tipPx = { 
					x: popup.element.offsetLeft - (rect.left + window.scrollX),
					y: popup.element.offsetTop - (rect.top + window.scrollY)
				    };
				    //node pixep
				    let nodePx = {
					x: (popup.nodePt.x - wg.x0) * wg.scaleCanvas,
					y: (popup.nodePt.y - wg.y0) * wg.scaleCanvas
				    }
				    popup.tipOffset.x = tipPx.x - nodePx.x;
				    popup.tipOffset.y = tipPx.y - nodePx.y;
				    popup.dragging = false;				    
				    WG.DrawPopupConnections();
				    
				    break;
				}
			    });

	    popup.subscribe("enter", function (type, args)
		    {
			console.log("Enter", type, args[0][0], args[0][1]);
		    });
	    WG.DrawPopupConnections();
	    return popup;
	}
    }

    console.log("WG.PwyOmicsTooltip: can not nodeIdx", nodeIdx);
    return null;
};

WG.DrawPopupConnections = function()
{
    if (!WG.ovCanvas)
	return;
    
    let xoff = window.pageXOffset || document.documentElement.scrollLeft;
    let yoff = window.pageYOffset || document.documentElement.scrollTop;
    //console.log("scroll", xoff, yoff, window.scrollX, window.scrollY);

    let ctx = WG.ovCanvas.getContext("2d");

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;

    let w = WG.ovCanvas.width;
    let h = WG.ovCanvas.height;
    ctx.clearRect(0,0,w,h);

    for(let n = 0; n < WG.wglist.length; n++) {
	let wg = WG.wglist[n];
	if (wg.active == false)
	    continue;
	for(let p = 0; p < wg.popup.length; p++) {
	    let popup = wg.popup[p];
	    if (popup.wg != wg ||
		popup.visible == false)
		continue;
	    
	    let nodePt = popup.nodePt;
	    let offset = popup.tipOffset;
	    let tipPt = {
		x: nodePt.x + offset.x / wg.scaleCanvas,
		y: nodePt.y + offset.y / wg.scaleCanvas
	    };

	    const rect = wg.canvas.getBoundingClientRect();

	    let tipPx = {
		x: (tipPt.x - wg.x0) * wg.scaleCanvas + rect.left + window.scrollX,
		y: (tipPt.y - wg.y0) * wg.scaleCanvas + rect.top + window.scrollY
	    };

	    if (tipPx.x != popup.element.offsetLeft ||
		tipPx.y != popup.element.offsetTop) {
		//console.log("move popup", popup.id);
		popup.moveTo(tipPx.x, tipPx.y);
	    }

	    if (popup.visible == true) {
		let x1 = (nodePt.x - wg.x0) * wg.scaleCanvas;
		let y1 = (nodePt.y - wg.y0) * wg.scaleCanvas;
		let x2 = (tipPt.x - wg.x0) * wg.scaleCanvas;
		let y2 = (tipPt.y - wg.y0) * wg.scaleCanvas;

		x1 += rect.left + xoff;
		y1 += rect.top + yoff;
		x2 += rect.left + xoff;
		y2 += rect.top + yoff;
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
	    }
	}
    }
};

WG.OnLoad = function()
{
    console.log("WebGraphics version ", WG.Version);

    WG.InitOverlay();

    if (WG.pageOnLoad)
	WG.pageOnLoad();
    WG.pageOnLoad = null;
    WG.pageLoaded = true;
};

WG.OmicsChartsRefresh = function(wg)
{
    for(let p = 0; p < WG.tooltip.popups.length; p++) {
	let popup = WG.tooltip.popups[p];
	if (popup.btnState == 'omics') {
	    OmicsTooltipHandler(popup.tip, popup);
	}
    }
    WG.omicsChartsHacked = false;
};

WG.OmicsChartsHack = function(wg)
{
    for(let p = 0; p < WG.tooltip.popups.length; p++) {
	let popup = WG.tooltip.popups[p];
	if (popup.btnState == 'omics') {
	    for(let c = 0; c < popup.body.children[0].children.length; c++) {
		let g = popup.body
		    .children[0]
		    .children[c]
		    .children[0]
		    .children[0]
		    .children[0]
		    .children[0]
		    .children[2]
		    .children[1]
		    .children[1];
		let td = popup.body.children[0].children[c].children[0].getElementsByTagName('td')
		for(let r = 0; r < g.children.length; r++) {
		    let rect = g.children[r];
		    if (rect.nodeName == "rect") {
			let value = td[r*2+1].innerText;
			value = Number(value.replace(',', ''));
			let color = WG.OmicsValueToColor(value);
			rect.setAttribute('stroke', color);
			rect.setAttribute('fill', color);
			rect.style.fill = color;
			WG.omicsChartsHacked = true;
		    }
		}
	    }
	}
    }
};

WG.RescaleToViewPort = function(wg)
{
    var w = wg.boundingBox.right - wg.boundingBox.left;
    var h = wg.boundingBox.bottom - wg.boundingBox.top;
    var maxW = window.innerWidth - 50;
    var maxH = window.innerHeight;// - 100;
    if (wg.autoRescale == "scaletoparentwidthorviewport")
      maxW = Math.min(maxW, wg.canvas.parentElement.clientWidth - 50);
    var sx = maxW / w;
    var sy = maxH / h;
    var s = Math.min(sx, sy);
    s = Math.min(s, 1);
    wg.scaleCanvas = s;
    console.log("PWY resize", s, 'w', wg.width, w, sx, maxW, 'h', wg.height, h, sy,maxH);
    wg.canvas.style.width = maxW + "px";
    wg.canvas.style.height = Math.min(h+20, maxH) + "px";
    WG.Resize(wg, w * s, h * s);
    WG.Draw(wg);

    setTimeout(function() {
	WG.Resize(wg, wg.canvas.clientWidth, wg.canvas.clientHeight);
	WG.Draw(wg);
    },100);
    
    return;
};
    
WG.RescaleToParent = function(wg, maxscale)
{
    console.log("rescale to parent", wg);
    if (!maxscale)
	maxscale = 1;
    
    let div = wg.canvas.parentElement;

    var w = wg.boundingBox.right - wg.boundingBox.left;
    var h = wg.boundingBox.bottom - wg.boundingBox.top;
    let sx = div.clientWidth / w;
    let sy = div.clientHeight / h;
    let s = Math.min(sx, sy);
    s = Math.min(s, maxscale);
    let tx = Math.min(0, w/2 * s - div.clientWidth / 2);
    let ty = Math.min(0, h/2 * s - div.clientHeight / 2);
//    wg.canvas.style.width = w*s + "px";
//    wg.canvas.style.height = h*s + "px";
    console.log("tx", tx, w, w*s, div.clientWidth, sx, s);
    console.log("ty", ty, h, h*s, div.clientHeight, sy, s);
    wg.canvas.style.position = "relative";
    if (tx < 0)
	wg.canvas.style.left = -tx + "px";
    if (ty < 0)
	wg.canvas.style.top = -ty + "px";
    wg.scaleCanvas = s;
    WG.Resize(wg, wg.canvas.clientWidth, wg.canvas.clientHeight);
    WG.Draw(wg);
};


WG.PrintDraw = function(wg)
{
    var x0 = 3.5;
    var y0 = 3.5;
    wg.ctx.save();
    wg.ctx.setTransform(1, 0, 0, 1, 0, 0);
    wg.ctx.scale(wg.scaleDevice, wg.scaleDevice);
    wg.ctx.translate(.5, .5);
    
    wg.printRect = {x: x0, y: y0, w: WG.icon.print.width, l: WG.icon.print.height};
    wg.ctx.drawImage(WG.icon.print, x0, y0);

    if (WG.jnEnable) {
	x0 += 20;
	wg.jupyterRect = {x: x0, y: y0, w: WG.icon.jupyter.width, l: WG.icon.jupyter.height};
	wg.ctx.drawImage(WG.icon.jupyter, x0, y0);
    }
    
    wg.ctx.restore();
    return;
};

WG.PrintOnClick = function(wg, px)
{
    var rect = wg.printRect;
    var scale = wg.scaleDevice;
    if (!rect ||
	px.x < rect.x ||
	px.y < rect.y ||
	px.x > rect.x + rect.w*scale ||
	px.y > rect.y + rect.l*scale)
	return false;

    var width = wg.boundingBox.right - wg.boundingBox.left;
    var height = wg.boundingBox.bottom - wg.boundingBox.top;
    width = (width > screen.width/2) ? screen.width : width+600;
    height = screen.height;
    var options = "left=0, top=0, width=" +  width + ", height=" + height;    
    
    var url = "wg2pdf.html?wg=" + wg.filename;
    if (location.host != 'localhost')
	url = "/" + url;

    if (wg.highlightList) {
	var highlights = JSON.stringify(wg.highlightList);
	highlights = encodeURIComponent(highlights);
	console.log(highlights.length);
	url += "&highlight=" + highlights;
    }	
    console.log(options, width, height, scale, wg.filename, url);
    window.open(url, wg.filename, options);
}

WG.JupyterOnClick = function(wg, px)
{
    var rect = wg.jupyterRect;
    var scale = wg.scaleDevice;
    if (!rect ||
	px.x < rect.x ||
	px.y < rect.y ||
	px.x > rect.x + rect.w*scale ||
	px.y > rect.y + rect.l*scale)
	return false;

    console.log("save Jupyter");
    WG.SaveSnapshot(wg);
    return true;
}

WG.SaveSnapshot = async function(wg)
{
    /*start here. push
      canvas: canvas#canvas-testdiv
      ctx: CanvasRenderingContext2D {getTransform: ƒ, save: ƒ, restore: ƒ, scale: ƒ, rotate: ƒ, …}
      div: div#testdiv-loaded
      popup:
      push level, remove dyn fields above, save, restore
    */
    return;
    
    let filename = wg.filename;
    let semzoom = wg.semzoom;
    let highlights = wg.highlightList;
    let snap = {
	x0: 0,//wg.x0,
	y0: 0,//wg.y0,
	scaleDevice: wg.scaleDevice,	
	scaleCanvas: wg.scaleCanvas
    };

    if (semzoom) {
	snap.semzoom = [],
	snap.omicsData = omicsData;

	console.log(semzoom);
	for(let l =0; l < semzoom.length; l++) {
	    console.log(l, semzoom[l]);
	    snap.semzoom[l] = {
		orgId: semzoom[l].orgId,
		scaleFactor: semzoom[l].scaleFactor,
		tipsFile: semzoom[l].scaleFactor,
	    };
	    filename = semzoom[l].ordId;
	}
	return;
    } else {
	let wgfile = await WG.FetchJSON(filename);
	if (!wgfile)
	    return;
	
	var wg = new WG.Wg(wgfile)
	wg.filename = filename
	wg.highlightList = highlights;
	snap.wg = wg;
    }

    //console.log("high", wg.highlightList, highlights);
    //console.log(snap, snap.wg.highlightList);
    filename = filename.split("/");
    filename = filename[filename.length-1];
    filename = filename.replace(".wg", ".wgsnap");
    snap = JSON.stringify(snap);
    saveFile(snap, filename);
};

WG.LoadSnapshot = function(evt, div)
{
    var file = evt.currentTarget.files[0];
    console.log(file, div);
    const reader = new FileReader();
    reader.onabort = () => console.log('file reading was aborted');
    reader.onerror = () => console.log('file reading has failed');

    reader.onload = function() {
	var snap = reader.result;
	if (!snap)
	    return;
	var snap = JSON.parse(snap);
	var wgfile = snap.wgfile;
	console.log(wgfile);

	var canvases = div.querySelectorAll('canvas');
	for(var canvas of canvases)
	    canvas.remove();

	div.id += "-loaded";
	WG.wglist = [];

	console.log('snap', snap);
	var wg = snap.wg;
	let highlights = wg.highlistList;
	console.log(highlights);
	wg.highlightList = [];
	WG.Init(wg, div, null);
	WG.wgactive = wg;
	wg.active = true;
	setTimeout(function() {
	    switch(wg.autoRescale.toLowerCase()) {
	    case "scaletoviewport":
	    case "scaletoparentwidthorviewport":
		WG.RescaleToViewPort(wg);
		break;
	    case "scaletoparent":
		WG.RescaleToParent(wg);
		break;
	    default:
		WG.Resize(wg, wg.width, wg.height);
		WG.Draw(wg);
	    }

	    if (Array.isArray(highlights)) {
		console.log(highlights);
		for(var highlight of highlights) {
		    console.log(highlight);
		    WG.HighlightList(highlight[0], highlight[1], highlight[2]);
		}
	    }

	    if (snap.omicsData) {
		console.log("LoadOmics", snap.omicsData);
//		animateOmics(snap.omicsData, initCelOverview);
	    }
	    
	}, 50);
    };
    
    reader.readAsText(file);
};

WG.Save = function(wg)
{
    var state = {
	filename: wg.filename,
	scaleDevice: wg.scaleDevice,
	scaleCanvas: wg.scaleCanvas,
	canvasWidth: wg.canvas.clientWidth,
	canvasHeight: wg.canvas.clientHeight,
	dx: wg.translate.x,
	dy: wg.translate.y,
	wx: window.scrollX,
	wy: window.scrollY,
    };
    state = JSON.stringify(state);
    localStorage.setItem("wg", state);
    console.log(wg);
}

WG.Restore = function(wg)
{
    var state = localStorage.getItem("wg");
    if (state)
	state = JSON.parse(state);

    console.log("restore", state, wg, wg.ctx);
    wg.scaleDevice = state.scaleDevice;
    wg.scaleCanvas = state.scaleCanvas;
    WG.Resize(wg, state.canvasWidth, state.canavsHeight);
    WG.Draw(wg);

    window.scrollTo(state.wx, state.wy);
}


//initialize
window.addEventListener("scroll", WG.OnScroll.bind(WG), false);
window.addEventListener("resize", WG.OnResize.bind(WG), false);
window.addEventListener("load", WG.OnLoad.bind(WG), false);
    
