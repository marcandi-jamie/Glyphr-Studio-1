// "use strict";
function GlyphrProject(){

	// Default settings for new Glyphr Projects

	this.projectsettings = {
		"name": "My Font",			// project name (can be different than font names)
		"version": 0,				// console version
		"versionnum": 0,			// console number version
		"linkedshapecounter": 0,	// private counter for ss id
		"charrange": {				// canned and custom Unicode ranges
			"basiclatin": true,
			"latinsuppliment": false,
			"latinextendeda": false,
			"latinextendedb": false,
			"custom": [],
			"filternoncharpoints": true
		},

		// Grid stuff
		"upm": 1000,			// Units Per Em - (emsize) how tall normal cap letters are
		"ascent": 700,			// ascender
		"xheight": 400,			// lowercase letter height
		"linegap": 250,			// distance between lines
		"griddivisions": 10,	// how many squares of grid per emsize
		"overshoot": 10,		// overshoot for round glyphs
		"defaultlsb": 10,		// default left space

		// UI stuff
		"pointsize" : 5,						// path point square size
		"spinnervaluechange" : 1,				// how much spinner controls change a value
		"showkeyboardtipsicon" : true,			// button for keyboard tips on edit canvas
		"stoppagenavigation" : true,			// asks to save on window close or refresh
		"formatsavefile" : false,				// makes the JSON save file readable
		"showoutline" : false,					// outline shapes when drawing
		"showfill" : true,						// fill shapes when drawing
		"color_glyphfill" : "rgb(0,0,0)",		// shape base color
		"color_glyphoutline" : "rgb(0,0,0)",	// shape outline color
		"color_grid" : "rgb(240,240,240)",		// grid base color
		"color_os_guideline" : "rgb(204,79,34)",// OS guide base color
		"guidelines" : [],						// user-defined guidelines
		"snaptogrid" : false,					// snap to gridlines
		"snaptoguides" : false					// snap to guidelines
	};

	this.opentypeproperties = {
		"head" : [
			{"key": "created", "val": "" },
			{"key": "fontRevision", "val": "1.0" }
		],
		"os_2": [
			{"key": "usWeightClass", "val": "500"},
			{"key": "usWidthClass", "val": "5"}
		],
		"name": [
			{"key": "Copyright notice", "val": ("Copyright " + new Date().getFullYear())},
			{"key": "Font Family name", "val": "My Font"},
			{"key": "Font Subfamily name", "val": ""},
			{"key": "Unique font identifier", "val": "My Font 1.0"},
			{"key": "Full Font name", "val": "My Font"},
			{"key": "Version string", "val": "Version 1.0"},
			{"key": "Postscript name", "val": "My Font"},
			null,
			{"key": "Manufacturer name", "val": ""},
			{"key": "Designer name", "val": ""},
			{"key": "Description", "val": ""},
			{"key": "Vendor URL", "val": ""},
			{"key": "Designer URL", "val": ""},
			{"key": "License Description", "val": "Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)"},
			{"key": "License URL", "val": "http://creativecommons.org/licenses/by-sa/3.0/"}
		],
		"post": [
			{"key": "italicAngle", "val": "0.0"},
			{"key": "underlinePosition", "val": "-75"},
			{"key": "underlineThickness", "val": "50"}
		],
		"cff": [
			{"key": "Notice", "val": ""},
			{"key": "FullName", "val": "My Font"},
			{"key": "FamilyName", "val": "My Font"},
			{"key": "Weight", "val": "500"},
		]
	};

	this.fontchars = {};

	this.linkedshapes = {};
}

function saveGlyphrProjectFile(){
	// debug("SAVEGLYPHRPROJECTVILE");
	// debug("\t " + _GP.projectsettings.formatsavefile);
	var jsonString;

	if(_GP.projectsettings.formatsavefile){
		// debug("\t Fancy Save Formatting");
		jsonString = JSON.stringify(_GP, undefined, '\t');
		jsonString = jsonString.replace(/\n/g, '\r\n');
	} else {
		// debug("\t Regular Formatting");
		jsonString = JSON.stringify(_GP);
	}

	//debug("saveGlyphrProjectFile - \n"+jsonString);
	var fblob = new Blob([jsonString], {"type":"text/plain;charset=utf-8", "endings":"native"});
	var fname =  _GP.projectsettings.name + " - Glyphr Project - " + genDateStampSuffix() + ".txt";

	saveTextFile(fname, fblob);

	setProjectAsSaved();
}

function genDateStampSuffix(){
	var d = new Date();
	var yr = d.getFullYear();
	var mo = d.getMonth()+1;
	var day = d.getDate();
	var hr = d.getHours();
	var min = (d.getMinutes()<10? "0" : "") + d.getMinutes();
	var sec = (d.getSeconds()<10? "0" : "") + d.getSeconds();

	return (""+yr+"."+mo+"."+day+"-"+hr+"."+min+"."+sec);
}
