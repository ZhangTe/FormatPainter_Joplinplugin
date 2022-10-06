/**
 * this is a codemirror plugin for joplin editor.
 * https://github.com/ZhangTe/joplin-plugin-format-painter
 * 
 * Author: T.Zhang
 * 2022-5 in Tianjin.
 */

/**
 * codemirror(api) document reference
 */
var cm = null; 

/**
 * code mirror api: https://codemirror.net/doc/manual.html
 * code mirror on github: https://github.com/codemirror/codemirror
 * this codemirror plugin is used as a template: https://github.com/laurent22/joplin/tree/80b16dd17e227e3f538aa221d7b6cc2d81688e72/packages/app-cli/tests/support/plugins/codemirror_content_script
 * @param {CodeMirror} CodeMirror 
 * @param {*} _context send message to the controller.
 */
function plugin(CodeMirror, _context) {
    /**
     * flag shows whether the painter is toggled, or to say, the eventhandler 'mouse click' is setup in the editor.
     */
    var listeneradded = false;
    /**
     * toggle format painter is the function which can switch up the painter.
     */
    CodeMirror.defineExtension('toggleFormatPainter', 
    /**
     * initializing the painter with joplin command.
     * @param {string} fore keyword
     * @param {string} end keyword
     * @param {boolean} enable to tell the plugin toggle on/off
     */
    function( fore, end, enable ) {
        cm = this;
        if (!listeneradded && enable){
            /**
             * use the native js event-handler to implement the click listener
             * ?? I haven't found out how to use a codemirror api to do this. ??
             */
            document.addEventListener('mouseup', mouseup_);
            fore_ = fore;
            end_ = end;
            listeneradded = true;
        }
        else if ( !enable ){
            document.removeEventListener('mouseup', mouseup_);
            listeneradded = false;
        }
    });
    /**
     * Get SELection command can quickly set the fore and end words by sending a message to
     * the controller, once the controller send a request to this plugin.
     */
    CodeMirror.defineExtension('getSel', 
    /**
     * let the plugin know which keyword does the controller want, fore or end
     * @param {boolean} isEnd when true:the controller need to update the end word, when false: the fore word
     */
    function( isEnd ){ 
        var sele = getSelection() + '';
        var name_ = 'getSel_' + (isEnd?'r':'l');
        var res = {name:name_, key:sele};
        _context.postMessage(res);

    });

}
/**
 * the keyword fore
 */
var fore_ = '';
/**
 * the keyword end
 */
var end_ = '';

function Stringequal (string1, string2){
    if (string1 === string2 ) return true;
    else return false;
}

/**
 * Get a new cursor from the given one and a moving step.
 * @param {Cursor} cursor {line,ch}
 * @param {integer} step 
 * @returns {Cursor}
 */
function moveCursor(cursor, step) {
    var line_ = cursor.line;
    var lineLen = cm.getLine(line_).length;
    var ch_ = cursor.ch + step;
    if(ch_ <= lineLen && ch_ >= 0 ){
        return {line:line_, ch:ch_}
    }
    else if ( ch_ > lineLen ) {
        if(line_ >= cm.lineCount() - 1){
            return {line:line_, ch:lineLen}
        }
        else return moveCursor({line:line_+1,ch:0}, ch_ - lineLen - 1);
    }
    else {
        if(line_ < 1){
            return {line:0, ch:0}
        }
        else {
            var prevlineLen = cm.getLine(line_-1).length;
            return moveCursor({line:line_-1,ch:prevlineLen}, ch_ + 1);
        }
    }
}

/**
 * Compare two cursor to determine which one is behind.
 * get true if cursor 1 is NOT BEFORE cursor 2.
 * @param {Cursor} cur1 
 * @param {Cursor} cur2 
 * @returns {boolean}
 */
function cursorOver(cur1, cur2){
    return (cur1.line == cur2.line && cur1.ch >= cur2.ch) || (cur1.line > cur2.line) ;
}

function mouseup_(eventarg){

    // console.log('selection output');
    // console.log(cm.listSelections());
    if (cm.somethingSelected()) {
        
        var cursorL = cm.getCursor('from');
        var cursorR = cm.getCursor('to');
        trim(cursorL,cursorR);
    }
}


/**
 * To trim the keywords in the selected string paragraph
 * if there is multiple keywords in the selection, this will delete them by fore-end pair, 
 * until it is all cleared or only one side keyword left.
 * if there is nothing found, this will wrap the text with the keywords.
 * @param {Cursor} cursorL 
 * @param {Cursor} cursorR 
 * @returns 
 */
