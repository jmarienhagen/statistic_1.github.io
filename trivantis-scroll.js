/**************************************************
Trivantis (http://www.trivantis.com) 
**************************************************/

function ObjScroll(n,a,x,y,w,h,v,z,c,f,d,cl) {
  this.name=n;
  this.altName = a;
  this.x=x
  this.y=y
  this.w=w
  this.h=h
  this.frame=f
  this.v = v
  this.bgColor=c
  this.z = z
  this.obj=this.name+"Object"
  this.parmArray = new Array
  this.numParms = 0
  this.hrefPrompt = 'javascript:void(null);'
  this.alreadyActioned = false;
  this.foldertree=null
  this.foldersToOpen = new Array
  this.numFTO = 0
  this.selNode = null
  this.currUrl = null;
  var tocCheck = this.name.substr(0,3)
  this.useIFrame=true
  if( !this.useIFrame ) this.w -= 16
  eval(this.obj+"=this")
  ObjScroll.list[ObjScroll.list.length]=this

  if ( d != 'undefined' && d!=null )
    this.divTag = d;
  else  
    this.divTag = "div";
    
  if( !this.useIFrame ) {
    this.dim=new Object()
    this.dim.barV=new Array(this.w,16,16,this.h-2*16,16,34)
    this.dim.up=new Array(this.w,0,16,16)
    this.dim.dn=new Array(this.w,this.h-16,16,16)
    this.makeObjects('images/')
    this.barV.setImages('scroll-bgv.gif','scroll-boxv.gif',null,'images/')
    this.upImg.setImages('scroll-up0.gif','scroll-up1.gif','images/')
    this.dnImg.setImages('scroll-dn0.gif','scroll-dn1.gif','images/')
    this.window.border=1
  }
  this.addClasses = cl;
}

{ //Setup prototypes
var p=ObjScroll.prototype
p.useIFrame=false
p.makeObjects=ObjScrollMakeObjects
p.build=ObjScrollBuild
p.init = ObjScrollInit
p.activate=ObjScrollActivate
p.moveBars=ObjScrollWMoveBars
p.moveWindowV=ObjScrollBMoveWindowV
p.load=ObjScrollLoad
p.addParm=ObjScrollAddParm
p.actionGoTo = ObjScrollActionNULL
p.actionGoToNewWindow = ObjScrollActionNULL
p.actionPlay = ObjScrollActionNULL
p.actionStop = ObjScrollActionNULL
p.actionShow = ObjScrollActionShow
p.actionHide = ObjScrollActionHide
p.actionLaunch = ObjScrollActionNULL
p.actionExit = ObjScrollActionNULL
p.actionChangeContents = ObjScrollActionChangeContents
p.actionTogglePlay = ObjScrollActionNULL
p.actionToggleShow = ObjScrollActionToggleShow
p.onShow = ObjScrollOnShow
p.onHide = ObjScrollOnHide
p.isVisible = ObjScrollIsVisible
p.sizeTo =  ObjScrollSizeTo
p.loadProps = ObjLoadProps
p.respChanges = ObjRespChanges
p.respChangesModifyCSS = ObjRespChangesModifyCSS
}

function ObjScrollAddParm( newParm ) {
  this.parmArray[this.numParms++] = newParm;
}

function ObjScrollActionNULL( ) {
}

function ObjScrollActionShow( ) {
  if( !this.objLyr ) {
    if( !this.activated ) setTimeout( this.obj + ".actionShow()", 1000 );
  }
  else {
    if( !this.isVisible() )
      this.onShow();
  }
}

function ObjScrollActionHide( ) {
  if( !this.objLyr ) {
    if( !this.activated ) setTimeout( this.obj + ".actionHide()", 1000 );
  }
  else {
    if( this.isVisible() )
      this.onHide();
  }
}

function ObjScrollActionChangeContents( newDoc ) {
  this.load( newDoc )
}

function ObjScrollActionToggleShow( ) {
  if( !this.objLyr ) {
    if( !this.activated ) setTimeout( this.obj + ".actionToggleShow()", 1000 );
  }
  else {
    if(this.objLyr.isVisible()) this.actionHide();
    else this.actionShow();
  }
}

function ObjScrollOnShow() {
  this.alreadyActioned = true;
  this.objLyr.actionShow();
}

