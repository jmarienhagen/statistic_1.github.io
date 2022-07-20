/**************************************************
Trivantis (http://www.trivantis.com)
**************************************************/

/* 
** If you want to enable a Debug Window that will show you status
** and debugging information for your HTML published content, 
** copy the file "trivantisdebug.html" from your Support Files directory
** (typically C:\Program Files\Trivantis\(Product Name)\Support Files
** and place in the root folder of your published content (next to this file)
** and then change the value of the trivDebug variable from 0 to 1
** (don't forget to save the modified file).
**
*/

var trivDebug      = 0;
var bDisplayErr    = true;
var trivAddMsgFunc = null;
var trivDebugWnd   = '';
var trivSaveMsg    = '';
var trivProtected  = false;
var trivWeb20Popups  = false;
var trivDynXMLfilePath = '';
var fOpacity = 100.0;

//Fill Styles : These values need to be kept in sync with typedef ShpFillInfo in ShapeUtils.h
var FILL_SOLID = 0;
var FILL_LINEARGRAD = 1;
var FILL_RADIALGRAD = 2;
var FILL_TEXTURE = 3;
var FILL_PICTURE = 4;


if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, ''); 
  }
}

function trivLogMsg( msg, level ) {
  if( level != null )
  {
    if( !(trivDebug & level )) return;
  }
  else if( !trivDebug ) return;
  var topWnd = findTrivLogMsg( window, true );
  if( topWnd.trivDebug ) {
    if( topWnd.trivDebugWnd && !topWnd.trivDebugWnd.closed && topWnd.trivDebugWnd.location )  {
      if( msg ) {
        if( topWnd.trivSaveMsg.length ) topWnd.trivSaveMsg += '<br />';
        topWnd.trivSaveMsg += msg;
      }
      if( topWnd.trivAddMsgFunc ) {
        msg = topWnd.trivSaveMsg;
        topWnd.trivSaveMsg = '';
        topWnd.trivAddMsgFunc( msg );
      }
    }
    else {
      topWnd.trivSaveMsg    = msg;
      topWnd.trivDebugWnd   = topWnd.open( 'trivantisdebug.html', 'TrivantisDebug', 'width=400,height=400,scrollbars=0,resizable=1,menubar=0,toolbar=0,location=0,status=0' )
      if( topWnd.trivDebugWnd ) {
        topWnd.trivDebugWnd.focus()
        setTimeout( "trivLogMsg()", 1000 );
      }
    }
  }
}

function findTrivLogMsg( win, bCheckOpener ) {

   if( bCheckOpener && win.opener && win.opener.trivLogMsg ) {
     return findTrivLogMsg( win.opener, false )
   }
   
   while( win ) {
     if( win.parent && win.parent != win && win.parent.trivLogMsg ) win = win.parent;
     else break;
   }
   return win;
}

function ObjLayer(id,pref,frame) {
  if (!ObjLayer.bInit && !frame) InitObjLayers()
  this.frame = frame || self
  if (is.ns) {
    if (is.ns5) {
      this.ele = this.event = document.getElementById(id)
      this.styObj = this.ele.style
    }
  }
  else if (is.ie) {
    this.ele = this.event = this.frame.document.all[id]
    this.styObj = this.frame.document.all[id].style
  }
  this.doc = document;
  this.reflectDiv = null;
  this.relfectObj = null;
  this.shadowObj =  null;
  this.shadowProp = null;
  this.x = this.ele.offsetLeft;
  this.y = this.ele.offsetTop;
  this.w = this.ele.offsetWidth;
  this.h = this.ele.offsetHeight;
	
  if( this.styObj ) this.styObj.visibility = "hidden"
  this.id = id
  this.unique = 1;
  this.pref = pref
  this.obj = id + "ObjLayer"
  eval(this.obj + "=this")
  this.hasMoved = false;
  this.newX = null;
  this.newY = null;
  this.theObj = null;
  this.theObjTag = null;
  this.objDiv = null;
  this.eTran = -1;
}

function ObjLayerMoveTo(x,y) {
  if (x!=null) {
	var origX = this.x;
    this.x = x
	if(this.theObj)
		if(typeof this.theObj.validateSrc == 'function')
			this.theObj.validateSrc();
		
    if( this.styObj ) this.styObj.left = this.x + 'px';
	if(this.reflectDiv) 
	{
		if(this.theObj)
		{
			var xDiff = this.x-origX;
			this.theObj.reflectedImageX = this.theObj.reflectedImageX + xDiff;
			this.reflectDiv.style.left = this.theObj.reflectedImageX + 'px';
		}			
	}
  }
  if (y!=null) {
	var origY = this.y;
    this.y = y
	if(this.reflectDiv)
	{
		if(this.theObj)
		{
			var yDiff = this.y-origY;
			this.theObj.reflectedImageY = this.theObj.reflectedImageY + yDiff;
			this.reflectDiv.style.top = this.theObj.reflectedImageY + 'px';
		}
	}
    if( this.styObj ) this.styObj.top = this.y + 'px';
  }
  
  // Fly transitions or other moves off-page can produce a scrollbar.
  // currently objects moved off the page still maintain their view, this
  // causes a scrollbar to be shown on the page, if a user wants the object
  // to be hidden as soon as it leaves the page dimensions they can set the
  // following line in an external HTML object, header scripting:
  // window.trivHideOffPageObjects=true;
  //
  if (window.trivHideOffPageObjects)
  {
	  // hide it when it's outside the page div
	  var pageDiv = document.getElementById('pageDIV');
	  var pageWidth = Math.max(pageDiv["clientWidth"],pageDiv["offsetWidth"]);
	  var pageHeight = Math.max(pageDiv["clientHeight"],pageDiv["offsetHeight"]);
	  this.styObj.display= ( 0 > (this.x+this.w) || pageWidth < this.x || 0 > (this.y+this.h) || pageHeight < this.y ) ? 'none' : '';  
  }
}

function ObjLayerMoveBy(x,y) {
  this.moveTo(Number(this.x)+Number(x),Number(this.y)+Number(y))
}

function ObjLayerClipInit(t,r,b,l) {
  if (arguments.length==4) 
	this.clipTo(t,r,b,l)
  else if(this.ele.offsetWidth <=0 ||  this.ele.offsetHeight<=0 || this.theObj)
  {
	if(this.theObj)
	{
		var effectAdjX = 0;
		var effectAdjY = 0;
		var effectAdjW = (typeof(this.ele.offsetWidth) == 'undefined' || this.ele.offsetWidth <=0)?this.theObj.w:this.ele.offsetWidth;
		var effectAdjH = (typeof(this.ele.offsetHeight) == 'undefined' || this.ele.offsetHeight<=0)?this.theObj.h:this.ele.offsetHeight;;
		
		if(this.theObj.name.indexOf("text") > -1) //TXT Obj Adj
		{
			var xOffset = 0;
			var yOffset = 0;
			var hOffset = 0;
			var wOffset = 0;
			if(this.theObj.hasOuterShadow > 0)
			{
				var outerRadians = (this.theObj.outerShadowDirection + this.theObj.r) * (Math.PI / 180.0);
				var xOuterOffset = this.theObj.outerShadowDepth * Math.cos(outerRadians);
				//Multiply by -1 because a negative offset means this shadow is in the positive y-direction on the screen
				var yOuterOffset = -1 * this.theObj.outerShadowDepth * Math.sin(outerRadians);

				xOffset = parseFloat(xOuterOffset.toFixed(5));
				yOffset = parseFloat(yOuterOffset.toFixed(5));
				xOffset += (((xOffset<0)?-2:2)*this.theObj.outerShadowBlurRadius);
				yOffset += (((yOffset<0)?-2:2)*this.theObj.outerShadowBlurRadius);
				hOffset = Math.abs(yOffset);
				wOffset = Math.abs(xOffset);
			}
			if(this.theObj.hasTextShadow > 0)
			{
				var textRadians = (this.theObj.textShadowDirection + this.theObj.r) * (Math.PI / 180.0);
				var xTextOffset = this.theObj.textShadowDepth * Math.cos(textRadians);
				//Multiply by -1 because a negative offset means this shadow is in the positive y-direction on the screen
				var yTextOffset = -1 * this.theObj.textShadowDepth * Math.sin(textRadians);
				
				if(xOffset !=0) //Has other effect
				{
					if(xOffset>0)
					{
						xOffset = parseFloat(xTextOffset.toFixed(5));
						xOffset += (((xOffset<0)?-2:2)*this.theObj.textShadowBlurRadius);
						if(xOffset <0 || wOffset < xOffset)
							wOffset +=(Math.abs(Math.abs(xOffset)-wOffset));//Add difference
					}
					else
					{
						if(xOffset > parseFloat(xTextOffset.toFixed(5)))
						{
							xOffset = parseFloat(xTextOffset.toFixed(5));
							xOffset += (((xOffset<0)?-2:2)*this.theObj.textShadowBlurRadius);
							wOffset = Math.abs(xOffset);
						}
					}
				}
				else
				{
					xOffset = parseFloat(xTextOffset.toFixed(5));
					xOffset += (((xOffset<0)?-2:2)*this.theObj.textShadowBlurRadius);
					wOffset = Math.abs(xOffset);
				}
				if(yOffset !=0)
				{
					if(yOffset>0)
					{
						yOffset = parseFloat(yTextOffset.toFixed(5));
						yOffset += (((yOffset<0)?-2:2)*this.theObj.textShadowBlurRadius);
						if(yOffset <0 || hOffset < yOffset)
							hOffset +=(Math.abs(Math.abs(yOffset)-hOffset));//Add difference
					}
					else
					{
						if(yOffset > parseFloat(yTextOffset.toFixed(5)))
						{
							yOffset = parseFloat(yTextOffset.toFixed(5));
							yOffset += (((yOffset<0)?-2:2)*this.theObj.textShadowBlurRadius);
							hOffset = Math.abs(yOffset);
						}
					}
				}
				else
				{
					yOffset = parseFloat(yTextOffset.toFixed(5));
					yOffset += (((yOffset<0)?-2:2)*this.theObj.textShadowBlurRadius);
					hOffset = Math.abs(yOffset);
				}
			}
			effectAdjX = ((xOffset<0)?xOffset:0);
			effectAdjY = ((yOffset<0)?yOffset:0);
			effectAdjW += wOffset;
			effectAdjH += hOffset;	
		}
		else //OtherObjAdjust
		{
			var xOffset = 0;
			var yOffset = 0;
			var hOffset = 0;
			var wOffset = 0;
			if(this.theObj.hasOuterShadow > 0)
			{
				var outerRadians = this.theObj.outerShadowDirection * (Math.PI / 180.0);
				var xOuterOffset = this.theObj.outerShadowDepth * Math.cos(outerRadians);
				//Multiply by -1 because a negative offset means this shadow is in the positive y-direction on the screen
				var yOuterOffset = -1 * this.theObj.outerShadowDepth * Math.sin(outerRadians);

				xOffset = parseFloat(xOuterOffset.toFixed(5));
				yOffset = parseFloat(yOuterOffset.toFixed(5));
				xOffset += (((xOffset<0)?-2:2)*this.theObj.outerShadowBlurRadius);
				yOffset += (((yOffset<0)?-2:2)*this.theObj.outerShadowBlurRadius);
				hOffset = Math.abs(yOffset);
				wOffset = Math.abs(xOffset);
			}
			else if(this.theObj.name.indexOf("button") >-1)
			{
				//BTN Adjustments
				effectAdjW += 5;
				effectAdjH += 2;	
			}
			effectAdjX = ((xOffset<0)?xOffset:0);
			effectAdjY = ((yOffset<0)?yOffset:0);
			effectAdjW += wOffset;
			effectAdjH += hOffset;	
		}
		this.clipTo(effectAdjY,effectAdjW,effectAdjH,effectAdjX)
	}
  }
  else
	this.clipTo(0,this.ele.offsetWidth,this.ele.offsetHeight,0)
}

function ObjLayerClipTo(t,r,b,l) {
  if( !this.styObj ) return;
  try{ this.styObj.clip = "rect("+t+"px "+r+"px "+b+"px "+l+"px)" } catch(e){}
}

function ObjLayerShowAudio(xPos){
	if(xPos && this.styObj){
		this.styObj.left = xPos.toString() + "px";
		this.styObj.visibility = "visible";  //echo LD-975: Move the audio object WAY off of the page if it's initially hidden. Always keep the flash window visible. 
											 //JB the audio can't be played in IE if it is not visible, and customers do this all the time.
	}
}

function ObjLayerHideAudio(){
  if( this.styObj ){ 
	this.styObj.left = "10000px";
	this.styObj.visibility = "visible";  //echo LD-975: Move the audio object WAY off of the page if it's initially hidden. Always keep the flash window visible. 
										 //JB the audio can't be played in IE if it is not visible, and customers do this all the time.
  }
}

function ObjLayerShow() {
  if( this.styObj ) 
  {
	this.styObj.visibility = "inherit";
	if(this.theObj && parseFloat(this.styObj.opacity) != parseFloat(this.theObj.opacity/100.0))
	{
		if(!(is.ie8 || is.ie9))
			this.styObj.opacity = this.theObj.opacity/100.0;
	}
  }
  if(this.reflectDiv) 
  {
	this.reflectDiv.style.visibility = "inherit";  
	
	if(this.eTran ==-1)
	{
		//echo bug 21701
		if(!(is.ie8 || is.ie9))
			this.reflectDiv.style.opacity = this.theObj.opacity/100.0;
	}
  }
}

function ObjLayerHide() {
  if( this.styObj ) this.styObj.visibility = "hidden";
  if(this.reflectDiv && this.eTran == -1) this.reflectDiv.style.visibility = "hidden";
}
var __Triv_GoToNextPage__ = "";//FPFP: BUG20811
function ObjLayerActionGoTo( destURL, destFrame, subFrame, bFeed ) {
  var targWind = null
  var bFeedback = bFeed != null ? bFeed : true
  if( destFrame ) {
    if( destFrame == "opener" ) targWind = parent.opener;
    else if( destFrame == "_top" ) targWind = eval( "parent" ) 
    else if(destFrame == "NewWindow" ) targWind = open( destURL, 'NewWindow' )
    else {
      var parWind = eval( "parent" )
      var index=0
      while( index < parWind.length ) {
        if( parWind.frames[index].name == destFrame ) {
          targWind = parWind.frames[index]
          break;
        }
        index++;
      }
      if( subFrame ) {
        index=0
        parWind = targWind
        while( index < parWind.length ) {
          if( parWind.frames[index].name == subFrame ) {
            targWind = parWind.frames[index]
            break;
          }
          index++;
        }
      }
      try
      {
        if( !targWind.closed && targWind.trivExitPage ) {
          targWind.trivExitPage( destURL, bFeedback )
          return
        }
      }catch(e){}      
    }
  }
  if( !targWind ) targWind = window
  try
  {
    if( !targWind.closed && __Triv_GoToNextPage__ != destURL) 
	{
		targWind.location.href = destURL;
		if( is.awesomium ) 
        {
            __Triv_GoToNextPage__ = destURL;
            if (destURL.indexOf("mailto:")==0)
            {
                 var mailDest = destURL + "?subject= " +"&body= ";
                 try{app.openFile(mailDest);}catch(e){}
            }
        }
		//if(console && console.log) console.log("ObjLayerActionGoTo: " + destURL + "\n");
	}
  }catch(e){
	__Triv_GoToNextPage__ = "";
  }      
}