function trim(cursorL, cursorR){
    /**store the positions of the fore and end words shown up */ 
    var curs = [];

    var headislonger = fore_.length > end_.length;
    /**max length of the fore and end words */
    
    var startOffset = (headislonger)?fore_.length:end_.length;
    /**store the start position of searching */
    var curStart  = moveCursor(cursorL, -startOffset); 
    /**the iterator of cursor for searching */
    var curIter = curStart; 
    /**the select anchor cursor for iterating */ 
    var curSel   = cursorL; 
    /**store the original selection head */
    var stringhead = null;  
    /**store the original selection end */
    var stringend = null;  
    /**count of the times fore and end strings shown up in the selected string */
    var i = 0,j = 0;


    var tmpcursor;
    if( !Stringequal(fore_, end_) ) {
        var keys = [];
        keys.push({key:headislonger?fore_:end_,count:new Array()});
        keys.push({key:headislonger?end_:fore_,count:new Array()});
        //console.log('keys');
        //console.log(keys);
        do{
            tmpcursor = curIter;
            if (  stringhead==null && cursorOver(curIter,cursorL) ) stringhead = curIter;
            

            var keyhit = false;

            keys.forEach((key_) => {
                if (keyhit) return;
                curSel = moveCursor(curIter, key_.key.length);
                if (cursorOver(curSel,cursorL)){
                    cm.setSelection(curIter,curSel);
                    if(Stringequal(cm.getSelection(),key_.key)){
                        curs.push({head:curIter,end:curSel});
                        key_.count.push(curIter);
                        curIter = moveCursor(curIter, key_.key.length);
                        keyhit = true;
                        //console.log('hit');
                        //console.log(cm.getSelection());
                        return;
                    }
                }
            });
            stringend = curIter;
			
            if (!keyhit)  curIter = moveCursor(curIter,1)
            
            
        }while(cursorOver(cursorR,curIter) && !cursorOver(tmpcursor,curIter));
		//console.log(keys);
        console.log('keys after processing');
        console.log(keys);
        i = headislonger?keys[0].count.length:keys[1].count.length;
        j = headislonger?keys[1].count.length:keys[0].count.length;
        if ( i == j && i > 0 ) {
            i = 1;
            j = 1;
        }
        else if ( i > j ) {
            i = i - j;
            j = 0;
        }
        else if ( i < j ) {
            j = j - i;
            i = 0;
        } 
    
    }
    else {
        do  {
            tmpcursor = curIter;
            curSel = moveCursor(curIter, fore_.length);
            cm.setSelection(curIter,curSel);
            if (  stringhead==null && cursorOver(curIter,cursorL) ) stringhead = curIter;
            
            if(Stringequal(cm.getSelection(),fore_)){
                curs.push({head:curIter,end:curSel});
                j++;
                curIter = moveCursor(curIter, fore_.length);
                continue;
            }
            stringend = curIter;
            curIter = moveCursor(curIter,1)
        }while(cursorOver(cursorR,curIter) && !cursorOver(tmpcursor,curIter));
        i = Math.floor(j / 2);
        j = j - i;
    }

    if(stringhead!=null)
        cm.setSelection(stringhead);
    
    cm.addSelection(stringend);
    curs.forEach(function (select) {
        cm.addSelection(select.end, select.head);
    });
    console.log('ij:' + i + ' ' + j)

    var replace = [];
    if(cm.listSelections().length < 2 ) {
        if ( i == 0 && j == 0 ) {
            cm.replaceSelections(['']);
            return;
        }
        else {
            var countcat   = (i > j)?i:j;
            var replacetxt = (i > j)?fore_:end_;
            var cat        = '';
            for ( var m = 0; m < countcat; m++ ){
                cat += replacetxt;
            }
            replace.push(cat);
            cm.replaceSelections(replace);
            return;
        }
    }

    var replace = [];
    var cat     = '';
    if ( i == 0 && j == 0 ) {
        replace.push(fore_);
        replace.push(end_);
    }
    else if ( i == 1 && j == 1 ) {
        for (var m = 0; m < 2; m++) {
            replace.push('');
        }
    }
    else {
        var countcat   = (i > j)?i:j;
        var replacetxt = (i > j)?fore_:end_;
        var cat        = '';
        for ( var m = 0; m < countcat; m++ ){
            cat += replacetxt;
        }
        replace.push((i>j)?cat:'');
        
    }

    for (var m = 0 ; m < cm.listSelections().length - 2; m++ ) {
        replace.push('');
    }
    replace.push((i<j)?cat:'')
    cm.replaceSelections(replace, 'around');
}

function borderModeTrim(){
    if (cm.somethingSelected()) {
        var cursorL = cm.getCursor('from');
        var cursorR = cm.getCursor('to');
        var leftAlreadyExist = false;
        var rightAlreadyExist = false;
        var txt = cm.getSelection();
        
        var cursorLL = moveCursor(cursorL, -fore_.length);
       
        var cursorRR =  moveCursor(cursorR, end_.length);
        cm.setSelection(cursorL, cursorLL);
        if (Stringequal ( cm.getSelection(), fore_ )) {
            leftAlreadyExist = true;
        }
        
        cm.setSelection(cursorRR, cursorR);
        if (Stringequal ( cm.getSelection(), end_ )) {
            rightAlreadyExist = true;
        }
        if( !rightAlreadyExist && !leftAlreadyExist ) {
            cm.setSelection(cursorR, cursorL);
            cm.replaceSelection(fore_ + txt + end_ );
            /* //another implementation
            cm.setSelection(cursorR);
            cm.addSelection(cursorL);
            cm.replaceSelections([fore_ ,end_ ]);
            cm.setCursor(cursorL);*/
            
        }
        else if ( rightAlreadyExist && leftAlreadyExist ) {
            cm.setSelection(cursorRR, cursorR);
            cm.addSelection(cursorL, cursorLL);
            cm.replaceSelections(['','']);
        }
        else {
        }
        cm.setCursor(cursorLL);
    }
}

module.exports = {
    default: function(_context) { 
        return {
            plugin: function(CodeMirror) {
				return plugin(CodeMirror, _context);
			}
        }
    }
}