function ObjScrollOnHide() {
  this.alreadyActioned = true;
  this.objLyr.actionHide();
}

function ObjScrollIsVisible() {
  if( this.objLyr.isVisible() )
    return true;
  else
    return false;
}

function ObjScrollMakeObjects(dir) {
  if( this.useIFrame ) return
  var a
  a=this.dim.barV; this.barV=new ObjScrollB(a[0],a[1],a[2],a[3],a[4],a[5])
  this.barV.onScroll=new Function(this.obj+'.moveWindowV()')
  this.barV.divTag = this.divTag
  this.barV.v = this.v
  a=this.dim.up; this.upImg=new ObjScrollBI(a[0],a[1],a[2],a[3])
  a=this.dim.dn; this.dnImg=new ObjScrollBI(a[0],a[1],a[2],a[3])
  this.upImg.divTag = this.divTag
  this.upImg.v = this.v
  this.dnImg.divTag = this.divTag
  this.dnImg.v = this.v
  this.upImg.onDown=new Function(this.obj+'.window.up()')
  this.upImg.onUp=new Function(this.obj+'.window.stop()')
  this.dnImg.onDown=new Function(this.obj+'.window.down()')
  this.dnImg.onUp=new Function(this.obj+'.window.stop()')
  this.window=new ObjScrollW(0,0,this.w,this.h,this.frame,this.bgColor)
  this.window.divTag = this.divTag
  this.window.v = this.v
  this.window.onScroll=new Function(this.obj+'.moveBars()')
}

function ObjScrollBuild() {
	this.loadProps();
	
  if( this.useIFrame ) {
    this.css=buildCSS(this.name,this.x,this.y,this.w,this.h,this.v,this.z, this.bgColor)
	this.css = increaseClipRect(this.css, 4);
    this.divStart='<' + this.divTag + ' id="'+this.name+'"'
    if( this.addClasses ) this.divStart += ' class="'+this.addClasses+'"'
	this.divStart += '><a name="'+this.name+'anc">\n'
    this.divEnd='</a></' + this.divTag + '>'
  }
  else {
    this.window.build()
    this.css=buildCSS(this.name,this.x,this.y,null,null,this.v,this.z)+this.window.css
    this.css+=buildCSS(this.name+'CT',0,0,this.w,1,null,null,'black')+buildCSS(this.name+'CL',0,0,1,this.h,null,null,'black')
    this.barV.boxvis='hidden'
    this.barV.build()
    this.upImg.build()
    this.dnImg.build()
    this.css+=this.barV.css+this.upImg.css+this.dnImg.css
    this.divStart='<' + this.divTag + ' id="'+this.name+'"'
    if( this.addClasses ) this.divStart += ' class="'+this.addClasses+'"'
	this.divStart += '><a name="'+this.name+'anc">\n'+this.barV.div+this.upImg.div+this.dnImg.div+this.window.divStart
    this.divEnd=this.window.divEnd+'<' + this.divTag + ' id="'+this.name+'CT"></' + this.divTag + '><' + this.divTag + ' id="'+this.name+'CL"></' + this.divTag + '>\n</a></' + this.divTag + '>'
  }
  this.div = this.divStart
  for (var i=0; i < this.numParms; i++) this.div = this.div + this.parmArray[i]
  this.div = this.div + this.divEnd
}

function ObjScrollInit() {
  this.objLyr = new ObjLayer(this.name)
}

function ObjScrollActivate(w,h,reset) {
  if (!this.activated) {
    if( this.objLyr && this.objLyr.styObj && !this.alreadyActioned )
      if( this.v ) this.actionShow()
    if( this.useIFrame ) {
      this.activated = true
      return
    }
    this.barV.activate()
	this.upImg.activate()
	this.dnImg.activate()
  }
  else if( this.useIFrame ) return
  this.window.activate(w,h)
  if (reset!=false) this.barV.boxlyr.moveTo(null,0)
  if (!this.window.enableVScroll) {
    this.barV.boxlyr.hide()
	if(this.activated) this.window.contentlyr.moveTo(null,0)
  }
  else {
    this.barV.boxlyr.styObj.visibility="inherit"
	var cH = this.window.contentHeight
	if(this.activated && cH>this.window.h && cH+this.window.contentlyr.y<this.window.h)this.window.contentlyr.moveTo(null,this.window.h-cH)
  }
  this.activated=true
}

