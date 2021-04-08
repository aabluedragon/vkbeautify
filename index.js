/**
* vkBeautify - javascript plugin to pretty-print or minify text in XML, JSON, CSS and SQL formats.
*
* Copyright (c) 2012 Vadim Kiryukhin
* vkiryukhin @ gmail.com
* http://www.eslinstructor.net/vkbeautify/
*
* Dual licensed under the MIT and GPL licenses:
*   http://www.opensource.org/licenses/mit-license.php
*   http://www.gnu.org/licenses/gpl.html
*
*   Pretty print
*
*        vkbeautify.xml(input_text [,indent_pattern]);
*        vkbeautify.json(input_text [,indent_pattern]);
*        vkbeautify.css(input_text [,indent_pattern]);
*        vkbeautify.sql(input_text [,indent_pattern]);
*
*        @input_text - String; text to beatufy;
*        @indent_pattern - Integer | String;
*                Integer:  number of white spaces;
*                String:   character string to visualize indentation ( can also be a set of white spaces )
*   Minify
*
*        vkbeautify.xmlmin(input_text [,preserve_comments]);
*        vkbeautify.jsonmin(input_text);
*        vkbeautify.cssmin(input_text [,preserve_comments]);
*        vkbeautify.sqlmin(input_text);
*
*        @input_text - String; text to minify;
*        @preserve_comments - Bool; [optional];
*                Set this flag to true to prevent removing comments from @text ( minxml and mincss functions only. )
*
*   Examples:
*        vkbeautify.xml(input_text); // pretty print XML
*        vkbeautify.json(input_text, 4 ); // pretty print JSON
*        vkbeautify.css(input_text, '. . . .'); // pretty print CSS
*        vkbeautify.sql(input_text, '----'); // pretty print SQL
*
*        vkbeautify.xmlmin(input_text, true);// minify XML, preserve comments
*        vkbeautify.jsonmin(input_text);// minify JSON
*        vkbeautify.cssmin(input_text);// minify CSS, remove comments ( default )
*        vkbeautify.sqlmin(input_text);// minify SQL
*
*/
function createShiftArr(step) {

  // 4 spaces
	var space = '    ';

	if ( isNaN(parseInt(step)) ) {  // argument is string
		space = step;
	} else { // argument is integer
		space = ' '.repeat(step);
	}

	var shift = ['\n']; // array of shifts
	for(var ix=0;ix<100;ix++) {
		shift.push(shift[ix]+space);
	}
	return shift;
}

function vkbeautify(){
	this.step = '    '; // 4 spaces
	this.shift = createShiftArr(this.step);
};

