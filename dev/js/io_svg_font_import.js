// start of file

//	--------------------------
//	Import SVG Font
//	--------------------------
	function ioSVG_importSVGfont (svgdata) {
		debug('ioSVG_importSVGfont \t Start');
		_GP = new GlyphrProject();

		// Convert unicode characters to decimal values
		// DOM Parser does not return unicode values as text strings
		// Kern groups containing '&#x' will get fuck'd
		svgdata = svgdata.replace(/&#x/g, '0x');

		var jsondata;
		try {
			jsondata = convertXMLtoJSON(svgdata);
		} catch (e){
			//errormessage(e.message);
			return;
		}

		debug('\t imported json data:');
		debug(jsondata);

		var font = ioSVG_getFirstTagInstance(jsondata, 'font');
		debug('\t font data:');
		debug(font);

		/*
		*	Cases to consider
		*	-----------------
		*	needs scaling
		*	unicode included but no path or children
		*	unicode outside of known ranges
		*		and provides a name
		*		provides no name
		*	unicode spanning known ranges
		*/

		var chars = ioSVG_getTags(font, 'glyph');
		var tc, data, uni, cname, chtml, adv, isautowide;
		var maxchar = 0;
		var minchar = 0xffff;
		var customcharrange = [];
		var shapecounter = 0;
		var newshapes = [];
		var fc = {};
		var fl = {};
		
		//saveTextFile('chardump.txt', json(chars));

		for(var c=0; c<chars.length; c++){ try {
			// One Char or Ligature in the font
			tc = chars[c];

			// Get the appropriate unicode decimal for this char
			// debug('\n\t GLYPH starting  unicode \t' + tc.attributes.unicode);
			uni = parseUnicodeInput(tc.attributes.unicode);
			// debug('\t GLYPH ' + c + '/'+chars.length+'\t unicode: ' + JSON.stringify(uni) + '\t name: ' + tc.attributes['glyph-name']);

			if(uni === false){
				// Check for .notdef
				// debug('\t !!! Skipping <GLYPH> '+tc.attributes['glyph-name']+' with no Unicode ID !!!');
				chars.splice(c, 1);
			} else if (uni.length > 1 || uni[0] <= _UI.charrange.latinextendedb.end){

				/*
				*
				*	CHARACTER OR LIGATURE IMPORT
				*
				*/
				newshapes = [];
				shapecounter = 0;

				// Import Path Data
				data = tc.attributes.d;
				// debug('\t Character has path data ' + data);
				if(data){
					// Compound Paths are treated as different Glyphr Shapes
					data.replace(/Z/g,'z');
					data = data.split('z');

					for(var d=0; d<data.length; d++){
						if(data[d].length){
							newshapes.push(ioSVG_convertPathTag(data[d]));
							shapecounter++;
							newshapes[newshapes.length-1].name = ('SVG Path ' + shapecounter);
						}
					}
				}

				// Get Advance Width
				isautowide = true;
				adv = parseInt(tc.attributes['horiz-adv-x']);
				if(adv){
					if(!isNaN(adv) && adv > 0){
						isautowide = false;
						/*
							GLYPHR charwidth !== horiz-adv-x
						*/
					}
				} else adv = false;


				if(uni.length === 1){
					// It's a CHAR
					// Get some range data
					uni = uni[0];
					minchar = Math.min(minchar, uni);
					maxchar = Math.max(maxchar, uni);
					if(1*uni > _UI.charrange.latinextendedb.end) customcharrange.push(uni);

					fc[uni] = new Char({'charshapes':newshapes, 'charhex':uni, 'charwidth':adv, 'isautowide':isautowide});

				} else {
					// It's a LIGATURE
					uni = uni.join('');
					fl[uni] = new Char({'charshapes':newshapes, 'charhex':uni, 'charwidth':adv, 'isautowide':isautowide});
				}
			}
		} catch(e){
			return {'char':tc, 'kern':false};
		}}

		// Enable applicable built-in char ranges
		debug('\t Done with Char Import');
		debug('\t Char range: ' + minchar + ' to ' + maxchar);

		// var rstart, rend;
		for(var r in _UI.charrange){
			if(_UI.charrange.hasOwnProperty(r)){
				rstart = 1*_UI.charrange[r].begin;
				rend = 1*_UI.charrange[r].end+1;
				for(var t=rstart; t<rend; t++){
					if(getChar(t)){
						_GP.projectsettings.charrange[r] = true;
						break;
					}
				}
			}
		}

		// Make a custom range for the rest
		if(customcharrange.length){
			customcharrange = customcharrange.sort();
			_GP.projectsettings.charrange.custom.push({'begin':customcharrange[0], 'end':customcharrange[customcharrange.length-1]});
		}


		/*
		*
		*	KERN IMPORT
		*
		*/
		var kerns = ioSVG_getTags(font, 'hkern');
		var tk, tempgroup, reg, leftgroup, rightgroup, newid;
		var fk = {};
		for(var k=0; k<kerns.length; k++){ try {
			leftgroup = [];
			rightgroup = [];
			tk = kerns[k];

			// Get members by name
			leftgroup = getKernMembersByName(tk.attributes.g1, chars, _UI.charrange.latinextendedb.end);
			rightgroup = getKernMembersByName(tk.attributes.g2, chars, _UI.charrange.latinextendedb.end);

			// Get members by Unicode
			leftgroup = leftgroup.concat(getKernMembersByUnicodeID(tk.attributes.u1, chars, _UI.charrange.latinextendedb.end));
			rightgroup = rightgroup.concat(getKernMembersByUnicodeID(tk.attributes.u2, chars, _UI.charrange.latinextendedb.end));

			if(leftgroup.length && rigthgroup.length){
				newid = generateNewID(fk, 'kern');
				kernval = tk.attributes.k || 0;
				fk[newid] = new HKern({'leftgroup':leftgroup, 'rightgroup':rightgroup, 'value':kernval});
			}

		} catch(e) {
			return {'char':false, 'kern':tk};
		}}

		debug('\t Done with Kern Import');


		/*
		*
		*	FINALIZE
		*
		*/

		// Import Font Settings
		// Check to make sure certain stuff is there
		// space has horiz-adv-x

		_GP.fontchars = fc;
		_GP.ligatures = fl;
		_GP.kerning = fk;

		finalizeGlyphrProject();
		return true;
	}


	function getKernMembersByName(names, chars, limit) {
		limit = limit || 0xFFFF;
		var re = [];
		var uni;
		if(names){
			names = names.split(',');

			// Check all the character names
			for(var n=0; n<names.length; n++){

				// Check all the chars
				for(var c=0; c<chars.length; c++){
					if(chars[c].attributes.unicode){

						// Push the match
						if(names[n] === chars[c].attributes['glyph-name']){
							uni = parseUnicodeInput(chars[c].attributes.unicode);
							if(1*uni < limit) re.push(uni);
						}
					}
				}
			}
		}

		return re;
	}

	function getKernMembersByUnicodeID(ids, chars, limit) {
		limit = limit || 0xFFFF;
		var re = [];
		var uni;
		if(ids){
			ids = ids.split(',');

			// Check all the IDs
			for(var i=0; i<ids.length; i++){
			
				// Check all the chars
				for(var c=0; c<chars.length; c++){
					if(chars[c].attributes.unicode){

						// Push the match
						if(ids[i] === chars[c].attributes.unicode){
							uni = parseUnicodeInput(chars[c].attributes.unicode);
							if(1*uni < limit) re.push(uni);
						}
					}
				}
			}
		}

		return re;
	}

// end of file