function ObjScrollLoad(url) {
  this.currUrl = url;
  if (this.useIFrame ) {
    if( !this.activated ) this.activate()
    var dX = this.w
    var dY = this.h
    if( is.ns5 || is.ie8 || is.ie9 || is.ie10) { dX -= 4; dY -= 4; }
	
	if(this.useIFrame)
		this.objLyr.write( '<iframe title="'+this.altName+'" name="'+this.name+'Frame" src=' + url + ' width="100%" height="100%" allowTransparency="true" onload="' + this.obj + '.respChangesModifyCSS()"/></iframe>' )
	else
		this.objLyr.write( '<iframe title="'+this.altName+'" name="'+this.name+'Frame" src=' + url + ' width=' + dX + ' height=' + dY + ' allowTransparency="true" /></iframe>' )
  }
  else this.window.load(url)
}

function ObjScrollWMoveBars() {
  if (this.window.enableVScroll) this.barV.boxlyr.moveTo(null,this.window.getYfactor()*this.barV.offsetHeight)
}

function ObjScrollBMoveWindowV() {
  if (this.window.enableVScroll) this.window.contentlyr.moveTo(null,-this.barV.getYfactor()*this.window.offsetHeight)
}

function ObjScrollTestActive() {
  return false
}

function ObjScrollSizeTo( w, h, bResp ) {
  this.w = w
  this.h = h
  if( this.objLyr)
  {
	if(!this.useIFrame)
		this.actionChangeContents(this.currUrl)
	
	if(typeof(bResp) == "undefined")
		this.objLyr.clipTo( 0, w, h, 0  )
  }
}

ObjScroll.list=new Array()

function ObjScrollW(x,y,width,height,frame,bgcolor) {
  this.name="ObjScrollW"+(ObjScrollW.count++)
  this.x=x
  this.y=y
  this.w=width
  this.h=height
  this.frame=(frame!=null)? window.top.frames[frame] : parent
  this.scrollFrame=null
  if( this.frame == null ) this.frame = parent
  if (bgcolor) this.bgColor=bgcolor
  this.obj=this.name+"Object"
  eval(this.obj+"=this")
}

{ //Setup prototypes
var p=ObjScrollW.prototype
p.border=1
p.bgColor='white'
p.build=ObjScrollWBuild
p.activate=ObjScrollWActivate
p.up=ObjScrollWUp
p.down=ObjScrollWDown
p.left=ObjScrollWLeft
p.right=ObjScrollWRight
p.stop=ObjScrollWStop
p.getYfactor=ObjScrollWGetYfactor
p.load=ObjScrollWLoad
p.reload=ObjScrollWReload
p.back=ObjScrollWBack
p.forward=ObjScrollWForward
p.writeContent=ObjScrollWWriteContent
p.jumpTo=ObjScrollWJumpTo
p.history=new Array()
p.historyLoc=-1
p.historyLen=-1
p.onScroll=new Function()
p.onLoad=new Function()
}

function ObjScrollWBuild() {
	
  var w=this.w
  var h=this.h
  var b=this.border
  this.css=buildCSS(this.name,this.x,this.y,w,h,null,null,this.bgColor)+
  buildCSS(this.name+'Sc',b,b,w-2*b,h-2*b,null,null,this.bgColor)
  if (this.border>0) this.css+=buildCSS(this.name+'BT',0,0,w,b,null,null,'black')+buildCSS(this.name+'BB',0,h-b,w,b,null,null,'black')+buildCSS(this.name+'BL',0,0,b,h,null,null,'black')+buildCSS(this.name+'BR',w-b,0,b,h,null,null,'black')
  this.css+=buildCSS(this.name+'Co',0,0,w-2*b,null,null,null,this.bgColor)
  this.divStart='<iframe name="'+this.name+'Frame" width=0 height=0 style="position:absolute; left:0; top:0; visibility:none"></iframe>\n'
  this.divStart+='<' + this.divTag + ' id="'+this.name+'">'+
  '<' + this.divTag + ' id="'+this.name+'Sc">'
  this.divStart+='<' + this.divTag + ' id="'+this.name+'Co">'
  this.divEnd='</' + this.divTag + '>'
  this.divEnd+='</' + this.divTag + '>'
  if (this.border>0) this.divEnd+='<' + this.divTag + ' id="'+this.name+'BT"></' + this.divTag + '><' + this.divTag + ' id="'+this.name+'BB"></' + this.divTag + '><' + this.divTag + ' id="'+this.name+'BL"></' + this.divTag + '><' + this.divTag + ' id="'+this.name+'BR"></' + this.divTag + '>\n'
  this.divEnd+='</' + this.divTag + '>'
  this.div=this.divStart+this.divEnd
}