vkbeautify.prototype.xml = function(input_text,step) {

	var ar = input_text.replace(/>\s{0,}</g,"><")
				 .replace(/</g,"~::~<")
				 .replace(/\s*xmlns\:/g,"~::~xmlns:")
				 .replace(/\s*xmlns\=/g,"~::~xmlns=")
				 .split('~::~'),
		len = ar.length,
		inComment = false,
		deep = 0,
		str = '',
		ix = 0,
		shift = step ? createShiftArr(step) : this.shift;

		for(ix=0;ix<len;ix++) {
			// start comment or <![CDATA[...]]> or <!DOCTYPE //
			if(ar[ix].search(/<!/) > -1) {
				str += shift[deep]+ar[ix];
				inComment = true;
				// end comment  or <![CDATA[...]]> //
				if(ar[ix].search(/-->/) > -1 || ar[ix].search(/\]>/) > -1 || ar[ix].search(/!DOCTYPE/) > -1 ) {
					inComment = false;
				}
			} else
			// end comment  or <![CDATA[...]]> //
			if(ar[ix].search(/-->/) > -1 || ar[ix].search(/\]>/) > -1) {
				str += ar[ix];
				inComment = false;
			} else
			// <elm></elm> //
			if( /^<\w/.exec(ar[ix-1]) && /^<\/\w/.exec(ar[ix]) &&
				/^<[\w:\-\.\,]+/.exec(ar[ix-1]) == /^<\/[\w:\-\.\,]+/.exec(ar[ix])[0].replace('/','')) {
				str += ar[ix];
				if(!inComment) deep--;
			} else
			 // <elm> //
			if(ar[ix].search(/<\w/) > -1 && ar[ix].search(/<\//) == -1 && ar[ix].search(/\/>/) == -1 ) {
				str = !inComment ? str += shift[deep++]+ar[ix] : str += ar[ix];
			} else
			 // <elm>...</elm> //
			if(ar[ix].search(/<\w/) > -1 && ar[ix].search(/<\//) > -1) {
				str = !inComment ? str += shift[deep]+ar[ix] : str += ar[ix];
			} else
			// </elm> //
			if(ar[ix].search(/<\//) > -1) {
				str = !inComment ? str += shift[--deep]+ar[ix] : str += ar[ix];
			} else
			// <elm/> //
			if(ar[ix].search(/\/>/) > -1 ) {
				str = !inComment ? str += shift[deep]+ar[ix] : str += ar[ix];
			} else
			// <? xml ... ?> //
			if(ar[ix].search(/<\?/) > -1) {
				str += shift[deep]+ar[ix];
			} else
			// xmlns //
			if( ar[ix].search(/xmlns\:/) > -1  || ar[ix].search(/xmlns\=/) > -1) {
				str += shift[deep]+ar[ix];
			}

			else {
				str += ar[ix];
			}
		}

	return  (str[0] == '\n') ? str.slice(1) : str;
}

vkbeautify.prototype.json = function(input_text,step) {

	var step = step ? step : this.step;

	if (typeof JSON === 'undefined' ) return input_text;

	if ( typeof input_text === "string" ) return JSON.stringify(JSON.parse(input_text), null, step);

	if ( typeof input_text === "object" ) return JSON.stringify(input_text, null, step);

	return input_text; // text is not string nor object
}

vkbeautify.prototype.css = function(input_text, step) {

	var ar = input_text.replace(/\s{1,}/g,' ')
				.replace(/\{/g,"{~::~")
				.replace(/\}/g,"~::~}~::~")
				.replace(/\;/g,";~::~")
				.replace(/\/\*/g,"~::~/*")
				.replace(/\*\//g,"*/~::~")
				.replace(/~::~\s{0,}~::~/g,"~::~")
				.split('~::~'),
		len = ar.length,
		deep = 0,
		str = '',
		ix = 0,
		shift = step ? createShiftArr(step) : this.shift;

		for(ix=0;ix<len;ix++) {

			if( /\{/.exec(ar[ix]))  {
				str += shift[deep++]+ar[ix];
			} else
			if( /\}/.exec(ar[ix]))  {
				str += shift[--deep]+ar[ix];
			} else
			if( /\*\\/.exec(ar[ix]))  {
				str += shift[deep]+ar[ix];
			}
			else {
				str += shift[deep]+ar[ix];
			}
		}
		return str.replace(/^\n{1,}/,'');
}

//----------------------------------------------------------------------------

function isSubquery(input_text, parenthesisLevel) {
	return  parenthesisLevel - (input_text.replace(/\(/g,'').length - input_text.replace(/\)/g,'').length )
}

function split_sql(input_text, tab) {

	return input_text
    // Condense spaces to 1 space
    .replace(/\s{1,}/g," ")

		.replace(/ AND /ig,"~::~"+tab+tab+"AND ")
		.replace(/ BETWEEN /ig,"~::~"+tab+"BETWEEN ")
		.replace(/ CASE /ig,"~::~"+tab+"CASE ")
		.replace(/ ELSE /ig,"~::~"+tab+"ELSE ")
		.replace(/ END /ig,"~::~"+tab+"END ")
		.replace(/ FROM /ig,"~::~FROM ")
		.replace(/ GROUP\s{1,}BY/ig,"~::~GROUP BY ")
		.replace(/ HAVING /ig,"~::~HAVING ")
		//.replace(/ SET /ig," SET~::~")
		.replace(/ IN /ig," IN ")

		.replace(/ JOIN /ig,"~::~JOIN ")
		.replace(/ CROSS~::~{1,}JOIN /ig,"~::~CROSS JOIN ")
		.replace(/ INNER~::~{1,}JOIN /ig,"~::~INNER JOIN ")
		.replace(/ LEFT~::~{1,}JOIN /ig,"~::~LEFT JOIN ")
		.replace(/ RIGHT~::~{1,}JOIN /ig,"~::~RIGHT JOIN ")

		.replace(/ ON /ig,"~::~"+tab+"ON ")
		.replace(/ OR /ig,"~::~"+tab+tab+"OR ")
		.replace(/ ORDER\s{1,}BY/ig,"~::~ORDER BY ")
		.replace(/ OVER /ig,"~::~"+tab+"OVER ")

		.replace(/\(\s{0,}SELECT /ig,"~::~(SELECT ")
		.replace(/\)\s{0,}SELECT /ig,")~::~SELECT ")

		.replace(/ THEN /ig," THEN~::~"+tab+"")
		.replace(/ UNION /ig,"~::~UNION~::~")
		.replace(/ USING /ig,"~::~USING ")
		.replace(/ WHEN /ig,"~::~"+tab+"WHEN ")
		.replace(/ WHERE /ig,"~::~WHERE ")
		.replace(/ WITH /ig,"~::~WITH ")

		//.replace(/\,\s{0,}\(/ig,",~::~( ")
		//.replace(/\,/ig,",~::~"+tab+tab+"")

		.replace(/ ALL /ig," ALL ")
		.replace(/ AS /ig," AS ")
		.replace(/ ASC /ig," ASC ")
		.replace(/ DESC /ig," DESC ")
		.replace(/ DISTINCT /ig," DISTINCT ")
		.replace(/ EXISTS /ig," EXISTS ")
		.replace(/ NOT /ig," NOT ")
		.replace(/ NULL /ig," NULL ")
		.replace(/ LIKE /ig," LIKE ")
		.replace(/\s{0,}SELECT /ig,"SELECT ")
		.replace(/\s{0,}UPDATE /ig,"UPDATE ")
		.replace(/ SET /ig," SET ")

		.replace(/~::~{1,}/g,"~::~")
		.split('~::~');
}

vkbeautify.prototype.sql = function(input_text,step) {

	var ar_by_quote = input_text.replace(/\s{1,}/g," ")
							.replace(/\'/ig,"~::~\'")
							.split('~::~'),
		len = ar_by_quote.length,
		ar = [],
		deep = 0,
		tab = this.step,//+this.step,
		inComment = true,
		inQuote = false,
		parenthesisLevel = 0,
		str = '',
		ix = 0,
		shift = step ? createShiftArr(step) : this.shift;;

		for(ix=0;ix<len;ix++) {
			if(ix%2) {
				ar = ar.concat(ar_by_quote[ix]);
			} else {
				ar = ar.concat(split_sql(ar_by_quote[ix], tab) );
			}
		}

		len = ar.length;
		for(ix=0;ix<len;ix++) {

			parenthesisLevel = isSubquery(ar[ix], parenthesisLevel);

			if( /\s{0,}\s{0,}SELECT\s{0,}/.exec(ar[ix]))  {
				ar[ix] = ar[ix].replace(/\,/g,",\n"+tab+tab+"")
			}

			if( /\s{0,}\s{0,}SET\s{0,}/.exec(ar[ix]))  {
				ar[ix] = ar[ix].replace(/\,/g,",\n"+tab+tab+"")
			}

			if( /\s{0,}\(\s{0,}SELECT\s{0,}/.exec(ar[ix]))  {
				deep++;
				str += shift[deep]+ar[ix];
			} else
			if( /\'/.exec(ar[ix]) )  {
				if(parenthesisLevel<1 && deep) {
					deep--;
				}
				str += ar[ix];
			}
			else  {
				str += shift[deep]+ar[ix];
				if(parenthesisLevel<1 && deep) {
					deep--;
				}
			}
			var junk = 0;
		}

		str = str.replace(/^\n{1,}/,'').replace(/\n{1,}/g,"\n");
		return str;
}

vkbeautify.prototype.xmlmin = function(input_text, preserveComments) {

	var str = preserveComments ? input_text
							   : input_text.replace(/\<![ \r\n\t]*(--([^\-]|[\r\n]|-[^\-])*--[ \r\n\t]*)\>/g,"")
									 .replace(/[ \r\n\t]{1,}xmlns/g, ' xmlns');
	return  str.replace(/>\s{0,}</g,"><");
}

vkbeautify.prototype.jsonmin = function(input_text) {

	if (typeof JSON === 'undefined' ) return input_text;

	return JSON.stringify(JSON.parse(input_text), null, 0);

}

vkbeautify.prototype.cssmin = function(input_text, preserveComments) {

	var str = preserveComments ? input_text
							   : input_text.replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g,"") ;

	return str.replace(/\s{1,}/g,' ')
			  .replace(/\{\s{1,}/g,"{")
			  .replace(/\}\s{1,}/g,"}")
			  .replace(/\;\s{1,}/g,";")
			  .replace(/\/\*\s{1,}/g,"/*")
			  .replace(/\*\/\s{1,}/g,"*/");
}

vkbeautify.prototype.sqlmin = function(input_text) {
	return input_text.replace(/\s{1,}/g," ").replace(/\s{1,}\(/,"(").replace(/\s{1,}\)/,")");
}

module.exports = new vkbeautify();