function ObjLayerActionGoToNewWindow( destURL, name, props ) {
  var targWind
  if ((props.indexOf('left=') == -1) && (props.indexOf('top=') == -1)) props += GetNewWindXAndYPos( props );
  targWind = window.open( destURL, name, props, false )
  if( targWind ) targWind.focus()
  return targWind
}

function GetNewWindXAndYPos( props ) {
  var countOfW = 'width='.length
  var idxW = props.indexOf('width=');
  var wndW = GetMiddleString( props, countOfW + idxW, ',' )
  var countOfH = 'height='.length
  var idxH = props.indexOf('height=');
  var wndH = GetMiddleString( props, countOfH + idxH, ',' )  
  var wndX = (screen.width - wndW) / 2;
  var wndY = (screen.height - wndH) / 2;	
  return ',left=' + wndX + ',top=' + wndY;
}

function GetMiddleString( str, startIndex, endChar ) {
  var midStr = '';
  for (strIndex = startIndex; str.charAt(strIndex) != endChar; strIndex++) {
    midStr += str.charAt(strIndex);
  }  
  return midStr;
}

function ObjLayerActionPlay( ) {
}

function ObjLayerActionStop( ) {
}

function ObjLayerActionShow( ) {
    this.show();
}

function ObjLayerActionHide( ) {
    this.hide();
}

function ObjLayerActionShowAudio(xPos){
	this.showAudio(xPos);
}

function ObjLayerActionHideAudio() {
	this.hideAudio();
}

function ObjLayerActionLaunch( ) {
}

function ObjLayerActionExit( ) {
  if( this.frameElement && this.frameElement.id && this.frameElement.id.indexOf('DLG_content') == 0 )
    closeDialog();
  else
    window.top.close()
}

function ObjLayerActionChangeContents( ) {
}

function ObjLayerActionTogglePlay( ) {
}

function ObjLayerIsVisible() {
  if( !this.styObj || this.styObj.visibility == "hide" || this.styObj.visibility == "hidden" ) return false;
  else return true;
}

{ // Setup prototypes
var p=ObjLayer.prototype
p.moveTo = ObjLayerMoveTo
p.moveBy = ObjLayerMoveBy
p.clipInit = ObjLayerClipInit
p.clipTo = ObjLayerClipTo
p.show = ObjLayerShow
p.hide = ObjLayerHide
p.showAudio = ObjLayerShowAudio
p.hideAudio = ObjLayerHideAudio
p.actionGoTo = ObjLayerActionGoTo
p.actionGoToNewWindow = ObjLayerActionGoToNewWindow
p.actionPlay = ObjLayerActionPlay
p.actionStop = ObjLayerActionStop
p.actionShow = ObjLayerActionShow
p.actionHide = ObjLayerActionHide
p.actionShowAudio = ObjLayerActionShowAudio
p.actionHideAudio = ObjLayerActionHideAudio
p.actionLaunch = ObjLayerActionLaunch
p.actionExit = ObjLayerActionExit
p.actionChangeContents = ObjLayerActionChangeContents
p.actionTogglePlay = ObjLayerActionTogglePlay
p.isVisible = ObjLayerIsVisible
p.write = ObjLayerWrite
p.hackForNS4 = ObjLayerHackForNS4
p.getEle = ObjLayerGetElement
}

// InitObjLayers Function
function InitObjLayers(pref) {
  if (!ObjLayer.bInit) ObjLayer.bInit = true
  if (is.ns) {
    if (pref) ref = eval('document.'+pref+'.document')
    else {
      pref = ''
      if( is.ns5 ) {
        document.layers = document.getElementsByTagName("*")
        ref = document
      }
      else ref = document
    }
    for (var i=0; i<ref.layers.length; i++) {
      var divname
      if( is.ns5 ) {
        if( ref.layers[i] ) divname = ref.layers[i].tagName
        else divname = null
      }
      else divname = ref.layers[i].name
      if( divname ) {
        ObjLayer.arrPref[divname] = pref
        if (!is.ns5 && ref.layers[i].document.layers.length > 0) {
          ObjLayer.arrRef[ObjLayer.arrRef.length] = (pref=='')? ref.layers[i].name : pref+'.document.'+ref.layers[i].name
        }
      }
    }
    if (ObjLayer.arrRef.i < ObjLayer.arrRef.length) {
      InitObjLayers(ObjLayer.arrRef[ObjLayer.arrRef.i++])
    }
  }
  return true
}

ObjLayer.arrPref = new Array()
ObjLayer.arrRef = new Array()
ObjLayer.arrRef.i = 0
ObjLayer.bInit = false

function ObjLayerSlideEnd() {
  if (this.orgPos)
  {
	if( this.tTrans == 1 ) //LD-2088/LD-1043: if we are transitioning out, hide the object.
		this.hide();
	
	this.x = this.orgPos[0];
	this.ele.style.left = this.x+"px";
	this.y = this.orgPos[1];
	this.ele.style.top = this.y+"px";
	this.orgPos=0;
  }
  this.tTrans = -1;
}

function ObjLayerHackForNS4() {
  if( this.isVisible() )
  {
    this.hide()
    setTimeout( this.obj+".show()", 10 )
  }
}

function ObjLayerGetElement(tag){
	if(tag.indexOf("div") >-1)
	{
		if(this.isSVG)
		{
			return this.objDiv;
		}
		else
		{
			return this.ele;
		}
	}
	if(tag.indexOf("reflection") >-1)
	{
		return this.reflectDiv;
	}
}

function ObjLayerWrite(html) {
  this.event.innerHTML = html
}