function ObjScrollWActivate(w,h) {
  if( !this.scrollFrame ) return;
  if (!this.activated) {
    this.objLyr=new ObjLayer(this.name)
    if( this.v ) this.objLyr.show()
    this.screenlyr=new ObjLayer(this.name+'Sc')
    this.screenlyr.show()
    this.blocklyr=new Array()
    this.blockActive=0
  }
  if (this.scrollFrame.document.body.innerHTML) document.all[this.name+'Co'].innerHTML=this.scrollFrame.document.body.innerHTML
  this.contentlyr=new ObjLayer(this.name+'Co')
  this.contentlyr.show()
  var c=this.contentlyr
  c.onSlide=new Function(this.obj+'.onScroll()')
  this.contentHeight=h||((is.ns)?c.doc.height:c.ele.scrollHeight)
  this.contentWidth=w||((is.ns)?c.doc.width:c.ele.scrollWidth)
  if (is.ns) {
    c.styObj.clip.bottom=Math.max(this.contentHeight,this.h)
    c.styObj.clip.right=Math.max(this.contentWidth,this.w)
  }
  this.offsetHeight=this.contentHeight-this.screenlyr.h
  this.offsetWidth=this.contentWidth-this.screenlyr.w
  this.enableVScroll=(this.offsetHeight>1)
  this.enableHScroll=(this.offsetWidth>1)
  this.onScroll()
  this.onLoad()
  this.activated=true
}

function ObjScrollWLoad(url) {
  if (url != this.url) {
    this.historyLoc+=1
	this.historyLen=this.historyLoc
	this.history[this.historyLen]=url
  }
  this.reload(0)
}

function ObjScrollWBack() {
  if (this.historyLoc>0) this.reload(-1)
}

function ObjScrollWForward() {
  if (this.historyLoc<this.historyLen) this.reload(1)
}

function locateScrollFrame( frameName, currFrame ) {
  if( currFrame[frameName] ) return currFrame[frameName]
  else {
    var index = 0
    while( index < currFrame.length ) {
      var testFrame = locateFrame( frameName, currFrame[index] )
      if( testFrame ) return testFrame
      index++
    }
  }
}

function ObjScrollWReload(i) {
  this.historyLoc+=i
  this.url=this.history[this.historyLoc]
  this.refresh=true
  if (is.ns) {
    this.contentlyr=new ObjLayer(this.name+'Co')
    this.contentlyr.show()
    this.contentlyr.moveTo(0,0)
    if( is.ns5 ) this.contentlyr.ele.innerHTML="<iframe src='" + this.url + "'></iframe>"
    else this.contentlyr.ele.load(this.url,this.w-2*this.border)
  }
  else {
    var targFrameName = this.name+'Frame'
    var targFrame = locateScrollFrame( targFrameName, this.frame.frames )
    if( targFrame ) {            
      this.scrollFrame = targFrame
      this.scrollFrame.document.location=this.url
    }
  }
}

function ObjScrollWUp() {
  if (this.enableVScroll) this.contentlyr.slideTo(null,0,10,20)
}

function ObjScrollWDown() {
  if (this.enableVScroll) this.contentlyr.slideTo(null,-this.offsetHeight,10,20)
}

function ObjScrollWLeft() {
  if (this.enableHScroll) this.contentlyr.slideTo(0,null,10,20)
}

function ObjScrollWRight() {
  if (this.enableHScroll) this.contentlyr.slideTo(-this.offsetWidth+0,null,10,20)
}

function ObjScrollWStop() {
  if (this.activated) this.contentlyr.slideActive=false
}

function ObjScrollWGetYfactor() {
  if (this.offsetHeight==0) return 0
  return Math.min((this.offsetHeight-this.contentlyr.y)/this.offsetHeight-1,1)
}

function ObjScrollWWriteContent(doc) {
  doc.write(buildCSS('content',0,0,this.w-2*this.window.border))
}