function BrowserProps() {
  var name = navigator.appName
  var ua = navigator.userAgent.toLowerCase();
  
  if (name=="Netscape") name = "ns"
  else if (name=="Microsoft Internet Explorer") name = "ie"
  
  this.v = parseInt(navigator.appVersion,10)
  this.op = ua.indexOf("opera")!=-1
  this.ns = ((name=="ns" && this.v>=4)||this.op)
  this.ns4 = (this.ns && this.v==4)
  this.ns5 = ((this.ns && this.v==5)||this.op)
  this.nsMac = (this.ns && navigator.platform.indexOf("Mac") >= 0 )
  this.ie = (name=="ie" && this.v>=4)
  this.ie6 = (this.ie && navigator.appVersion.indexOf('MSIE 6')>0)
  if( this.ie ) this.v = parseInt( navigator.appVersion.substr( navigator.appVersion.indexOf('MSIE') + 5),10);
  this.quirksMode = (this.ie && document.documentMode == 5);
  this.ie8 = (this.ie && (document.documentMode == 8 || document.documentMode == 7 || document.documentMode == 6 || document.documentMode == 5));	//echo LD-774 : This is a bit of a hack but any document modes less than 8 will run through the same logic as IE8. 
  this.ie9 = (this.ie && document.documentMode == 9);
  this.ie9Native = (this.ie && navigator.userAgent.indexOf("MSIE 9.0") != -1 && navigator.userAgent.indexOf("Trident/5.0") != -1);
  this.ie10 = (this.ie && document.documentMode == 10);
  this.ie11 = (navigator.userAgent.indexOf("Trident") != -1);
  this.gecko = (ua.indexOf("gecko") != -1);
  this.firefox = (ua.indexOf("firefox") != -1);
  this.ieMac = (this.ie && navigator.platform.indexOf("Mac") >= 0 )
  this.min = (this.ns||this.ie)
  this.Mac = (navigator.platform.indexOf("Mac") >= 0)
  this.activeX = ( this.ie ) ? true : false; 
  this.wmpVersion = 6; // default version number we only support 7 and up
  if( ua.indexOf("iphone")!=-1 || ua.indexOf("ipod")!=-1 || ua.indexOf("ipad")!=-1 ) this.iOS = 1;
  else this.iOS = 0;
  this.chrome = ua.indexOf("chrome") != -1;
  this.webkit = ua.indexOf(" applewebkit/") != -1;
  this.safari = ( navigator.vendor && navigator.vendor.indexOf('Apple') >= 0 ? true : false );
  this.iOSSafari = (this.safari && this.iOS);
  this.android = ua.indexOf("android") != -1;
  this.awesomium = ua.indexOf("awesomium") != -1;
  this.ieAny = (this.ie || this.ie6 || this.ie8 || this.ie9 || this.ie9Native || this.ie10 || this.ie11)
  //For Responsive use
  this.clientProp = {orientation:"landscape", width:"1009", device:"Desktop"};
  this.jsonData = null;
  this.YTScriptLoaded = false;

  this.bSupportsClickMap = (!this.ie || // All non-IE browsers support click map
						   (!this.ie9 &&
							document.createElementNS != undefined &&
							document.createElementNS("http://www.w3.org/2000/svg", "path") &&
							document.createElement("BUTTON").addEventListener != undefined));

  //Barona Bug 21788 had to properly check IE11 for ActiveX
  if (this.ie8 || this.ie9) this.supportActiveX= window.ActiveXObject;
  else this.supportActiveX = (Object.getOwnPropertyDescriptor && Object.getOwnPropertyDescriptor(window, "ActiveXObject")) || ("ActiveXObject" in window);
  
  this.vml = IsVmlCheck(this.ie8 || this.ie9);
  this.svg = IsSvgCheck() && !this.vml;
  
  //echo LD-768 : Direct-X filters are disabled by default in IE10 and IE11 so they will not render legacy filters if we're running in a document mode of 8 or 9.
  this.DXFilterSupported = !(this.ie &&
							 (document.documentMode == 5 || document.documentMode == 6 || document.documentMode == 7 || document.documentMode == 8 || document.documentMode == 9) &&
							 (navigator.userAgent.indexOf("Trident/6.0") != -1 || navigator.userAgent.indexOf("Trident/7.0") != -1));
  
  var player = null;
  this.isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    AndroidNonTablet: function() {
        return this.Android() && navigator.userAgent.match(/Mobile/i) && !navigator.userAgent.match(/Kindle/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    iOSNonTablet: function() {
        return navigator.userAgent.match(/iPhone|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (this.Android() || this.BlackBerry() || this.iOS() || this.Opera() || this.Windows());
    },
    anyPhone: function() {
        return (this.AndroidNonTablet() || this.BlackBerry() || this.iOSNonTablet() || this.Opera() || this.Windows());
    }
};

  try 
  {
    if(window.ActiveXObject)
      player = new ActiveXObject("WMPlayer.OCX.7");
    else if (window.GeckoActiveXObject)
      player = new GeckoActiveXObject("WMPlayer.OCX.7");
    else
      player = navigator.mimeTypes["application/x-mplayer2"].enabledPlugin;		
  }
  catch(e)
  {
    // Handle error only if title has wmp-- no WMP control
 
  }
  
  if( player && player.versionInfo ) {
    this.wmpVersion = player.versionInfo.slice(0,player.versionInfo.indexOf('.'));
  }
	/*
	 * Use HTML5 if Flash is not present and browser is capable.
	 */
	this.useHTML5Video = function()
	{
		return ( !this.flashVersion(9,0,0) && supports_h264_baseline_video() ); 
	}
	this.useHTML5Audio = function()
	{
		return ( !this.flashVersion(9,0,0) && !!document.createElement('audio').canPlayType ); 
	}
	
	/*
	 * Flash detection
	 */
	var flashVer = -1;
	// When called with reqMajorVer, reqMinorVer, reqRevision returns t if that version or greater is available
	this.flashVersion = function (reqMajorVer, reqMinorVer, reqRevision)
	{
		if (flashVer == -1 ) 
		{
			var nav = navigator;

			// NS/Opera version >= 3 check for Flash plugin in plugin array

			if (nav.plugins != null && nav.plugins.length > 0) {
				if (nav.plugins["Shockwave Flash 2.0"] || nav.plugins["Shockwave Flash"]) {
					var swVer2 = nav.plugins["Shockwave Flash 2.0"] ? " 2.0" : "";
					var flashDescription = nav.plugins["Shockwave Flash" + swVer2].description;
					var descArray = flashDescription.split(" ");
					var tempArrayMajor = descArray[2].split(".");
					var versionMajor = tempArrayMajor[0];
					var versionMinor = tempArrayMajor[1];
					var versionRevision = descArray[3];
					if (versionRevision == "") {
						versionRevision = descArray[4];
					}
					if (versionRevision[0] == "d") {
						versionRevision = versionRevision.substring(1);
					} else if (versionRevision[0] == "r") {
						versionRevision = versionRevision.substring(1);
						if (versionRevision.indexOf("d") > 0) {
							versionRevision = versionRevision.substring(0, versionRevision.indexOf("d"));
						}
					}
					flashVer = versionMajor + "." + versionMinor + "." + versionRevision;
					//alert("flashVer="+flashVer);
				}
			}
			else if ( this.ie && !this.Mac && !this.op ) {

				var axo;
				// NOTE : new ActiveXObject(strFoo) throws an exception if strFoo isn't in the registry
				try {
					// version will be set for 7.X or greater players
					axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
					flashVer = axo.GetVariable("$version");
				} catch (e) {
				}

				if (!flashVer)
				{
					try {
						// version will be set for 6.X players only
						axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");

						// installed player is some revision of 6.0
						// GetVariable("$version") crashes for versions 6.0.22 through 6.0.29,
						// so we have to be careful.

						// default to the first public version
						flashVer = "WIN 6,0,21,0";

						// throws if AllowScripAccess does not exist (introduced in 6.0r47)
						axo.AllowScriptAccess = "always";

						// safe to call for 6.0r47 or greater
						flashVer = axo.GetVariable("$version");

					} catch (e) {
					}
				}
			}
		}
		
		if (flashVer == -1 ) {
			return false;
		} else if (flashVer != 0) {
			var versionArray;
			if(this.ie && !this.Mac && !this.op) {
				// Given "WIN 2,0,0,11"
				var tempArray     = flashVer.split(" "); 	// ["WIN", "2,0,0,11"]
				var tempString        = tempArray[1];			// "2,0,0,11"
				versionArray      = tempString.split(",");	// ['2', '0', '0', '11']
			} else {
				versionArray      = flashVer.split(".");
			}
			var versionMajor      = versionArray[0];
			var versionMinor      = versionArray[1];
			var versionRevision   = versionArray[2];

			// is the major.revision >= requested major.revision AND the minor version >= requested minor
			if (versionMajor > parseFloat(reqMajorVer)) {
				return true;
			} else if (versionMajor == parseFloat(reqMajorVer)) {
				if (versionMinor > parseFloat(reqMinorVer))
					return true;
				else if (versionMinor == parseFloat(reqMinorVer)) {
					if (versionRevision >= parseFloat(reqRevision))
						return true;
				}
			}
			return false;
		}
	};
	
	//Combining the two checks for HTML5
	this.useHTML5Media = (this.useHTML5Audio() || this.useHTML5Video());
	//WCAG Check
	this.bWCAG = ((document.head)?((document.head.innerHTML.indexOf("trivantis-focus.css")> -1)?true:false):((document.getElementsByTagName("head")[0].innerHTML.indexOf("trivantis-focus.css")> -1)?true:false));
}

is = new BrowserProps()

function getOrientation(){
	if( window && window.top ){
		try{
		return window.top.innerHeight >  window.top.innerWidth ? "portrait" : "landscape";
		}catch(e){
			if(e&&e.message)console.log( e.message );
			return self.innerHeight > self.innerWidth ? "portrait" : "landscape";
		}
	}else{
		return "";
	}
};
function getDevice(){
    return is.isMobile.anyPhone() ? "Phone" : is.isMobile.any() ? "Tablet" : "Desktop";
};
function getPhoneType(){
    return is.isMobile.Android() ? "Android " : 	(is.isMobile.iOS() ? "iOS " : 	(is.isMobile.Windows() ? "Windows " : 	(is.isMobile.BlackBerry() ? "BlackBerry " : "")));
};

function getScreenWidth()
{
	if(is.isMobile.any()){
		if(getOrientation() == "landscape") 
			return screen.height;
		else 
			return screen.width;
	}
	if (document.compatMode=='CSS1Compat')
	{
		if(document.body)		
			return  document.body.parentNode.clientWidth||document.documentElement.clientWidth||document.body.clientWidth||0;
		else if(window.innerWidth)
			return window.innerWidth || 0;
		else
			return screen.width;
	}
	else 
	{
		if(document.body)
			return document.body.clientWidth;
		else
			return screen.width;
	}
}
function getScreenHeight()
{
	if(is.isMobile.any()){
		if(getOrientation() == "landscape") 
			return screen.width;
		else 
			return screen.height;
	}
	if (document.compatMode=='CSS1Compat') 
	{
		if(document.body)
			return document.body.parentNode.clientHeight;
		else
			return screen.height;
	}
	else 
		return document.body.clientHeight;
}

function detect()
{
	if(is.awesomium && window.bTrivRunView )
	{
		try{
			var dispStr = app.getDisplaySize();
			eval(dispStr);
			return true;
		}
		catch(e)
		{
			return false;
		}
	 
	}
  
  is.clientProp.device = getDevice();
  if( is.isMobile.anyPhone())
  {
    if(getOrientation() == "portrait")
	{	
		if(window && window.TrivCurrRespView)TrivCurrRespView.set( "PhonePortrait" );
		
		is.clientProp.width = "480";
		is.clientProp.orientation = getOrientation();
	}
    else 
	{
		if(window && window.TrivCurrRespView)TrivCurrRespView.set( "PhoneLandscape" );
		
		is.clientProp.width = "785";
		is.clientProp.orientation = getOrientation();
	}
  }
  else if( is.isMobile.any())
  {
    if(getOrientation() == "portrait")
	{
		if(window && window.TrivCurrRespView)TrivCurrRespView.set( "TabletPortrait" );
		
		is.clientProp.width = "785";
		is.clientProp.orientation = getOrientation();
	}
    else
	{
		if(window && window.TrivCurrRespView)TrivCurrRespView.set( "TabletLandscape" );
		
		is.clientProp.width = "1009";
		is.clientProp.orientation = getOrientation();
	}
  }
  else
  {		
		is.clientProp.orientation = getOrientation();
	    if(getScreenWidth() <= 785)
		{
		   if(getOrientation() == "landscape")
		   {
			   is.clientProp.device = "Phone";
			   is.clientProp.width = "785";
			   
			   if(window && window.TrivCurrRespView)TrivCurrRespView.set( "PhoneLandscape" );
		   }
		   else if(getScreenWidth()  > 480 )
		   {
				
				is.clientProp.device = "Tablet";
				is.clientProp.width = "785";
				
				if(window && window.TrivCurrRespView)TrivCurrRespView.set( "TabletPortrait" );
		   } 
		   else if (getScreenWidth()  <= 480 )
		   {
			   is.clientProp.device = "Phone";
			   is.clientProp.width = "480";
			   
			   if(window && window.TrivCurrRespView)TrivCurrRespView.set( "PhonePortrait" );	  
		   }
		   else 
		   {			
				is.clientProp.device = "Desktop";
				is.clientProp.width ="1009";
				if(window && window.TrivCurrRespView)TrivCurrRespView.set( "Desktop" );
		   }
		}
		else if(getScreenWidth()  <= 1009 && getScreenWidth() > 785)
		{
			
		   if(getOrientation() == "landscape")
		   {
			  is.clientProp.device = "Tablet";
			  is.clientProp.width ="1009";
			  
			  if(window && window.TrivCurrRespView)TrivCurrRespView.set( "TabletLandscape" );
		   }
		   else
		   {
			  is.clientProp.device = "Tablet";
			  is.clientProp.width ="785";
			  
			  if(window && window.TrivCurrRespView)TrivCurrRespView.set( "TabletPortrait" );
		   }
			
		}
		else
		{
			is.clientProp.device = "Desktop";
			  is.clientProp.width ="1009";
			if(window && window.TrivCurrRespView)TrivCurrRespView.set( "Desktop" );
		}
		
		
		var desktopWidth =  getDesktopWidthFromJSON();
		if( is.clientProp.device != "Desktop" && 
			desktopWidth < is.clientProp.width )
		{
			is.clientProp.device = "Desktop";
		    is.clientProp.width ="1009";
			if(window && window.TrivCurrRespView)TrivCurrRespView.set( "Desktop" );
		}		
  }
  return true;
}


try{
    if(!is.ie8)
	{
	    window.top.addEventListener("resize", function() {changeSize();}, false);
	}
}catch(e){
	if(!is.ie8)
	{
	    window.addEventListener("resize", function() {changeSize();}, false);
	}
	if(e&&e.message)console.log( e.message );
}

function getDesktopWidthFromJSON()
{
	if(is.ie8) return 1009;
	
	if (!window.responsiveDataLoopCount )
		window.responsiveDataLoopCount=1;
	else
		window.responsiveDataLoopCount++;
	 
	 if ( window.responsiveDataLoopCount == 100 )
		alert("Responsive Data will not load");		 
	 else if(!is.jsonData)
	 {
		var strExec = "getDesktopWidthFromJSON()";
		setTimeout( strExec, 500 );
		return;
	 }
	var respValues = is.jsonData["Desktop"];
	var newValues;
	var obj;
	window.responsiveDataLoopCount=1;
	if(respValues)
	{	
		for(var key in respValues)
			newValues = respValues[key];
	}
	if(newValues)
	{
		obj = newValues["pageLayer"];
		if(obj)
			return obj.w;
	}
}


function rebuildLayout()
{
	if(is.ie8)
		return;
	
	//Check if the array exists
	if(window.bTrivResponsive)
	{
    	RestoreStyles();
        
		for (var index = 0; index < arObjs.length; index++)
		{
			arObjs[index].loadProps();
			arObjs[index].respChanges();
		}
		
		writeStyleSheets( arObjs );
		UpdateObjLayerValues();
		
		adjustResponsivePage();
	}
}

function changeSize()
{
	//LD-3217
	//Occasionally iOS has a null navigator when device rotating
	try{
		navigator.userAgent.length;
	}
	catch(e)
	{
		var strExec = "changeSize()";
		setTimeout(strExec, 100 );
		return;
		
	}
  if(is.ie8 || !window.bTrivResponsive )
	return;
  var previousDevice = is.clientProp.device;
  var previousOrientation = is.clientProp.orientation;
  if(!detect())
  {
	setTimeout(function(){changeSize();},100);
  }
	  
  if(previousDevice == is.clientProp.device && is.clientProp.device == "Desktop" )
	  return;
  if( previousDevice != is.clientProp.device || previousOrientation != is.clientProp.orientation )
  {
	rebuildLayout();
	try{ OnDeviceRotate(); }catch(e){ }
  }
  
}

function setDisplayType(display, width)
{
	is.clientProp.device = display;
	is.clientProp.width = width;
	rebuildLayout();
}

function loadResponsiveData()
{
	if(is.awesomium && window.bTrivRunView)
		return;
	
	detect();
	var json;
	var phonejson;
	var tabletjson;
	var fileToLoad;
	var pthName = window.location.pathname.split("/").pop();
	if(pthName == "")
		pthName = "index";
	else
		pthName = pthName.substring(0,pthName.lastIndexOf("."));
	
	if(getDevice() == "Desktop")
	{
			fileToLoad = "device_desktop/"+pthName+".js";
			json = document.createElement("script");
			json.type = "text/javascript";
			json.src = fileToLoad;
			var jsonObj = "DesktopResponsive";
			json.onreadystatechange = !is.ie?function(){saveResponsiveData("Desktop", eval(jsonObj));}:'';
			json.onload = function(){saveResponsiveData("Desktop", eval(jsonObj));};
			document.getElementsByTagName('head')[0].appendChild(json);
			
			fileToLoad = "device_phone/"+pthName+".js";
			phonejson = document.createElement("script");
			phonejson.type = "text/javascript";
			phonejson.src = fileToLoad;
			var jsonPhoneObj = "PhoneResponsive";
			phonejson.onreadystatechange = !is.ie?function(){saveResponsiveData("Phone", eval(jsonPhoneObj));}:'';
			phonejson.onload = function(){saveResponsiveData("Phone", eval(jsonPhoneObj));};
			document.getElementsByTagName('head')[0].appendChild(phonejson);
			
			fileToLoad = "device_tablet/"+pthName+".js";
			tabletjson = document.createElement("script");
			tabletjson.type = "text/javascript";
			tabletjson.src = fileToLoad;
			var jsonTabletObj = "TabletResponsive";
			tabletjson.onreadystatechange = !is.ie?function(){saveResponsiveData("Tablet", eval(jsonTabletObj));}:'';
			tabletjson.onload = function(){saveResponsiveData("Tablet", eval(jsonTabletObj));};
			document.getElementsByTagName('head')[0].appendChild(tabletjson);
	}
	else
	{
			fileToLoad = "device_"+is.clientProp.device.toLowerCase()+"/"+pthName+".js";
			json = document.createElement("script");
			json.type = "text/javascript";
			json.src = fileToLoad;
			var jsonObj = is.clientProp.device+"Responsive";
			json.onreadystatechange = !is.ie?function(){saveResponsiveData(is.clientProp.device, eval(jsonObj));}:'';
			json.onload = function(){saveResponsiveData(is.clientProp.device, eval(jsonObj));};
			document.getElementsByTagName('head')[0].appendChild(json);
	}
}

function saveResponsiveData(device, responseText)
{
	if(is.jsonData == null)
		is.jsonData = {};
	is.jsonData[device] = responseText;
}

function isInIframe( wndow , count )
{
	if (wndow.frameElement && wndow.frameElement.tagName.toLowerCase() == 'iframe')
		return true;
	else if (wndow.parent && count < 10)
		return isInIframe(wndow.parent, ++count);
	return false;
}

function adjustResponsivePage()
{
	if(is.jsonData != null)
	{
		var respValues = is.jsonData[is.clientProp.device];
		var newValues;
		newValues = respValues[is.clientProp.width];
		try{newValues.RCDResetQuestion();}catch(e){}
		var obj = newValues["pageLayer"];
		if(obj)
		{
			var newViewPort = "width="+obj.w;
						
			//For the case where we may have more than one viewport
			var currWindow = window;
			var titleManagerIndexWindow = (currWindow && currWindow.parent && currWindow.parent.bIsTitleManagerIndexFile) ? currWindow.parent : null;
			while( currWindow )
			{			
				var allViewPorts = currWindow.document.getElementsByName('viewport');
				for (var index = 0; index < allViewPorts.length; index++)
					allViewPorts[index].setAttribute('content',newViewPort);
				if(currWindow)
					currWindow.scrollTo(0,1);
				currWindow = titleManagerIndexWindow;
				titleManagerIndexWindow = null; //stop looping after this.
			}
			
			var styleTags = document.getElementsByTagName('head')[0].getElementsByTagName('style');
			var styleTag = null;

			for(var index = 0; index < styleTags.length; index++)
			{
				var styTag = styleTags[index];
				if(styTag.innerHTML.indexOf("body") > -1)
					styleTag = styTag;
			}
			//Object CSS exists
			if(styleTag)
			{
				ModifyBodyCSSForResponsive(styleTag, obj);
			}
			
			if(pageLayer)
			{
				pageLayer.ele.style.width = obj.w+'px';
				pageLayer.ele.style.height = obj.h+'px';
				if(!pageLayer.bInTrans)
					pageLayer.ele.style.clip = 'rect(0px,'+obj.w+'px,'+obj.h+'px,0px)';
				if(obj.bgImage)
				{
					document.body.style.backgroundImage = 'url()';
					pageLayer.ele.style.backgroundImage = 'url('+obj.bgImage+')';
				}
				else
				{
					document.body.style.backgroundImage = 'url()';
					pageLayer.ele.style.backgroundImage = 'url()';
				}
				if(obj.bgSize)
				{
					document.body.style.backgroundSize = obj.bgSize;
					pageLayer.ele.style.backgroundSize = obj.bgSize;
				}
				else
				{
					document.body.style.backgroundSize = '';
					pageLayer.ele.style.backgroundSize = '';
				}
				if(obj.bgRepeat)
				{
					if(obj.bgRepeat == 'repeat')
					{
						document.body.style.backgroundImage = 'url('+obj.bgImage+')';
						document.body.style.backgroundRepeat = obj.bgRepeat;
						pageLayer.ele.style.backgroundImage = 'url()';
						pageLayer.ele.style.backgroundRepeat = '';
					}
					else 
						pageLayer.ele.style.backgroundRepeat = obj.bgRepeat;
					
				}
				else
				{
					document.body.style.backgroundRepeat = '';
					pageLayer.ele.style.backgroundRepeat = '';
				}
				if(obj.bgColor)
					document.body.style.backgroundColor =obj.bgColor;
				else
					document.body.style.backgroundColor ='';
			}
		}
		try{newValues.RCDResultResize();}catch(e){}
	}
}

// CSS Function
function buildCSS(id,left,top,width,height,visible,zorder,color,other,sizeUnit) {
  var str = (left!=null && top!=null)? '#'+id+' {position:absolute;left:'+left+'px;top:'+top+'px;' : ((width!=null && height!=null) ? '#'+id+' {position:relative;' : '#'+id+' {position:fixed;width:100%;height:100%;' )
  if( arguments.length<10 || sizeUnit==null || typeof(sizeUnit)!='string'  )
	  sizeUnit = 'px';
  
  if (arguments.length>=4 && width!=null)
	  str += 'width:'+width+sizeUnit+';'
  if (arguments.length>=5 && height!=null) {
    str += 'height:'+height+sizeUnit+';'
    if ( (arguments.length<9 || other==null || other.indexOf('clip')==-1 ) && sizeUnit!='%') 
		str += 'clip:rect(0px '+width+sizeUnit+' '+height+sizeUnit+' 0px);'
  }
  if (arguments.length>=6 && visible!=null) str += 'visibility:'+ ( (visible)? 'inherit' : 'hidden' ) +';'
  if (arguments.length>=7 && zorder!=null) str += 'z-index:'+zorder+';'
  if (arguments.length>=8 && color!=null) str += 'background:'+color+';'
  if (arguments.length>=9 && other!=null) str += other
  str += '}\n'
  return str
}

function addRotateCSS(angle, hasShadow, width, height, xPos, yPos, shadowDirection, shadowDepth, shadowBlurRadius, verticalFlip, horizontalFlip, boundsRectX, boundsRectY, adornerWidth, adornerHeight){
	var radians = angle * (Math.PI / 180.0);
	
	//if the image has a shadow, the point of rotation needs to be adjusted
	var shadowRadians = 0.0;
	var yOffset = 0;
	var xOffset = 0;
	if(hasShadow > 0)
	{
		shadowRadians = shadowDirection * (Math.PI / 180.0);
		//A negative yOffset means the shadow is going up the screen
		xOffset = shadowDepth * parseFloat(Math.cos(shadowRadians).toFixed(5));
		yOffset = -1 * shadowDepth * parseFloat(Math.sin(shadowRadians).toFixed(5));
	}
	else
	{
		shadowDirection = 0;
		shadowDepth = 0;
		shadowBlurRadius = 0;
	}
	
	var deltaCenterX = 0;
	var deltaCenterY = 0;
	
	if(adornerWidth == 0 || adornerHeight == 0)
	{
		deltaCenterX = width / 2.0;
		deltaCenterY = height / 2.0;
	}
	else
	{
		deltaCenterX = (adornerWidth / 2) - boundsRectX;
		deltaCenterY = (adornerHeight / 2) - boundsRectY;
	}
	
	var rotateAttribute = '';
	
	if( is.chrome || is.safari)
	{
		if(xOffset < 0) deltaCenterX = deltaCenterX - (xOffset - shadowBlurRadius);
		if(yOffset < 0) deltaCenterY = deltaCenterY - (yOffset - shadowBlurRadius);
		rotateAttribute += '-webkit-transform-origin: ' + deltaCenterX + 'px ' + deltaCenterY + 'px;';
		
		rotateAttribute += '-webkit-transform:rotate(' + angle + 'deg)';
		
		if(verticalFlip == 1)
		{
			rotateAttribute += 'scaleY(-1)';
		}
		
		if(horizontalFlip == 1)
		{
			rotateAttribute += 'scaleX(-1)';
		}
		
		rotateAttribute += ';';
	}
	else if( is.firefox )
	{
		if(xOffset < 0) deltaCenterX = deltaCenterX - (xOffset - shadowBlurRadius);
		if(yOffset < 0) deltaCenterY = deltaCenterY - (yOffset - shadowBlurRadius);
		rotateAttribute += '-moz-transform-origin: ' + deltaCenterX + 'px ' + deltaCenterY + 'px;';
		
		rotateAttribute += '-moz-transform:rotate(' + angle + 'deg)';
		
		if(verticalFlip == 1)
		{
			rotateAttribute += 'scaleY(-1)';
		}
		
		if(horizontalFlip == 1)
		{
			rotateAttribute += 'scaleX(-1)';
		}
		
		rotateAttribute += ';';
	}
	else if( is.ie8 || is.ie9)
	{		
		//Image rotation for IE8 and 9 is done inside of ObjImageBuild because of VML notation
	}
	else 
	{
		if(xOffset < 0) deltaCenterX = deltaCenterX - (xOffset - shadowBlurRadius);
		if(yOffset < 0) deltaCenterY = deltaCenterY - (yOffset - shadowBlurRadius);
		rotateAttribute += 'transform-origin: ' + deltaCenterX + 'px ' + deltaCenterY + 'px;';
		
		rotateAttribute += 'transform:rotate(' + angle + 'deg)';
		
		if(verticalFlip == 1)
		{
			rotateAttribute += 'scaleY(-1)';
		}
		
		if(horizontalFlip == 1)
		{
			rotateAttribute += 'scaleX(-1)';
		}
		
		rotateAttribute += ';';
	}
	
	return rotateAttribute;
}

//Opacity is passed in as a number between 0-100
function addOpacityCSS(opacityVal){
	var opacityAttribute = '';
	if(!(is.ie8 || is.ie9))
		opacityAttribute += 'opacity: ' + (opacityVal/100.0) + ';';
	else
		opacityAttribute += 'filter: alpha(opacity=' + opacityVal + ');'
	fOpacity = opacityVal;
	return opacityAttribute;
}

function addSvgShadowFilter(name,width, height, direction, depth, opacity, red, green, blue, blurRadius, type)
{
	var radians = direction * (Math.PI / 180.0);
	var xOffset = depth * Math.cos(radians);
	var yOffset = -1 * depth * Math.sin(radians);

	xOffset = xOffset.toFixed(5);
	yOffset = yOffset.toFixed(5);
	
	var svgFilter = '<svg width="' + (Math.abs(1*width) + Math.abs(1*xOffset)) + 'px" height="' + (Math.abs(1*height) + Math.abs(1*yOffset)) + 'px">\n';
	svgFilter += '<defs>\n';
	var stdBlurRadius = blurRadius/1.8;
	if(xOffset <= 0 || yOffset <= 0)
	{
		svgFilter += '<filter id = "' + name +'Shadow" '
		if(xOffset <= 0)
		{
			var xDisplacementPercentage = (((xOffset - blurRadius) / width) * 100).toFixed(5);
			svgFilter += 'x = "' + xDisplacementPercentage + '%" '
		}
		else svgFilter += 'x = "0" '
		if(yOffset <= 0)
		{
			var yDisplacementPercentage = (((yOffset - blurRadius) / height) * 100).toFixed(5);
			svgFilter += 'y = "' + yDisplacementPercentage + '%" '
		}
		else svgFilter += 'y = "0" '
		
		svgFilter += 'width="'+ 100 * (Math.abs(xOffset) + width + 2*blurRadius) / width +'%" height="'+ 100 * (Math.abs(yOffset) + height + 2*blurRadius) / height +'%">\n';
	}
	else
	{
		var w = 200 + 200*(depth/100);
		var h = 200 + 200*(depth/100);
		svgFilter += '<filter id = "' + name +'Shadow" x = "0" y = "0" width="'+w+'%" height="'+h+'%">\n';
	}
	
		svgFilter += '<feColorMatrix result = "colorResult" in = "SourceAlpha" type = "matrix" values = "0 0 0 ' + (red / 255.0).toFixed(6) + ' 0 0 0 0 ' + (green / 255.0).toFixed(6) + ' 0 0 0 0 ' + (blue / 255.0).toFixed(6) + ' 0 0 0 0 '+opacity+' 0"/>\n';
	svgFilter += '<feOffset result = "offsetResult" in = "colorResult" dx = "' + xOffset + '" dy = "' + yOffset + '" />\n';
	svgFilter += '<feGaussianBlur result = "blurResult" in = "offsetResult" stdDeviation = "'+stdBlurRadius+'" />\n';							//stdDeviation is the blurRadius
	svgFilter += '<feBlend in = "SourceGraphic" />'
	svgFilter += '</filter>\n';
	svgFilter += '</defs>\n';
	svgFilter += '</svg>';
	
	return svgFilter;
}

function addReflection(name, src, topLeftX, topLeftY, width, height, angle, offset, fadeRate, visible, 
					   verticalFlip, horizontalFlip, boundsRectX, boundsRectY, adornerWidth, adornerHeight, 
					   zOrd, ie8DivX, ie8DivY, ie8DivWidth, ie8DivHeight, ie8ReflectionImgX, ie8ReflectionImgY){
	var reflection = '';
	
	var bIsButton = name.indexOf("button") != -1 ? true : false;
	var bIsImage = name.indexOf("image") != -1 ? true : false;
	
	if(is.awesomium || is.ie8 || is.ie9)
	{
		if(visible ==0)
		{
			visible =1;
			topLeftX = -width;
			topLeftY = -height;
		}
	}
	
	reflection += '<div id="'+name+'ReflectionDiv" style="visibility:'+((visible)?'inherit':'hidden')+';z-index:'+zOrd+';';
	
	var deltaCenterX = 0;
	var deltaCenterY = 0;
	
	if(adornerWidth == 0 || adornerHeight == 0)
	{
		deltaCenterX = width / 2.0;
		deltaCenterY = height / 2.0;
	}
	else
	{
		deltaCenterX = (adornerWidth / 2.0) - boundsRectX;
		deltaCenterY = (adornerHeight / 2.0) - boundsRectY;
	}
	
	if(is.awesomium)
		if(angle == 0)
			angle = 360;
	
	if(is.chrome || is.safari)
	{
		if(!is.awesomium)
			reflection += '-webkit-transform-origin:'+ deltaCenterX+'px '+deltaCenterY+'px;';
		else if(is.awesomium && (boundsRectX != 0 || boundsRectY != 0) )
			reflection += '-webkit-transform-origin:'+ deltaCenterX+'px '+deltaCenterY+'px;';
		
		reflection += '-webkit-transform:rotateX(180deg)';
		
		if(angle > 0)
			reflection += ' rotateZ(' + angle + 'deg)';
		
		if(verticalFlip == 1)
		{
			if(bIsButton) reflection += ' scaleY(1)';
			if(bIsImage) reflection += ' scaleY(-1)';
		}
		
		if(horizontalFlip == 1)
		{
			if(bIsButton) reflection += ' scaleX(1)';
			if(bIsImage) reflection += ' scaleX(-1)';
		}
	}
	else if(is.ie8 || is.ie9)
	{
		//echo bug 21657 : ie8 and ie9 rotations are flipped using a vml style attribute
	}
	else if(is.firefox)
	{
		reflection += '-moz-transform-origin:'+deltaCenterX+'px '+deltaCenterY+'px; -moz-transform:rotateX(180deg)';
		
		if(angle > 0)
			reflection += ' rotateZ(' + angle + 'deg)';
			
		if(verticalFlip == 1)
		{
			if(bIsButton) reflection += ' scaleY(1)';
			if(bIsImage) reflection += ' scaleY(-1)';
		}
		
		if(horizontalFlip == 1)
		{
			if(bIsButton) reflection += ' scaleX(1)';
			if(bIsImage) reflection += ' scaleX(-1)';
		}
	}
	else
	{
		reflection += 'transform-origin:'+deltaCenterX+'px '+deltaCenterY+'px; transform:rotateX(180deg)';
		
		if(angle > 0)
			reflection += ' rotateZ(' + angle + 'deg)';
		
		if(verticalFlip == 1)
		{
			if(bIsButton) reflection += ' scaleY(1)';
			if(bIsImage) reflection += ' scaleY(-1)';
		}
		
		if(horizontalFlip == 1)
		{
			if(bIsButton) reflection += ' scaleX(1)';
			if(bIsImage) reflection += ' scaleX(-1)';
		}
	}
	
	if(!(is.ie8 || is.ie9))
		reflection += '; opacity: ' + (fOpacity/100.0);
		
	if(is.ie8 || is.ie9)
		reflection += '; position:absolute; top:' + ie8DivY + 'px; left:' + ie8DivX + 'px; width:' + ie8DivWidth + 'px; height:' + ie8DivHeight + 'px;">\n';
	else
	{
		//echo LD-1574 : There seems to be a 1px difference between the way gdiplus renders and the way the browser renders two shapes in the same position. 
		if(is.awesomium)
			reflection += '; position:absolute; top:' + topLeftY + 'px; left:' + topLeftX + 'px; width:' + width + 'px; height:' + height + 'px;">\n';	
		else
			reflection += '; position:absolute; top:' + (topLeftY - 1) + 'px; left:' + topLeftX + 'px; width:' + width + 'px; height:' + height + 'px;">\n';	
	}
	
	if(!is.ie8 && !is.ie9)
	{
		reflection += '<svg focusable="false" style="overflow:visible;width:'+width+'px;height:'+height+'px;"  >\n';
		reflection += '<defs>\n';
		
		if(is.awesomium)
		{
			var radians = (Math.PI / 180.0);
			var cosAngle = Math.cos(radians);
			var sinAngle = Math.sin(radians);

			var startVectX = (0.5 + (0.5 * sinAngle)).toFixed(2);
			var startVectY = (0.5 - (0.5 * cosAngle)).toFixed(2);
			var endVectX = (0.5 - (0.5 * sinAngle)).toFixed(2); 
			var endVectY = (0.5 + (0.5 * cosAngle)).toFixed(2);
			
			reflection += '<linearGradient id="' + name + 'AlphaGradient" x1="' + startVectX + '" y1="' + startVectY + '" x2="' + endVectX + '" y2="' + endVectY + '">\n';	
		}
		else
		{
			var radians = 0;
			if( (verticalFlip == 1 && horizontalFlip !=1) || (verticalFlip != 1 && horizontalFlip == 1) || (horizontalFlip == 1 && verticalFlip == 1))
				radians = (1 * angle) * (Math.PI / 180.0);
			else
				radians = (-1 * angle) * (Math.PI / 180.0);
				
			var cosAngle = Math.cos(radians);
			var sinAngle = Math.sin(radians);
			
			var startVectX = (0.5 + (0.5 * sinAngle)).toFixed(2);
			var startVectY = (0.5 - (0.5 * cosAngle)).toFixed(2);
			var endVectX = (0.5 - (0.5 * sinAngle)).toFixed(2); 
			var endVectY = (0.5 + (0.5 * cosAngle)).toFixed(2);
			
			//echo bug 21516 : Buttons are published out flipped so they don't need the javascript to do it for them.
			if(verticalFlip == 1 && horizontalFlip == 0 && bIsImage) 
			{
				reflection += '<linearGradient id="' + name + 'AlphaGradient" x1="' + startVectX + '" y1="' + startVectY + '" x2="' + endVectX  + '" y2="' + endVectY + '">\n';
			}
			else if(verticalFlip == 0 && horizontalFlip == 1 && bIsImage)
			{
				reflection += '<linearGradient id="' + name + 'AlphaGradient" x1="' + endVectX + '" y1="' + endVectY + '" x2="' + startVectX  + '" y2="' + startVectY + '">\n';
			}
			else if(verticalFlip == 1 && horizontalFlip == 1 && bIsImage)
			{
				reflection += '<linearGradient id="' + name + 'AlphaGradient" x1="' + endVectX + '" y1="' + startVectY + '" x2="' + startVectX  + '" y2="' + endVectY + '">\n';
			}
			else
			{
				reflection += '<linearGradient id="' + name + 'AlphaGradient" x1="' + endVectX + '" y1="' + endVectY + '" x2="' + startVectX + '" y2="' + startVectY + '">\n';
			}
		}
			
		reflection += '<stop offset="10%" stop-color="white" stop-opacity="0.5"/>\n';
		reflection += '<stop offset="' + (offset * 100) + '%" stop-color="white" stop-opacity="0"/>\n';
		reflection += '</linearGradient>\n';
		reflection += '<mask id="' + name + 'Mask" maskUnits="objectBoundingBox">\n';
		reflection += '<rect x="0" y="0" width="' + width + '" height="' + height +'" style="fill:url(#' + name + 'AlphaGradient);"/>\n';
		reflection += '</mask>\n';
		reflection += '</defs>\n';
		reflection += '<image id="'+name+'Reflection" xlink:href="' + src + '" preserveAspectRatio="none" width = "' + width + 'px" height = "' + height + 'px" mask="url(#' + name + 'Mask)"/>\n';
		reflection += '</svg>\n';
	}
	else
	{
		if(verticalFlip == 0 && horizontalFlip == 0) 
		{
			reflection += '<v:image id="'+name+'Reflection" src="'+ src +'" style="flip:y; filter: progid:DXImageTransform.Microsoft.Alpha(startX='+((width*100)/(2*width))+', startY=0, finishX='+((width*100)/(2*width))+', finishY='+offset*100+', style=1, finishOpacity=0,opacity=55);position:absolute;left:'+((topLeftX - (ie8ReflectionImgX - topLeftX)) - ie8DivX)+'px;top:'+((topLeftY - (topLeftY - ie8ReflectionImgY)) - ie8DivY)+'px;width:'+width+'px;height:'+height+'px;rotation:'+angle+';" alt=""/>\n';
		}
	
		if(horizontalFlip == 1 && verticalFlip == 0)
		{
			reflection += '<v:image id="'+name+'Reflection" src="'+ src +'" style="flip:x; filter: progid:DXImageTransform.Microsoft.Alpha(startX='+((width*100)/(2*width))+', startY=0, finishX='+((width*100)/(2*width))+', finishY='+offset*100+', style=1, finishOpacity=0,opacity=55);position:absolute;left:'+((topLeftX - (ie8ReflectionImgX - topLeftX)) - ie8DivX)+'px;top:'+((topLeftY - (topLeftY - ie8ReflectionImgY)) - ie8DivY)+'px;width:'+width+'px;height:'+height+'px;rotation:'+(180-angle)+';" alt=""/>\n';
		}
		
		if(horizontalFlip == 0 && verticalFlip == 1)
		{
			reflection += '<v:image id="'+name+'Reflection" src="'+ src +'" style="flip:y; filter: progid:DXImageTransform.Microsoft.Alpha(startX='+((width*100)/(2*width))+', startY=0, finishX='+((width*100)/(2*width))+', finishY='+offset*100+', style=1, finishOpacity=0,opacity=55);position:absolute;left:'+((topLeftX - (ie8ReflectionImgX - topLeftX)) - ie8DivX)+'px;top:'+((topLeftY - (topLeftY - ie8ReflectionImgY)) - ie8DivY)+'px;width:'+width+'px;height:'+height+'px;rotation:'+ (360-angle)+';" alt=""/>\n';
		}
		
		if(horizontalFlip == 1 && verticalFlip == 1)
		{
			reflection += '<v:image id="'+name+'Reflection" src="'+ src +'" style="flip:y; filter: progid:DXImageTransform.Microsoft.Alpha(startX='+((width*100)/(2*width))+', startY=0, finishX='+((width*100)/(2*width))+', finishY='+offset*100+', style=1, finishOpacity=0,opacity=55);position:absolute;left:'+((topLeftX - (ie8ReflectionImgX - topLeftX)) - ie8DivX)+'px;top:'+((topLeftY - (topLeftY - ie8ReflectionImgY)) - ie8DivY)+'px;width:'+width+'px;height:'+height+'px;rotation:'+(360-angle)+';" alt=""/>\n';
		}
	}
	
	reflection += '</div>\n';
	
	return reflection;
}

function writeStyleSheets(arrOfObjs) {

  var strCSS = "";
  for( var i=0; i<arrOfObjs.length; i++ )
  {
	  if( arrOfObjs[i].css )
		strCSS += arrOfObjs[i].css+"\n";
	  if( arrOfObjs[i].textDivCSS )
		strCSS += arrOfObjs[i].textDivCSS+"\n";
	  if( arrOfObjs[i].spanDivCSS )
		strCSS += arrOfObjs[i].spanDivCSS+"\n";
	
	  if( arrOfObjs[i].arrCSSStyles )
	  {
		  for( var j=0; j< arrOfObjs[i].arrCSSStyles.length; j++ )
			strCSS += ModifyCSSBulk( arrOfObjs[i].arrCSSStyles[j], arrOfObjs[i], true )+"\n";
	  } 
  }
  var styleElem = document.getElementById("TrivDynStyleSheet")
  if( !styleElem )
  {
    var cssStr = '<style id="TrivDynStyleSheet" type="text/css">\n'
    cssStr += strCSS
    cssStr += '</style>'
    document.write(cssStr)
  }
  else
	styleElem.innerHTML  = strCSS;
}

function preload() {
  if (!document.images) return;
  var ar = new Array();
  var objPreload;
  if(arguments.length == 1 && typeof (arguments[0]) != "string")
	  objPreload = arguments[0];
  else
	  objPreload = arguments;
  
  for (var i = 0; i < objPreload.length; i++) {
    ar[i] = new Image();
    ar[i].src = objPreload[i];
  }
}

function getHTTP(dest, method, parms, errOk)
{
    var httpReq;
    if( method == 'GET' ) { 
        if( parms ) {
          if( dest.indexOf('?' ) > 0 )
            dest += '&';
          else
            dest += '?';
          dest += parms;
          parms = null;
        }
    }
    
    var msg = 'Issuing ' + method + ' to ' + dest;
    if( parms ) msg += ' for [' + parms + ']';
    trivLogMsg( msg, 8 );
    
    var requestSent = 0;
    try { 
        // branch for native XMLHttpRequest object
        if (window.XMLHttpRequest) {
            httpReq = new XMLHttpRequest();
            httpReq.open(method, dest, false);
            httpReq.onreadystatechange = null;
            if( method == 'POST' ) {
              httpReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
            }
            httpReq.send(parms); 
            requestSent = 1;
        } 
    }
    catch(e){
      if( typeof(errOk) != "undefined" && errOk != null && e.code == errOk )
        requestSent = 1;
    }
    
    // branch for IE/Windows ActiveX version
    if (!requestSent && window.ActiveXObject) {
        httpReq = new ActiveXObject("Microsoft.XMLHTTP");
        if (httpReq) {
            httpReq.open(method, dest, false);
            if( method == 'POST' ) {
              httpReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
            }
            httpReq.send(parms);
        }
    }
    trivLogMsg( 'ReturnCode = ' + httpReq.status + ' Received Data [' + httpReq.responseText + ']', 8 );
    return httpReq;
}

function GenRand( min, max )
{
  return Math.floor( Math.random() * ( max - min + 1 ) + min );
}

function Encode( s )
{
  if( s == null ) return '';
  return encodeURIComponent( String(s) );
}

function Decode( s )
{
  if( s == null ) return '';
  return decodeURIComponent( String(s) );
}

function UniUnescape( s )
{
  if( s == null ) return '';
  return( unescape( String(s).replace(/%5Cu/g, '%u') ) );
}

function unJUN( s )
{
  var val = "";
  if( s != null )
  {
    for( i=0; i<s.length; i++ )
    {
      if( s.charAt(i) == '\\' && s.length > (i + 5) && s.charAt(i+1) == 'u' )
      {
        cEsc = '%';
        cEsc += s.substring(i+1,i+6);
        c = unescape(cEsc);
        if( c.length == 1 )
        {
          val += c;
          i += 5;
        }
        else
        {
          val += s.charAt(i);
        }
      }
      else
      {
        val += s.charAt(i);
      }
    }
  }
  return val;
}

function convJS( s )
{
  if( s == null ) return '';
  s = s.replace(/\n/g, '<br/>');
  s = s.replace(/\\r/g, '<br/>');
  s = s.replace(/"/g, '&quot;');
  return s;
}

function addDelimeter( arrCh, strAns, del ) {
  var retVar = "";
  if( strAns != null && strAns != "" )
  {
    var strTmpChoice = "";
    var loc;
    var str = "," + strAns + ",";
    for( var i=0; i<arrCh.length; i++ ) {
      strTmpChoice = "," + arrCh[i] + ",";
      loc = str.indexOf(strTmpChoice);
      if( loc != -1 )
      {
        if( retVar.length == 0 )
          retVar = del;
        retVar += arrCh[i] + del;
      }
    }
  }
  return retVar;
}

function getContentWindow()
{
  var win = window;
  if( window.frameElement && ( window.frameElement.name == 'titlemgrframe' ) )
  {
    if( window.frameElement.parentNode )
    {
      for( i=0; i<window.frameElement.parentNode.childNodes.length; i++ )
      {
        if( window.frameElement.parentNode.childNodes[i].name == 'contentframe' )
        {
          win = window.frameElement.parentNode.childNodes[i].contentWindow;
          break;
        }
      }
    }
  }
  return win;
}


function trivAlert( pWinId, title, msg, cb )
{
	if( trivWeb20Popups )
	{
		var alertMsg = msg.replace(/\n/g, "<br>"); // 15923 - handle line breaks
		var mb = new jsDlgMsgBox( pWinId, title, alertMsg, null, cb);
		mb.create();
	}
	else
		alert( msg );
}

function closeDialog()
{
	var close;
	var rc = false;
	if( this.frameElement && this.frameElement.parentNode )
	{
		for( i=0; i<this.frameElement.parentNode.childNodes.length; i++ )
		{
			if( this.frameElement.parentNode.childNodes[i].id == 'DLG_hiddenClose' )
			{
				close = this.frameElement.parentNode.childNodes[i];
				break;
			}
		}
		if( close && close.onclick )
		{
			close.onclick();
			rc = true;
		}
	}
	return rc;
}

function CloseWnd() {
  if( this.frameElement && this.frameElement.id && this.frameElement.id.indexOf('DLG_content') == 0 )
    closeDialog();
  else
    window.close();
}

function createXMLHTTPObject(filename){
	var httpReq;
	try{
		if ( window.ActiveXObject ){
			httpReq = new ActiveXObject("Microsoft.XMLHTTP");

			if (httpReq){
				httpReq.open('GET', filename, false);
				httpReq.send();
			}
		}
		else if ( window.XMLHttpRequest ){
			httpReq = new XMLHttpRequest();
			httpReq.open('GET', filename, false);
			httpReq.onreadystatechange = null;
			httpReq.send("noCache=" + (new Date().getTime()) );
		}

		var respXML = httpReq.responseXML;
		if ( window.ActiveXObject ){
			respXML = new ActiveXObject("Microsoft.XMLDOM");
			respXML.async = "false";
			respXML.loadXML(httpReq.responseText);
		}

	}
	catch(e) {}
	return respXML;
}

function getNVStr(nl,tag){
	var ar = nl.getElementsByTagName(tag);
	for( var i=0; i<ar.length; i++ )
		if( ar[i] && ar[i].firstChild && ar[i].parentNode == nl ) return ar[i].firstChild.data;
	return "";
}

function getTextData(filename, textblockname){
	if( trivDynXMLfilePath.length > 4 ) 
		filename = trivDynXMLfilePath;
	var nl = createXMLHTTPObject(filename);
	var arTB = nl.getElementsByTagName('textblock');
	for( var i = 0; arTB && i < arTB.length; i++ ){
		if(arTB[i].getAttribute('name') == textblockname)
			return getNVStr( arTB[i], 'text' );
	}
	return '';
}

function getAllChildrenSpanElem(targetDocument, currentElement, arr) {
    if (currentElement) {
        var j;
        var tagName = currentElement.tagName;

        if (tagName == 'SPAN')
            arr.push(currentElement);

        var i = 0;
        var currentElementChild = currentElement.childNodes[i];
        while (currentElementChild) {
            getAllChildrenSpanElem(targetDocument, currentElementChild, arr);
            i++;
            currentElementChild = currentElement.childNodes[i];
        }
    }
}

function supports_video() {
    return !!document.createElement('video').canPlayType;
}

function supports_h264_baseline_video() {
    if (!supports_video()) { return false; }
    var v = document.createElement("video");
    return /^(probably|maybe)$/i.test(v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'));
}

function trivTimerLoop( timerVar, durInSec, onDone, updatefunc, propsStr, bRecur ){
	var timerVarVal = timerVar.getValue();
	var startTime = parseInt( timerVarVal );
	var paused = false;
	var now = parseInt((new Date().getTime()+500)/1000)*1000;
	if( timerVarVal!=null && typeof(timerVarVal)!="undefined")
	{
		timerVarVal = timerVarVal.toString();
		var bPause = timerVarVal.indexOf( "pause:" ) != -1;
		var bDone  = timerVarVal.indexOf( "done:" ) != -1;
		if( bPause || bDone )
		{
			var remainingTime = parseInt( timerVarVal.split(':')[1]) ;
			startTime = ( now - remainingTime );
			if( bPause )
				paused = true;
			else
			{
				if( bRecur )
					paused = true;
				else
					timerVar.set( startTime );
			}
		}
	}
	
	if( ( startTime == 0 || startTime > now  )&& !paused)
	{
		//this is a fresh timer: 
		startTime = now;
		timerVar.set( startTime );
	}	
	
	var props = eval(propsStr);
	var strRemain = getRemainingTime(now, startTime, durInSec*1000, props.bShowHours, props.bShowMin, props.bShowSec, props.countdown );
	
	if( strRemain == null && !paused)
	{
		timerVar.set( "pause:-999999999999999" ); //negative remaining time, this will signify timer completed.
		eval( onDone ); 
	}
	else 
	{
		if( strRemain == null )
			strRemain = buildTimeString( (props.countdown)?0:(durInSec*1000), props.bShowHours, props.bShowMin, props.bShowSec );
		var updFunc = eval(updatefunc);
		updFunc( strRemain );
	}
	
	var strExec = "trivTimerLoop(" + timerVar.name + "," + durInSec + ",'" + onDone +"','" + updatefunc + "', '" + propsStr + "', true )";
	setTimeout( strExec, 500 );
}

function buildTimeString(lRemain, showHours, showMins, showSecs )
{
	var strRemain = '';
	
    lRemain = lRemain/1000;
	
    var temp = parseInt(lRemain/3600);
    lRemain -= temp * 3600;
    if ( showHours )
	{
		strRemain += temp + ':';
	}
    else
		strRemain += '  ';
		
    temp = parseInt(lRemain/60);
    lRemain -= temp * 60;
    if ( showMins )
    {
        if( temp <= 9 )
			strRemain += '0';
	    strRemain += temp;
    }
    if ( showSecs )
    {
        if ( showMins )
            strRemain += ':';
        if( lRemain <= 9 )
            strRemain += '0';
        strRemain += parseInt( lRemain );
    }
	return strRemain;
}

function getRemainingTime( now, lStartTime, lDuration, showHours, showMins, showSecs, countDown ) 
{ 
  lStartTime = parseInt(lStartTime/1000)*1000
  var lRemain = 0;
  var timeSoFar = 0;
  var lCurr = 0;
  var now = parseInt((new Date().getTime()+500)/1000)*1000;
  
  if( lStartTime > now )
	return null;

  lCurr = now - lStartTime;

  lRemain = lDuration - lCurr;

  if ( !countDown )
  {
	timeSoFar = lDuration - lRemain;

	if ( timeSoFar > lDuration )
		return null;
	lRemain = timeSoFar;
  }
  
  if( countDown && lRemain > 0 || !countDown && timeSoFar < lDuration)
    return buildTimeString( lRemain, showHours, showMins, showSecs, countDown );
  else
    return null;
}

function validateNum(evt) {
  var theEvent = evt || window.event;
  var key = theEvent.keyCode || theEvent.which;
  key = String.fromCharCode( key );
  var regex = /[0-9]|\.|\,|\-/;
  if( !regex.test(key) ) {
    theEvent.returnValue = false;
    if(theEvent.preventDefault) theEvent.preventDefault();
  }
}

function addClickMap(objWidth, objHeight, xOffset, yOffset, thisObj)
{
	var svgImageTag = '';
	var mapOffsetX = 0;
	var mapOffsetY = 0;
	
	if(xOffset < 0 || yOffset < 0)
	{		
		if(xOffset < 0)
			mapOffsetX = Math.abs(xOffset) + thisObj.outerShadowBlurRadius;

		if(yOffset < 0)
			mapOffsetY = Math.abs(yOffset) + thisObj.outerShadowBlurRadius;

	}
	
	var str = ''
	
	str += '<div style="left:'+mapOffsetX+'px; top:'+mapOffsetY+'px; position:absolute; z-index:1;">\n'
	str += '<svg id="'+thisObj.name+'SVG" focusable="false" role="img" aria-label=" " width="'+objWidth+'px" height="'+objHeight+'px"'
	str += '>\n'
	str += '<g opacity="0">\n'
	str += '<a id="'+thisObj.name+'MapArea" name="'+thisObj.name+'MapArea">\n'
	str += '<path shape="poly" d="'+thisObj.str_SvgMapPath+'"/>\n'
	str += '</a>\n'
	str += '</g>\n'
	str += '</svg>\n'
	str += '</div>\n'
	
	return str;
}

function addImageMap(obj)
{
	var strMap = '';
	strMap += '<map id="'+obj.name+'Map" name="' + obj.name + 'Map">\n';
	strMap += '<area name="' + obj.name + 'MapArea" id="' + obj.name + 'MapArea"shape="poly" coords="' + obj.str_ImageMapCoords + '"';
    if( obj.hasOnUp && !is.iOS ) strMap += ' href="javascript:void(null)"'
    if( obj.hasOnUp && is.iOS ) strMap += ' href="javascript:' + this.name + '.up()"'
	strMap += 'alt="'+ obj.altName +'">';		//echo bug 19523: Jaws is reading the alt tag for images with actions here
	strMap += '</map>\n';
	
	return strMap;
}

function IsPointInPolygon(p, arrPoints)
{
	var num = arrPoints.length;
    var i = 1;
    var j = 0;
    var c = false;
	
	for( ; i<num; i++ )
	{
		var pi = arrPoints[i];
		var pj = arrPoints[j];
		
        if(  (( pi.Y > p.Y) != (pj.Y > p.Y)) && (p.X < (pj.X - pi.X) * (p.Y - pi.Y) / (pj.Y - pi.Y) + pi.X) )
            c = !c;
        j = i;
	}
	
    return c;
}

function AdjustClickPointsForAct(thisObj, bForResponsive)
{
	var pIh = (thisObj.h/thisObj.maph);
	var pIw = (thisObj.w/thisObj.mapw);

	if(thisObj.bHasClickMap && ((thisObj.objLyr && thisObj.objLyr.growActive == false) || bForResponsive))
	{
		var svgStr = "";
		var mapStr = "";
		if(thisObj.bSVGMap)
		{
			var map = thisObj.str_SvgMapPath.split(" ");
			for (index = 0; index < map.length; index++)
			{
				var x = 0;
				var y = 0;
				if(index%3 == 0)
				{
					svgStr += map[index];
				}
				else if(index%3 == 1)
				{
					x = parseFloat(map[index]);
					if(x)
					{
						x = x * pIw;
						svgStr+= x.toFixed(2).toString();
					}
					else
					{
						svgStr+=map[index];
					}
				}
				else if(index%3 == 2)
				{
					y = parseFloat(map[index]);
					if(y)
					{
						y = y * pIh;
						svgStr+= y.toFixed(2).toString();
					}
					else
					{
						svgStr+=map[index];
					}
				}
				if(index+1 != map.length)
					svgStr+= " ";
			}
			thisObj.str_SvgMapPath = svgStr;
		}
		else
		{
			var map = thisObj.str_ImageMapCoords.split(",");
			for (index = 0; index < map.length; index++)
			{
				var x = 0;
				var y = 0;
				if(index%2 == 0)
				{
					x = (parseFloat(map[index]) * pIw);
					mapStr+= x.toFixed(2).toString();
				}
				else
				{
					y = (parseFloat(map[index]) * pIh);
					mapStr+= y.toFixed(2).toString();
				}
				if(index+1 != map.length)
					mapStr+= ",";
			}
			thisObj.str_ImageMapCoords = mapStr;
		}
		
		thisObj.maph = thisObj.h;
		thisObj.mapw = thisObj.w;
		return true;
	}
	return false;
}

/*
 * pads number n with z or '0' so resulting string is length width
 *
 * pad(10, 4);      // 0010
 * pad(9, 4);       // 0009
 * pad(123, 4);     // 0123
 *
 * pad(10, 4, '-'); // --10
 */
function  padDigits(n, width, z)
{
	  z = z || '0';
	  n = n + '';
	  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

/*
 * returns null if url is in the new format
 *
 */
function parseKeyFromGDocURL(url)
{
	// parse the user supplied key (key or formKey parameters) out of the Google Docs URL:
	// the old url --> https://docs.google.com/spreadsheet/ccc?key=0AkS0S-1Hb65odEhzVVQ4UXVwa1Q1WkhiY1VULVdJLUE&usp=drive_web#gid=0
	//                                              ^-^ ^------------------------------------------^
	//
	// the new and current url --> https://docs.google.com/forms/d/11kxHt5Cu5kNN1vDJjVMxkqAQcsp1cW94A9xZzq3IqQ4/formResponse
	//

	var parts = url.match(/.*(formKey)=([^#&]+).*/i);

	if ( !parts )
		parts = url.match(/.*(key)=([^#&]+).*/i);

	if ( parts && parts.length > 2 )
		return [ parts[1], parts[2] ];

	return null;
}

function ModifyBodyCSSForResponsive(styleTag, thisObj)
{
	var startPos = -1;
	var endPos = -1;
	startPos = styleTag.innerHTML.indexOf("{",styleTag.innerHTML.indexOf("body"))+1;
	endPos = styleTag.innerHTML.indexOf("}", startPos);
	var originalStr = styleTag.innerHTML.substring(startPos, endPos);
	var tokenZ = originalStr.split(";");
	var newCSS = "";
	while (tokenZ.length)
	{
		var attrib = tokenZ.shift();
		attrib = ApplyCSSResponsiveChanges(attrib, thisObj, null, false);
		newCSS = newCSS + attrib;
	}
	originalStr = "body {"+originalStr+"}"
	newCSS = "body {"+newCSS+"}"
	styleTag.innerHTML = styleTag.innerHTML.replace(originalStr, newCSS);
}

function ModifyCSSForResponsive(styleTag, thisObj, scope)
{
	var objNamePos = 0;
    var bFound = false;
    var strNums = "0123456789";
	var scopeStopIndex = -1;
	
	var tempObj = {xOffset:0, yOffset:0, width: thisObj.w, height: thisObj.h, xOuterOffset:0, yOuterOffset:0, x:thisObj.x, y:thisObj.y, xAdj:0, yAdj:0, deltaX:0, deltaY:0};
	CorrectSizePosForEffects(thisObj, tempObj);
    while( objNamePos!=-1 && !bFound )
    {
        objNamePos = styleTag.innerHTML.indexOf(thisObj.name, objNamePos==0?0:objNamePos+1);
        if( objNamePos!=-1 && strNums.indexOf( styleTag.innerHTML.charAt( objNamePos+thisObj.name.length ) ) == -1 )
            bFound = true;
    }

    while( objNamePos != -1 )
    {
        var startPos = -1;
        var endPos = -1;
        var bPrefix = false;
        var strPrefix = "#";
        var strObjTag = thisObj.name;
    
        if( styleTag.innerHTML.charAt(objNamePos-1) == "." )
        {
            bPrefix = true;
            var prefixPos = objNamePos;
            while( prefixPos > 1 && styleTag.innerHTML.charAt(prefixPos-1) != " " ) prefixPos -= 1;
            if( prefixPos > 0 )
                strPrefix = styleTag.innerHTML.substr(prefixPos, objNamePos-prefixPos);
        }
        startPos = objNamePos+thisObj.name.length;
        while( styleTag.innerHTML.charAt(startPos) != "{" && startPos < styleTag.innerHTML.length )
        {
            strObjTag += styleTag.innerHTML.charAt(startPos);
            startPos += 1;
        }
        startPos = styleTag.innerHTML.indexOf("{",startPos)+1;
        endPos = styleTag.innerHTML.indexOf("}", startPos);
        if( endPos != -1 )
        {
            var originalStr = styleTag.innerHTML.substring(startPos, endPos);
            var tokenZ = originalStr.split(";");
            var newCSS = "";
            while (tokenZ.length)
            {
                var attrib = tokenZ.shift();
                if( attrib.trim().length > 0 )
                {
                    attrib = ApplyCSSResponsiveChanges(attrib, thisObj, tempObj, false);
                    newCSS = newCSS + attrib;
                }
            }
            originalStr = strPrefix+strObjTag+"{"+originalStr+"}";
            newCSS = strPrefix+strObjTag+"{"+newCSS+"}";
            styleTag.innerHTML = styleTag.innerHTML.replace(originalStr, newCSS);
            
            bFound = false;
            while( objNamePos!=-1 && !bFound )
            {
                objNamePos = styleTag.innerHTML.indexOf(thisObj.name, objNamePos+1);
                if( objNamePos!=-1 && strNums.indexOf( styleTag.innerHTML.charAt( objNamePos+thisObj.name.length ) ) == -1 )
                    bFound = true;
            }
			
			if(scope)
			{
				scopeStopIndex = styleTag.innerHTML.indexOf(scope);
				if(objNamePos == scopeStopIndex)
				{
					bFound = false;
					objNamePos = -1;
				}
			}
        }
        else
            break;
    }
}

function ApplyCSSResponsiveChanges(strAttrib, thisObj, tempObj, bOnlyDoTextScaling)
{
	var newAttrib = strAttrib;
	
	if( bOnlyDoTextScaling )
	{
        if( (typeof(thisObj.txtscale) != 'undefined') && thisObj.txtscale != 100 && (strAttrib.indexOf("font-size") > -1) )
        {
            var iPos = strAttrib.indexOf("font-size")+10;
            var strSize = "";
            while( strAttrib.charAt(iPos) != "p" )
            {
                strSize += strAttrib.charAt(iPos);
                iPos += 1;
            }
            var iSize = parseInt(strSize);
			//echo LD-1947 : Convert the text size back to pt format and then calculate the scaled size the same way we do in the c++. Then convert the scaled pt size to px. 
			var iPtSize = Math.floor( (((iSize*0.75) * thisObj.txtscale)+50)/100 );
			var iFSize = Math.round( iPtSize/0.75 );
            newAttrib = "font-size:"+iFSize+"px;";
        }
        else
            newAttrib = newAttrib+";";
		
		return newAttrib;
	}
	
	
	if(strAttrib.indexOf("left") > -1 && !(strAttrib.indexOf("left") > 0))
	{
		newAttrib = "left:"+tempObj.x+"px;";
	}
	else if(strAttrib.indexOf("top") > -1 && !(strAttrib.indexOf("top") > 0))
	{
		newAttrib = "top:"+tempObj.y+"px;";
	}
	else if(strAttrib.indexOf("width") > -1 && !(strAttrib.indexOf("width") > 0) && thisObj.w)
	{
		newAttrib = "width:"+thisObj.w+"px;";
	}
	else if(strAttrib.indexOf("height") > -1 && !(strAttrib.indexOf("height") > 0) && thisObj.h)
	{
		newAttrib = "height:"+thisObj.h+"px;";
	}
	else if(strAttrib.indexOf("clip") > -1 && !(strAttrib.indexOf("clip") > 0))
	{
		//echo LD-2322: The clipRect needs to be big enough for the iFrame border, which defaults to 2px each side.
		if(thisObj.name.indexOf("toc") > -1 && thisObj.useIFrame)
			newAttrib = "clip: rect("+tempObj.yAdj+"px,"+(parseInt(tempObj.width)+4)+"px,"+(parseInt(tempObj.height)+4)+"px,"+tempObj.xAdj+"px);"; 
		else
			newAttrib = "clip: rect("+tempObj.yAdj+"px,"+tempObj.width+"px,"+tempObj.height+"px,"+tempObj.xAdj+"px);";
	}
	else if(strAttrib.indexOf("background-color") > -1 && !(strAttrib.indexOf("background-color") > 0) && typeof thisObj.bgColor != "undefined")
	{
			newAttrib = strAttrib.substr(strAttrib.indexOf("background-color"));
	}
	else if(strAttrib.indexOf("background-image") > -1 && !(strAttrib.indexOf("background-image") > 0))
	{
		newAttrib = "background-image:URL('"+thisObj.bgImage+"');";
	}
	else if((strAttrib.indexOf("font-size") > -1) && (typeof(thisObj.fsize) != 'undefined'))
	{
		newAttrib = "font-size:"+thisObj.fsize+"px;";
	}
	else if((strAttrib.indexOf("-webkit-transform-origin") > -1))
	{
		newAttrib = "-webkit-transform-origin:"+tempObj.deltaX+"px "+tempObj.deltaY+"px;";
	}
	else if((strAttrib.indexOf("-moz-transform-origin") > -1))
	{
		newAttrib = "-moz-transform-origin:"+tempObj.deltaX+"px "+tempObj.deltaY+"px;";
	}
	else if((strAttrib.indexOf("transform-origin") > -1))
	{
		newAttrib = "transform-origin:"+tempObj.deltaX+"px "+tempObj.deltaY+"px;";
	}
	else if (strAttrib.trim().length == 0)
	{
		newAttrib = "";
	}
	else if (!(strAttrib == ""))
	{
		newAttrib = newAttrib+";";
	}
	return newAttrib;
}

function SaveStyles()
{
	var StyleTags = document.getElementsByTagName('head')[0].getElementsByTagName('style');
	pageLayer.astrSavedStyles = new Array();
	for( var i=0; i<StyleTags.length; i++ )
		pageLayer.astrSavedStyles.push( StyleTags[i].innerHTML );
}

function RestoreStyles()
{
	var StyleTags = document.getElementsByTagName('head')[0].getElementsByTagName('style');
    for( var i=0; i<pageLayer.astrSavedStyles.length; i++ )
        StyleTags[i].innerHTML = pageLayer.astrSavedStyles[i];
}

function ModifyStyleForResponsive(styleTag, thisObj, strSel, strNewDecl)
{
	var selPos = 0;
	var bFound = false;
	var strNums = "0123456789";
	while( selPos!=-1 && !bFound )
	{
		selPos = styleTag.innerHTML.indexOf(strSel, selPos==0?0:selPos+1);
		if( selPos!=-1 && strNums.indexOf( styleTag.innerHTML.charAt( selPos+thisObj.name.length ) ) == -1 )
			bFound = true;
	}

	if( selPos != -1 )
	{
		var endPos = -1;
		endPos = styleTag.innerHTML.indexOf("}", selPos);
		if( endPos != -1 )
		{
			var origRule = styleTag.innerHTML.substring(selPos, endPos+1);
			var newRule = strSel + " " + strNewDecl;
			styleTag.innerHTML = styleTag.innerHTML.replace(origRule, newRule);
		}
	}
}

function ModifyStyleForResponsiveBulk(styleTag, thisObj, strSel, strNewDecl)
{
	var selPos = 0;
	var bFound = false;
	while( selPos!=-1 && !bFound )
	{
		selPos = styleTag.indexOf(strSel, selPos==0?0:selPos+1);
		if( selPos!=-1 )
			bFound = true;
	}

	if( selPos != -1 )
	{
		var endPos = -1;
		endPos = styleTag.indexOf("}", selPos);
		if( endPos != -1 )
		{
			var origRule = styleTag.substring(selPos, endPos+1);
			var newRule = strSel + " " + strNewDecl;
			styleTag = styleTag.replace(origRule, newRule);
		}
	}
	
	return styleTag;
}

function ModifyCSSBulk( strCSS, thisObj, bOnlyDoTextScaling )
{
	
	var arrCSSSplit = strCSS.split('}');
	for( var i=0; i<arrCSSSplit.length; i++ )
	{
		var startPos = arrCSSSplit[i].indexOf( '{' )+1;
		if( startPos == -1 )
			continue;
		var originalStr = arrCSSSplit[i].substring(startPos);
		var tokenZ = originalStr.split(";");
		var newCSS = "";
		var tempObj = {xOffset:0, yOffset:0, width: thisObj.w, height: thisObj.h, xOuterOffset:0, yOuterOffset:0, x:thisObj.x, y:thisObj.y, xAdj:0, yAdj:0, deltaX:0, deltaY:0};
		CorrectSizePosForEffects(thisObj, tempObj);
						
		while (tokenZ.length)
		{
			var attrib = tokenZ.shift();
			if( attrib.trim().length > 0 )
			{
				attrib = ApplyCSSResponsiveChanges(attrib.trim(), thisObj, tempObj, bOnlyDoTextScaling);
				newCSS = newCSS + attrib;
			}
		}
		arrCSSSplit[i] = arrCSSSplit[i].replace(originalStr, newCSS);
	}
	
	var retCSS = arrCSSSplit.join('}');
	return retCSS;
}

function FindAndModifyObjCSSBulk( thisObj, stylemods )
{	
	if( thisObj.css )
	{
	  thisObj.css = ModifyCSSBulk( thisObj.css, thisObj, false )
	  if( typeof(stylemods) != "undefined" && stylemods != null )
	  {
		for(var i=0; i<stylemods.length; i++)
			thisObj.css = ModifyStyleForResponsiveBulk(thisObj.css, thisObj, stylemods[i].sel, stylemods[i].decl);
	  }
	}
    if( thisObj.textDivCSS )
	{
	  thisObj.textDivCSS = ModifyCSSBulk( thisObj.textDivCSS, thisObj, false );
	  if( typeof(stylemods) != "undefined" && stylemods != null )
	  {
		for(var i=0; i<stylemods.length; i++)
			thisObj.textDivCSS = ModifyStyleForResponsiveBulk(thisObj.textDivCSS, thisObj, stylemods[i].sel, stylemods[i].decl);
	  }
	}
    if( thisObj.spanDivCSS )
	{
	  thisObj.spanDivCSS = ModifyCSSBulk( thisObj.spanDivCSS, thisObj, false );
	  if( typeof(stylemods) != "undefined" && stylemods != null )
	  {
		for(var i=0; i<stylemods.length; i++)
			thisObj.spanDivCSS = ModifyStyleForResponsiveBulk(thisObj.spanDivCSS, thisObj, stylemods[i].sel, stylemods[i].decl);
	  }
	}

    if( thisObj.arrCSSStyles )
    {
	  for( var j=0; j< thisObj.arrCSSStyles.length; j++ )
	  {
		thisObj.arrCSSStyles[j] = ModifyCSSBulk( thisObj.arrCSSStyles[j], thisObj, false );
		if( typeof(stylemods) != "undefined" && stylemods != null )
		{
		  for(var i=0; i<stylemods.length; i++)
			thisObj.arrCSSStyles[j] = ModifyStyleForResponsiveBulk(thisObj.arrCSSStyles[j], thisObj, stylemods[i].sel, stylemods[i].decl);
	    }
	  }
	} 
}

function FindAndModifyObjCSS(thisObj,stylemods)
{
	var styleTags = document.getElementsByTagName('style');
	var styleTag = null;
	for(var index = 0; index < styleTags.length; index++)
	{
		var styTag = styleTags[index];
		if(styTag.innerHTML.indexOf(thisObj.name) > -1)
		{
			styleTag = styTag;
			if(styleTag)
			{
				ModifyCSSForResponsive(styleTag, thisObj, null);
				if( typeof(stylemods) != "undefined" && stylemods != null )
				{
					for(var i=0; i<stylemods.length; i++)
						ModifyStyleForResponsive(styleTag, thisObj, stylemods[i].sel, stylemods[i].decl);
				}
			}
		}
	}	
}

function AdjustAttributesForEffects(thisObj, objAttribs)
{
	var attribs = objAttribs;
	if(typeof(attribs) == "undefined")
		attribs = {xOffset:0, yOffset:0, width: thisObj.w, height: thisObj.h, xOuterOffset:0, yOuterOffset:0};
	
	var heightRatio = (attribs.height/thisObj.oh);
	var widthRatio = (attribs.width/thisObj.ow);
	thisObj.w = attribs.width;
    thisObj.h = attribs.height;
	if(typeof(thisObj.hasReflection) != "undefined" && thisObj.hasReflection)
	{
		thisObj.reflectedImageHeight = thisObj.h;
		thisObj.reflectedImageWidth = thisObj.w;
		var reflectDiff = 0;
		var mainDiv = document.getElementById(thisObj.name);
		var y_Pos = thisObj.y;
		var x_Pos = thisObj.x
		if(mainDiv)
		{
			if(parseFloat(mainDiv.style.top))
				y_Pos = parseFloat(mainDiv.style.top);
			if(parseFloat(mainDiv.style.left))
				x_Pos = parseFloat(mainDiv.style.left);
		}
		
		reflectDiff = thisObj.reflectionPosDiffY *heightRatio;
		thisObj.reflectedImageY = y_Pos + reflectDiff;
		thisObj.reflectedImageX = x_Pos;
		thisObj.wrkAdornerHeight = thisObj.adornerHeight * heightRatio;
		thisObj.wrkAdornerWidth = thisObj.adornerWidth *widthRatio;

	}
	if(typeof(thisObj.hasOuterShadow) != "undefined" && thisObj.hasOuterShadow)
	{
			
			var hOffset = 0;
			var wOffset = 0;
			
			
			var outerRadians = (thisObj.outerShadowDirection) * (Math.PI / 180.0);
			thisObj.outerShadowDepth = Math.sqrt(Math.pow((thisObj.originalOuterShadowDepth * Math.cos(outerRadians)) *heightRatio,2) + Math.pow((-1 * thisObj.originalOuterShadowDepth * Math.sin(outerRadians)) *widthRatio,2));
			
			
			var xOuterOffset = thisObj.outerShadowDepth * Math.cos(outerRadians);
			//Multiply by -1 because a negative offset means this shadow is in the positive y-direction on the screen
			var yOuterOffset = -1 * thisObj.outerShadowDepth * Math.sin(outerRadians);

			attribs.xOffset = parseFloat(xOuterOffset.toFixed(5));
			attribs.yOffset = parseFloat(yOuterOffset.toFixed(5));
			attribs.xOffset += (((attribs.xOffset<0)?-2:2)*thisObj.outerShadowBlurRadius);
			attribs.yOffset += (((attribs.yOffset<0)?-2:2)*thisObj.outerShadowBlurRadius);
			hOffset = Math.abs(attribs.yOffset);
			wOffset = Math.abs(attribs.xOffset);
			
			attribs.width+=wOffset;
			attribs.height+=hOffset;
			
			attribs.xOuterOffset = xOuterOffset;
			attribs.yOuterOffset = yOuterOffset;
	}
	if(typeof(thisObj.hasBorder) != "undefined" && thisObj.hasBorder > 0)
	{
		if(thisObj.lineStyle <3)
		{
			attribs.width+=(thisObj.borderWeight*2);
			attribs.height+=(thisObj.borderWeight*2);
		}
	}
}

function CorrectSizePosForEffects(thisObj, objToCorrect)
{
	//If hasOuterShadow does not exist then there is nothing to do here
	if(typeof(thisObj.hasOuterShadow) != "undefined")
	{
		AdjustAttributesForEffects(thisObj, objToCorrect);
	  
	    if(is.vml)
	    {
		  var adjustedXPos = thisObj.ie8DivX;
		  var adjustedYPos = thisObj.ie8DivY;
		  var adjustedWidth = thisObj.ie8DivWidth;
		  var adjustedHeight = thisObj.ie8DivHeight;
	    }
	    else
	    {
		  var adjustedXPos = thisObj.x;
		  var adjustedYPos = thisObj.y;
		  var adjustedWidth = thisObj.w;
		  var adjustedHeight = thisObj.h;  
	    }
		
		var borderWeight = 0;
		if(typeof(thisObj.borderWeight) != "undefined")
			borderWeight = thisObj.borderWeight;
		  
		if(thisObj.hasOuterShadow)
		{
			if(is.vml)
			{	
				if(thisObj.vf == 1)
					objToCorrect.yOuterOffset *= -1;
				if(thisObj.hf == 1)
					objToCorrect.xOuterOffset *= -1;
				
				if(objToCorrect.xOuterOffset < 0 || objToCorrect.yOuterOffset < 0)
				{
					if(objToCorrect.xOuterOffset < 0 && objToCorrect.yOuterOffset >= 0)
					{
						objToCorrect.yAdj = (-1 * thisObj.outerShadowBlurRadius);
						objToCorrect.xAdj = (objToCorrect.xOuterOffset - thisObj.outerShadowBlurRadius);
					}
					else if(objToCorrect.xOuterOffset >= 0 && objToCorrect.yOuterOffset < 0)
					{
						objToCorrect.yAdj = (objToCorrect.yOuterOffset - thisObj.outerShadowBlurRadius);
						objToCorrect.xAdj = (-1 * thisObj.outerShadowBlurRadius);
					}
					else
					{
						objToCorrect.yAdj = (objToCorrect.yOuterOffset - thisObj.outerShadowBlurRadius);
						objToCorrect.xAdj = (objToCorrect.xOuterOffset - thisObj.outerShadowBlurRadius);
					}
				}
				else
				{
					objToCorrect.yAdj = (-1 * thisObj.outerShadowBlurRadius);
					objToCorrect.xAdj = (-1 * thisObj.outerShadowBlurRadius);
				}
				objToCorrect.width = (adjustedWidth + (2*borderWeight) + thisObj.outerShadowBlurRadius + (1 * Math.abs(objToCorrect.xOuterOffset)));
				objToCorrect.height = (adjustedHeight + (2*borderWeight) + thisObj.outerShadowBlurRadius + (1 * Math.abs(objToCorrect.yOuterOffset)));
			}
			else
			{		
				adjustedWidth = thisObj.w + (1 * Math.abs(objToCorrect.xOuterOffset)) + (2 * borderWeight) + thisObj.outerShadowBlurRadius;
				adjustedHeight = thisObj.h + (1 * Math.abs(objToCorrect.yOuterOffset)) + (2 * borderWeight) + thisObj.outerShadowBlurRadius; 
					
				if(objToCorrect.xOuterOffset < 0 || objToCorrect.yOuterOffset < 0)
				{
					if(objToCorrect.xOuterOffset < 0 && objToCorrect.yOuterOffset >= 0)
					{
						adjustedXPos += (objToCorrect.xOuterOffset - thisObj.outerShadowBlurRadius);
						objToCorrect.xAdj = (objToCorrect.xOuterOffset - thisObj.outerShadowBlurRadius);
					}
					else if(objToCorrect.xOuterOffset >= 0 && objToCorrect.yOuterOffset < 0)
					{	
						adjustedYPos += (objToCorrect.yOuterOffset - thisObj.outerShadowBlurRadius);
						objToCorrect.yAdj = (objToCorrect.yOuterOffset - thisObj.outerShadowBlurRadius);
					}
					else
					{
						adjustedXPos += (objToCorrect.xOuterOffset - thisObj.outerShadowBlurRadius);
						adjustedYPos += (objToCorrect.yOuterOffset - thisObj.outerShadowBlurRadius);
						objToCorrect.yAdj = (objToCorrect.yOuterOffset - thisObj.outerShadowBlurRadius);
						objToCorrect.xAdj = (objToCorrect.xOuterOffset - thisObj.outerShadowBlurRadius);
					}
					objToCorrect.y = adjustedYPos;
					objToCorrect.x = adjustedXPos;
					objToCorrect.width = adjustedWidth;
					objToCorrect.height = adjustedHeight;
				}
				else
				{
					objToCorrect.width = adjustedWidth + thisObj.outerShadowBlurRadius;
					objToCorrect.height = adjustedHeight + thisObj.outerShadowBlurRadius;
				}
			}
		}	
	}
	if(typeof(thisObj.r) != "undefined")
	{
		var radians = thisObj.r * (Math.PI / 180.0);
	
		//if the image has a shadow, the point of rotation needs to be adjusted
		var yOffset = 0;
		var xOffset = 0;
		if(typeof(thisObj.hasOuterShadow) != "undefined" && thisObj.hasOuterShadow > 0)
		{
			xOffset = objToCorrect.xOuterOffset;
			yOffset = objToCorrect.yOuterOffset;
		}
		
		var deltaCenterX = 0;
		var deltaCenterY = 0;
		
		deltaCenterX = thisObj.w / 2.0;
		deltaCenterY = thisObj.h / 2.0;
		
		if(xOffset < 0) 
			deltaCenterX = deltaCenterX - (xOffset - thisObj.outerShadowBlurRadius);
		if(yOffset < 0) 
			deltaCenterY = deltaCenterY - (yOffset - thisObj.outerShadowBlurRadius);
		
		objToCorrect.deltaX = deltaCenterX;
		objToCorrect.deltaY = deltaCenterY;
	}
	
	if(typeof(ObjButton) != "undefined" && thisObj.constructor == ObjButton)
	{
		if(!thisObj.name.indexOf("button")>-1)
			objToCorrect.width +=3
	}
	
	if(typeof(ObjInline) != "undefined")
	{
		if(IsRSSFeed(thisObj))
		{
			objToCorrect.width +=2;
			objToCorrect.height+=2;
		}
	}
}

function ModifySVGShadow(thisObj, objAttribs)
{
	var width = 0;
	var height = 0;
	var xDisplacementPercentage = 0;
	var yDisplacementPercentage = 0;
	
	var svgTag = document.getElementById(thisObj.name+"Shadow");
	
	if(objAttribs.xOffset <= 0 || objAttribs.yOffset <= 0)
	{
		if(objAttribs.xOffset <= 0)
		{
			xDisplacementPercentage = (((objAttribs.xOffset - thisObj.outerShadowBlurRadius) / thisObj.w)* 100).toFixed(5);
		}
		if(objAttribs.yOffset <= 0)
		{
			yDisplacementPercentage = (((objAttribs.yOffset - thisObj.outerShadowBlurRadius) / thisObj.h)* 100).toFixed(5);
		}
		width = 100*(Math.abs(objAttribs.xOffset) + thisObj.w + 2*thisObj.outerShadowBlurRadius)/thisObj.w;
		height = 100 * (Math.abs(objAttribs.yOffset) + thisObj.h + 2*thisObj.outerShadowBlurRadius)/thisObj.h;
	}
	else
	{
		width = 200 + 200 * (thisObj.originalOuterShadowDepth/100);
		height = 200 + 200 * (thisObj.originalOuterShadowDepth/100);
	}
	
	svgTag.height.baseVal.valueInSpecifiedUnits = height;
	svgTag.width.baseVal.valueInSpecifiedUnits = width;
	svgTag.x.baseVal.valueInSpecifiedUnits = xDisplacementPercentage;
	svgTag.y.baseVal.valueInSpecifiedUnits = yDisplacementPercentage;
	
	var feOffset = null;
	for (var index = 0; index< svgTag.childNodes.length; index++)
	{
		if(svgTag.childNodes[index].nodeName == "feOffset")
		{
			feOffset = svgTag.childNodes[index];
			break;
		}
	}
	if(feOffset)
	{
		feOffset.dx.baseVal = objAttribs.xOuterOffset;
		feOffset.dy.baseVal = objAttribs.yOuterOffset;
	}
}

function ModifyReflection(thisObj)
{
	var reflecDiv = document.getElementById(thisObj.name+'ReflectionDiv');
	var reflecSVG = reflecDiv.getElementsByTagName('svg')[0];
	var reflecImg = document.getElementById(thisObj.name+'Reflection');
	var reflecMask = reflecDiv.getElementsByTagName('rect')[0];
	var deltaCenterX = 0;
	var deltaCenterY = 0;
	
	if(thisObj.wrkAdornerWidth == 0 || thisObj.wrkAdornerHeight == 0)
	{
		deltaCenterX = thisObj.reflectedImageWidth / 2.0;
		deltaCenterY = thisObj.reflectedImageHeight / 2.0;
	}
	else
	{
		deltaCenterX = (thisObj.wrkAdornerWidth / 2.0) - thisObj.boundsRectX;
		deltaCenterY = (thisObj.wrkAdornerHeight / 2.0) - thisObj.boundsRectY;
	}
	
	if(reflecDiv)
	{
		reflecDiv.style.top = thisObj.reflectedImageY+'px';
		reflecDiv.style.left = thisObj.reflectedImageX+'px';
		reflecDiv.style.width = thisObj.reflectedImageWidth+'px';
		reflecDiv.style.height = thisObj.reflectedImageHeight+'px';
		if(!is.awesomium)
			reflecDiv.style.transformOrigin = deltaCenterX+'px '+deltaCenterY+'px 0px';
	}
	
	if(reflecSVG)
	{
		reflecSVG.style.width = thisObj.reflectedImageWidth+'px';
		reflecSVG.style.height = thisObj.reflectedImageHeight+'px';
	}
	
	
	if(reflecImg)
	{
		reflecImg.width.baseVal.valueInSpecifiedUnits = thisObj.reflectedImageWidth;
		reflecImg.height.baseVal.valueInSpecifiedUnits = thisObj.reflectedImageHeight;
	}

	if(reflecMask)
	{
		reflecMask.width.baseVal.valueInSpecifiedUnits = thisObj.reflectedImageWidth;
		reflecMask.height.baseVal.valueInSpecifiedUnits = thisObj.reflectedImageHeight;
	}

	if(is.awesomium)
	{
		var page = document.getElementById('pageDIV');
		if(page)
		{
			var divRebuild = page.removeChild(reflecDiv);
			page.appendChild(divRebuild);
		}
	}
	
}

function ModifyImageTag(thisObj, objAttribs, bResp)
{
	var divTag = document.getElementById(thisObj.name);
	if(divTag)
	{
		var svgTag = divTag.getElementsByTagName('svg');
		//Only do inline modifications if it is svg
		if(svgTag && svgTag.length > 0 )
		{
			svgTag = svgTag[0];
			var imageTag = svgTag.getElementById(thisObj.name+'Img');
			var bSVGImage = (imageTag?true:false);
			if(bSVGImage)
			{
				svgTag.width.baseVal.valueInSpecifiedUnits = objAttribs.width;
				svgTag.height.baseVal.valueInSpecifiedUnits = objAttribs.height;
				
				if(imageTag)
				{
					imageTag.width.baseVal.valueInSpecifiedUnits = thisObj.w;
					imageTag.height.baseVal.valueInSpecifiedUnits = thisObj.h;
				}
			}			
		}
	}
	
	
	
	var objMap = document.getElementById(thisObj.name+"MapArea");
	if(objMap)
	{
	  if(AdjustClickPointsForAct(thisObj, bResp))
	  {
		if(thisObj.bSVGMap)
		{
			var newPath = '\n<path d="' + thisObj.str_SvgMapPath + '"/>\n';
			objMap.innerHTML = newPath;
			var svgMapTag = document.getElementById(thisObj.name+"SVG");
			if(svgMapTag)
			{
				svgMapTag.width.baseVal.value = thisObj.w;
				svgMapTag.height.baseVal.value = thisObj.h;
			}
		}
		else
			objMap.coords = thisObj.str_ImageMapCoords;  
	 }
	  
	}
	if(typeof(bResp) == "undefined")
		FindAndModifyObjCSS(thisObj);
}

function ModifyTextEffect(thisObj)
{
	if(typeof(thisObj.hasBorder) != "undefined" && thisObj.hasBorder > 0)
	{
		if(thisObj.lineStyle >=3)
		{
			var borderTag = document.getElementById(thisObj.name+"border");
			//If we cannot find the div then there is nothing for us to do
			if(!borderTag)
				return;
			borderTag.width.baseVal.valueInSpecifiedUnits = thisObj.w;
			borderTag.height.baseVal.valueInSpecifiedUnits = thisObj.h;
			
			var pIh = (thisObj.h/thisObj.oh);
			var pIw = (thisObj.w/thisObj.ow);
			
			var borderArray = [thisObj.borderLeft, thisObj.borderTop, thisObj.borderBottom, thisObj.borderRight];
			var adjustedBorder = [];
			//Adjust the coordinates of the border
			for (var count = 0; count < 4; count++)
			{
				var pts = borderArray[count].toString().split(",");
				var ptsStr = "";
				for (index = 0; index < pts.length; index++)
				{
					var x = 0;
					var y = 0;
					if(index%2 == 0)
					{
						x = parseFloat(pts[index]);
						if(x)
						{
							x = x * pIw;
							ptsStr+= x.toFixed(2).toString();
						}
						else
						{
							ptsStr+=pts[index];
						}
					}
					else
					{
						y = parseFloat(pts[index]);
						if(y)
						{
							y = y * pIh;
							ptsStr+= y.toFixed(2).toString();
						}
						else
						{
							ptsStr+=pts[index];
						}
					}
					if(index+1 != pts.length)
						ptsStr+= ", ";
				}
				adjustedBorder.push(ptsStr);
			}
			var polyArr = borderTag.getElementsByTagName("polygon");
			if(polyArr)
			{
				for( var index = 0; index < polyArr.length; index++)
				{
					var polyTag = polyArr[index];
					polyTag.setAttribute("points", adjustedBorder[index]);
				}
			}
			
			var txtDiv = document.getElementById(thisObj.name+"div");
			txtDiv.style.width = (thisObj.w - (parseFloat(txtDiv.style.left)*2))+"px";
			txtDiv.style.height = (thisObj.h - (parseFloat(txtDiv.style.top)*2))+"px";
		}
		else
		{
			var txtDiv = document.getElementById(thisObj.name);
			if(txtDiv)
			{
				txtDiv.style.width = thisObj.w+"px";
				txtDiv.style.height = thisObj.h+"px";
			}
		}
	}
	
	if((typeof(thisObj.hasOuterShadow) != "undefined" && thisObj.hasOuterShadow) ||
	   (typeof(thisObj.hasTextShadow) != "undefined" && thisObj.hasTextShadow))
	{
		var txtDiv = document.getElementById(thisObj.name);
		if(txtDiv)
		{
			txtDiv.style.width = thisObj.w+"px";
			txtDiv.style.height = thisObj.h+"px";
		}
	}
}

function UpdateObjLayerValues(thisObj)
{
	if(thisObj)
	{
		if(thisObj.objLyr)
		{		
			var objDiv = document.getElementById(thisObj.name);
			
			objDiv.style.clip = "";
			objDiv.style.left = "";
			objDiv.style.top = "";
			
			thisObj.objLyr.x = objDiv.offsetLeft;
			thisObj.objLyr.y = objDiv.offsetTop;
			thisObj.objLyr.w = objDiv.offsetWidth;
			thisObj.objLyr.h = objDiv.offsetHeight;
			
			thisObj.objLyr.hasMoved = false; //LD-2124
		}
	}
	else
	{
		for (var index = 0; index < arObjs.length; index++)
		{
			UpdateObjLayerValues(arObjs[index]);
		}
	}
}

//LHD --- LD-1407 Special security check
function IsVmlCheck(isIe8Or9)
{
	if ( (isIe8Or9) && document.namespaces && !document.namespaces['v'] )
		document.namespaces.add('v', 'urn:schemas-microsoft-com:vml', "#default#VML");

	var bIsEnabled = true;
	try{
		var vmlCheck = document.createElement("v:oval");
		if(typeof(vmlCheck.filters) != "object")
			bIsEnabled = false;
	}
	catch(e){
		bIsEnabled = false;
	}
	return bIsEnabled;
}

function IsSvgCheck()
{
	var result = (document.createElementNS != undefined &&
				  document.createElementNS("http://www.w3.org/2000/svg", "path") &&
				  document.createElement("BUTTON").addEventListener != undefined); 
				
	return result;
}

function GetIdFromSvgSrc(src){
	var strId;
	
	var startPos = src.indexOf("id=\"") + 4;
	var endPos = src.indexOf("\"", startPos);
	
	strId = src.slice(startPos, endPos); 
	
	return strId;
}

function UseHtmlImgTag(obj){
	if( obj.bEmbeddedIE8IE9Img || !(obj.hasOuterShadow || obj.hasReflection || obj.r>0 || obj.vf == 1 || obj.hf == 1) )return true;
		
	return false;
}

//LHD --- LD-2019 In the case of firefox and flash applications we cannot perform scale
function CanScale()
{
	if( window.bTrivResponsive )
	{
		for (var index = 0; index < arObjs.length; index++)
		{
			if(typeof(ObjInline) != "undefined" && arObjs[index].constructor == ObjInline)
				if(arObjs[index].iType == "flash" && is.firefox)
					return false;
		}
		if(is.awesomium && window.bTrivRunView)
			return false;
	}
	return true;
}
//For YouTube API
function onYouTubeIframeAPIReady() 
{
	is.YTScriptLoaded = true;
}

//LHD Just a generic function for adding files to the head of the HTML
function AddFileToHTML(file, type, callBack)
{
	var tag = null;
	var tagChecker = '';
	
	if(type == "script")
	{
		//Ensure we only add once
		tagChecker = '<script type="text/javascript" src='+file+'>';
		if(document.getElementsByTagName('head')[0].innerHTML.indexOf(tagChecker) ==-1)
		{
			tag = document.createElement('script');
			tag.type = "text/javascript";
			tag.src = file;
			if(typeof(callBack) !== "undefined" && callBack != null)
			{
				if(!is.ie)
					tag.onreadystatechange = function(){callBack;};
				
				tag.onload = function(){callback;};
			}

			document.getElementsByTagName('head')[0].appendChild(tag);
		}			
	}
	
	if(type == "css")
	{
		//Ensure we only add once
		tagChecker = '<link rel="stylesheet" type="text/css" href='+file+'>';
		if(document.getElementsByTagName('head')[0].innerHTML.indexOf(tagChecker) ==-1)
		{
			tag = document.createElement('link');
			tag.rel = "stylesheet";
			tag.type = "text/css";
			tag.href = file;
			if(typeof(callBack) !== "undefined" && callBack != null)
			{
				if(!is.ie)
					tag.onreadystatechange = function(){callBack;};
				
				tag.onload = function(){callback;};
			}

			document.getElementsByTagName('head')[0].appendChild(tag);
		}			
	}		 
	
}

//echo LD-768 : Putting all degradation rules for IE into this function
//echo bug 21691 : Graceful Degradation
function ObjDegradeEffects(thisObj)
{
	
	//echo LD-838 : We use a css rotation for IE9 and a direct-x filter for rotation in IE8. 
	//              So the check for is.DXFilterSupported will not tell us if an IE browser in compatibility mode supports the way we do rotation.
	if(thisObj.name.indexOf("audio") > -1)
		thisObj.bCanRotate = false;
	else if(is.vml && is.ie8 && !is.DXFilterSupported)
		thisObj.bCanRotate = false;
	else
		thisObj.bCanRotate = true;
	
	if(is.vml)
	{
		if(!is.DXFilterSupported){
			thisObj.hasOuterShadow = false;
			thisObj.hasReflection = false;		
		}
		else if(thisObj.opacity < 100){
			thisObj.hasOuterShadow = false;
			thisObj.hasReflection = false;
		}
		else if(thisObj.r > 0){
			thisObj.hasOuterShadow = false;
			thisObj.hasReflection = false;
		}
		else if(thisObj.vf == 1 || thisObj.hf == 1){
			thisObj.hasOuterShadow = false;
			thisObj.hasReflection = false;
		}
		else if(is.ie8)
		{
			thisObj.hasOuterShadow = false;
			thisObj.hasReflection = false;
		}
	}
}

function GetDevicePreload()
{
	if(is.jsonData)
	{
		var respValues = is.jsonData[is.clientProp.device];
		var newValues = null;
		if(respValues)
			newValues = respValues[is.clientProp.width];
		if(newValues)
		{
			return newValues.preload;
		}
	}
	return '';
}

function GetPageWidth()
{
	var pageWidth = -1;
	if(window.bTrivResponsive)
	{
		if(is.jsonData != null)
		{
			var respValues = is.jsonData[is.clientProp.device];
			var newValues;
			newValues = respValues[is.clientProp.width];
			var obj = newValues["pageLayer"];
			if(obj)
			{
				pageWidth = obj.w;
			}
		}
		else
		{
			//If we don't have the responsive data use the defaults
			pageWidth = is.clientProp.width;
		}	
	}
	else
	{
		var pageDiv = document.getElementById("pageDIV");
		if(pageDiv)
		{
			pageWidth = parseInt(pageDiv.style.width);
		}
	}
	
	return pageWidth;
}

function adjustPage(width, height)
{
	var obj = {w: width, h: height};
	
	if(pageLayer)
	{
		pageLayer.ele.style.width = obj.w+'px';
		pageLayer.ele.style.height = obj.h+'px';
		if(!pageLayer.bInTrans)
			pageLayer.ele.style.clip = 'rect(0px,'+obj.w+'px,'+obj.h+'px,0px)';
	}
}

function CorrectForOffsetFromBottom(oldHeight, newHeight, ObjNotToCheck)
{
	var heightDiff = newHeight - oldHeight;
	var yOffset = 0;
	
	for (var index = 0; index < arObjs.length; index++)
	{
		if(arObjs[index] != ObjNotToCheck && arObjs[index].bBottom)
		{
			arObjs[index].y += heightDiff;
			arObjs[index].respChanges();
		}
	}
	
	writeStyleSheets( arObjs );
}