function ObjScrollWJumpTo(x,y) {
  this.contentlyr.moveTo((x!=null)?Math.max(-x,-this.offsetWidth):null,(y!=null)?Math.max(-y,-this.offsetHeight):null)
  this.onScroll()
}
ObjScrollW.count=0

function ObjScrollB(x,y,width,height,boxW,boxH) {
  this.name="ObjScrollB"+(ObjScrollB.count++)
  this.x=x
  this.y=y
  this.w=width
  this.h=height
  this.boxW=boxW
  this.boxH=boxH
  this.offsetHeight=this.h-this.boxH
  this.offsetWidth=this.w-this.boxW
  this.obj=this.name+"Object"
  this.mouseIsDown=false
  eval(this.obj+"=this")  
}

{ //Setup prototypes
var p=ObjScrollB.prototype
p.active=false
p.boxvis=null
p.dragActive=false
p.build=ObjScrollBBuild
p.activate=ObjScrollBActivate
p.mousedown=ObjScrollBMouseDown
p.mousemove=ObjScrollBMouseMove
p.mouseup=ObjScrollBMouseUp
p.finishSlide=new Function()
p.getYfactor=ObjScrollBGetYfactor
p.setImages=ObjScrollBSetImages
p.onScroll=new Function()
}

function ObjScrollBSetImages(bg,box,shade,dir) {
  if (!dir) dir=''
  this.bgImg=(bg!=null)?dir+bg:''
  this.boxImg=(box!=null)?dir+box:''
  this.shadeImg=(shade!=null)?dir+shade:''
}

function ObjScrollBBuild() {
  with(this) {
    var bg=bgImg? 'background-image:URL('+bgImg+'); layer-background-image:URL('+bgImg+'); repeat:yes; ':''
    var box=boxImg? '<img src="'+boxImg+'" width='+boxW+' height='+boxH+'>' : ''
    var shade=shadeImg? '<' + this.divTag + ' id="'+name+'Sh"><img src="'+shadeImg+'"></' + this.divTag + '>\n' : ''
    this.css=buildCSS(name,x,y,w,h,null,null,null,bg)+
    buildCSS(name+'Bx',0,0,boxW,boxH,boxvis,null,null)+
    buildCSS(name+'C',0,0,w,h)
    if (shadeImg) this.css+=buildCSS(name+'Sh',0,0)
    this.div='<' + this.divTag + ' id="'+name+'">'+shade+'<' + this.divTag + ' id="'+name+'Bx">'+box+'</' + this.divTag + '><' + this.divTag + ' id="'+name+'C"></' + this.divTag + '></' + this.divTag + '>\n'
  }
}

function ObjScrollBActivate() {
  this.objLyr=new ObjLayer(this.name)
  if( this.v ) this.objLyr.show()
  this.boxlyr=new ObjLayer(this.name+'Bx')
  this.boxlyr.show()
  this.boxlyr.onSlide=new Function(this.obj+'.onScroll()')
  this.objLyrc=new ObjLayer(this.name+'C')
  this.objLyrc.show()
  this.objLyrc.ele.scrollbar=this.obj
  this.objLyrc.ele.onmousedown=ObjScrollBMouseSDown
  this.objLyrc.ele.onmousemove=ObjScrollBMouseSMove
  this.objLyrc.ele.onmouseup=ObjScrollBMouseSUp
  this.objLyrc.ele.onmouseover=new Function(this.obj+'.active=true')
  this.objLyrc.ele.onmouseout=new Function(this.obj+'.active=false')
  this.boxlyr.ele.scrollbar=this.obj
  this.boxlyr.ele.onmousedown=ObjScrollBMouseIEDown
  this.boxlyr.ele.onmousemove=ObjScrollBMouseIEMove
  this.boxlyr.ele.onmouseup=ObjScrollBMouseIEUp
  this.boxlyr.ele.onmouseover=new Function(this.obj+'.active=true')
  this.boxlyr.ele.onmouseout=new Function(this.obj+'.active=false')
}

function ObjScrollBMouseSDown(e) {
  eval(this.scrollbar+'.mousedown('+(is.ns?e.layerX:event.offsetX)+','+(is.ns?e.layerY:event.offsetY)+')');
  return false
}

function ObjScrollBMouseSMove(e) {
  var theObj = eval(this.scrollbar);
  if( is.ie && !event.button ) return false
  if( theObj.mouseIsDown ) eval(this.scrollbar+'.mousemove('+(is.ns?e.layerX:event.offsetX)+','+(is.ns?e.layerY:event.offsetY)+')');
  return false
}

function ObjScrollBMouseSUp(e) {
  eval(this.scrollbar+'.mouseup()');
  return false
}

function ObjScrollBMouseIEDown(e) {
  var theObj = eval(this.scrollbar);
  var xPos=event.offsetX+theObj.boxlyr.x
  var yPos=event.offsetY+theObj.boxlyr.y
  eval(this.scrollbar+'.mousedown('+xPos+','+yPos+')');
  return true
}

function ObjScrollBMouseIEMove(e) {
  var theObj = eval(this.scrollbar);
  if( theObj.mouseIsDown ) {
    if( !event.button ) eval(this.scrollbar+'.mouseup()');
    else if( event.offsetX >= 0 && event.offsetX <= theObj.boxlyr.w && event.offsetY >= 0 && event.offsetY <= theObj.boxlyr.h ) {
      var xPos=event.offsetX+theObj.boxlyr.x
      var yPos=event.offsetY+theObj.boxlyr.y
      eval(this.scrollbar+'.mousemove('+xPos+','+yPos+')');
      event.returnValue=false
      event.cancelBubble=true
    }
  }
  return true
}

function ObjScrollBMouseIEUp(e) {
  eval(this.scrollbar+'.mouseup()');
  return true
}

function ObjScrollBMouseDown(x,y) {
  this.mouseIsDown=true
  if (x>this.boxlyr.x && x<=this.boxlyr.x+this.boxlyr.w && y>this.boxlyr.y && y<=this.boxlyr.y+this.boxlyr.h) {
    this.dragX=x-this.boxlyr.x
	this.dragY=y-this.boxlyr.y
	this.dragActive=true
  }
  else if (!this.boxlyr.slideActive) {
	var newx=x-this.boxW/2
	var newy=y-this.boxH/2
	if (newx<0) newx=0
	if (newx>=this.offsetWidth) newx=this.offsetWidth
	if (newy<0) newy=0
	if (newy>=this.offsetHeight) newy=this.offsetHeight
	this.boxlyr.slideTo(newx,newy,10,20,this.obj+'.finishSlide()')
  }
}

function ObjScrollBMouseMove(x,y) {
  if (!this.dragActive || this.boxlyr.slideActive) return
  var newx=x-this.dragX
  var newy=y-this.dragY
  if (x-this.dragX<0) newx=0
  if (x-this.dragX>=this.offsetWidth) newx=this.offsetWidth
  if (y-this.dragY<0) newy=0
  if (y-this.dragY>=this.offsetHeight) newy=this.offsetHeight
  this.boxlyr.moveTo(newx,newy)
  this.onScroll()
}

function ObjScrollBMouseUp() {
  this.mouseIsDown=false
  this.dragActive=false
  this.boxlyr.slideActive=false
}

function ObjScrollBGetYfactor() {
  return 1-(this.offsetHeight-this.boxlyr.y)/this.offsetHeight||0
}

ObjScrollB.count=0
function ObjScrollBI(x,y,w,h) {
  this.x = x
  this.y = y
  this.w = w
  this.h = h
  this.name = "ObjScrollBI"+(ObjScrollBI.count++)
  this.obj = this.name+"Object"
  eval(this.obj+"=this")
}

{ //Setup prototypes
var p = ObjScrollBI.prototype
p.setImages = ObjScrollBISetImages
p.build = ObjScrollBIBuild
p.activate = ObjScrollBIActivate
p.down = ObjScrollBIDown
p.up = ObjScrollBIUp
p.change = ObjScrollBIChange
p.onDown = new Function()
p.onUp = new Function()
}

function ObjScrollBISetImages(off,on,dir) {
  this.i0 = new Image()
  this.i = this.i0.src = (dir||'')+off
  this.i1 = new Image()
  this.i1.src = (dir||'')+on
}

function ObjScrollBIBuild() {
  with(this) {
    this.css = buildCSS(name,x,y,w,h)+buildCSS(name+'C',0,0,w,h)
    this.div = '<' + this.divTag + ' id="'+name+'"><img name="'+name+'Img" src="'+i+'" width='+w+' height='+h+'><' + this.divTag + ' id="'+name+'C">'+'</' + this.divTag + '></' + this.divTag + '>\n'
  }
}

function ObjScrollBIActivate() {
  this.objLyr = new ObjLayer(this.name)
  if( this.v ) this.objLyr.show()
  this.clyr = new ObjLayer(this.name+'C')
  this.clyr.show()
  this.objLyr.ele.onmousedown = new Function(this.obj+".down(); return false;")
  this.objLyr.ele.onmouseup = new Function(this.obj+".up(); return false;")
}

function ObjScrollBIDown() {this.change(this.i1);this.onDown()}
function ObjScrollBIUp() {this.change(this.i0);this.onUp()}
function ObjScrollBIChange(img) {this.objLyr.doc.images[this.name+"Img"].src = img.src}
ObjScrollBI.count = 0

function ObjLoadProps()
{
	if(is.jsonData != null)
	{
		var respValues = is.jsonData[is.clientProp.device];
		var newValues;
		newValues = respValues[is.clientProp.width];
		var obj = newValues[this.name];
		if(obj)
		{
			this.x = typeof(obj.x)!="undefined"?obj.x:this.x;
			this.y = typeof(obj.y)!="undefined"?obj.y:this.y;
			this.w = typeof(obj.w)!="undefined"?obj.w:this.w;
			this.h = typeof(obj.h)!="undefined"?obj.h:this.h;
            if( typeof(obj.fsize) != "undefined" )
                this.fsize = obj.fsize;
		}
	}
}

function ObjRespChanges()
{
	if(this.objLyr)
	{
        this.sizeTo(this.w, this.h, true);
		this.respChangesModifyCSS();
	}
}

function ObjRespChangesModifyCSS()
{
	if(this.objLyr)
	{
        FindAndModifyObjCSSBulk(this,this.stylemods)
        
        //Adjust the CSS written in the head of the iframe.
        var myFrame = document.getElementsByName(this.name+'Frame');
        if( myFrame.length >= 0 )
        {
			var styleTags = null;
			try{
			    styleTags = myFrame[0].contentWindow.document.getElementsByTagName('head')[0].getElementsByTagName('style');
			}catch(e){
				if(e&&e.message) console.log(e.message);
			}
				
            for(var index = 0; styleTags && index < styleTags.length; index++)
            {
                var styTag = styleTags[index];
                if(styTag.innerHTML.indexOf(" a ") > -1)
                {
                    var styleTag = styTag;
                    if(styleTag)
                        ModifyCSSForResponsiveForIframe(styleTag, this, " a ");
                }
            }
        }
	}
}

function ModifyCSSForResponsiveForIframe(styleTag, thisObj, scopeName)
{
	var scopeNamePos = styleTag.innerHTML.indexOf(scopeName);
    while( scopeNamePos != -1 )
    {
        var startPos = -1;
        var endPos = -1;
        var bPrefix = false;
    
        startPos = styleTag.innerHTML.indexOf("{",scopeNamePos+scopeName.length)+1;
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
                    attrib = ApplyCSSResponsiveChanges(attrib, thisObj);
                    newCSS = newCSS + attrib;
                }
            }
            originalStr = scopeName.trim()+" {"+originalStr+"}";
            newCSS = scopeName.trim()+" {"+newCSS+"}";
            styleTag.innerHTML = styleTag.innerHTML.replace(originalStr, newCSS);
            
            scopeNamePos = styleTag.innerHTML.indexOf(scopeName, endPos+1);
        }
        else
            break;
    }
}

function increaseClipRect(cssStr, delta)
{
	var width;
	var height;
	var tempStr;
	var startPos;
	var endPos;
	
	startPos = cssStr.indexOf( " ", cssStr.indexOf("clip:rect(") );
	endPos = cssStr.indexOf("px", startPos);
	
	tempStr = cssStr.slice(0, startPos + 1);
	width = cssStr.slice(startPos, endPos);
	tempStr += (parseInt(width) + delta) + "px ";
	
	startPos = cssStr.indexOf(" ", endPos);
	endPos = cssStr.indexOf("px", startPos);
	
	height = cssStr.slice(startPos, endPos);
	tempStr += (parseInt(height) + delta) + "px ";
	tempStr += cssStr.slice(endPos + 2);
	
	return tempStr;
}