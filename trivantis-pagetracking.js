function PageTrackingObj(exp, titleName, cm, frame){
   this.VarTrivPageTracking = new Variable( 'VarTrivPageTracking', null, 0, cm, frame, exp, titleName, true );
   this.numPages = 0;
   this.publishTimeStamp = 0;
   this.title = null;
}

PageTrackingObj.prototype.InitPageTracking = function ( )
{
	var THIS = this;
	var pageTrackData = this.VarTrivPageTracking.getValue();
	var bDoInit = true;
	try {
	    if (pageTrackData && pageTrackData.length > 0 && pageTrackData != '~~~null~~~')
	    {
	        var topLevelSplit = pageTrackData.split('#');
	        if (topLevelSplit && topLevelSplit.length > 1)
            {
		        var arrIds = topLevelSplit[0].split(',');
		        var arrStatus = topLevelSplit[1].split('');
		        var bits = 4;
		        for( var i=0; i<arrIds.length; i++ )
		        {
			        var id = parseInt( '0x' + arrIds[i] );
			        var mask = 1<<(i%bits);
			        var status = ( parseInt('0x'+arrStatus[Math.floor(i/bits)] ) & mask ) == 0 ? 1 : 2;
			        var node = this.FindNode( this.title, id );
			        if( node )
				        node.v = status;
		        }
    		}
        }
    } catch (e) { }
}

PageTrackingObj.prototype.FindNode = function( node, id )
{
	if( node.id == id )
		return node;
	
	var match = null;
	if( typeof( node.c ) != 'undefined' ){
		for( var i=0; i<node.c.length; i++ ){
			match = this.FindNode( node.c[i], id );
			if( match != null )
				break;
		}
	}
	
	return match;
}

PageTrackingObj.prototype.InternalGetRangeStatus = function( node )
{
	if( node == null )
		return -1;
		
	if( typeof(node.c) == 'undefined' )
	{
		return node.v;
	}
	else
	{
		// we need to calculate
		if( node.v == 0 )
		{
			var bAllComplete = true;
			var bInprogress = false;
			for( var i=0; i<node.c.length; i++ )
			{
				var cnode = node.c[i];
				var status = this.InternalGetRangeStatus( cnode );
				if( status == 1 || status == 2 )
					bInprogress = true;
				if( status == 0 || status == 1)
					bAllComplete = false;
			}
			
			if( !node.t && bAllComplete )
				return 2;
			else if( bInprogress )
				return 1;
			else
				return 0;
		}
		else
			return node.v
			
	}
}

//returns a incomplete or inprogress or complete
PageTrackingObj.prototype.GetRangeStatus = function( id, bInit )
{
	var status = -1;
	if ( bInit ) 
		this.InitPageTracking();
	
	status = this.InternalGetRangeStatus( this.FindNode( this.title, id ) );
		
	if( status == 0)
		return 'notstarted';	
	else if( status == 1 )
		return 'inprogress';
		
	return 'complete';
}


PageTrackingObj.prototype.InternalSetRangeStatus=function( node, status )
{
	if( node == null )
		return;
	node.v = status;
	if( status == 0 && typeof(node.c)!='undefined')
	{
		for( var i=0; i<node.c.length; i++ )
			this.InternalSetRangeStatus( node.c[i], status ); 
	}
}

PageTrackingObj.prototype.SetRangeStatus = function( id, status /*0 or 1 or 2*/)
{
	this.InternalSetRangeStatus( this.FindNode(this.title, id), status );
	
	this.SavePageTracking();
}

PageTrackingObj.prototype.IterateTree = function( func )
{
	var stack = [];
	stack.push( this.title );
	var i = 0;
	while( stack.length > 0 )
	{
		var node = stack.shift();
		
		if( typeof(node.c) != 'undefined' )
			stack = node.c.concat(stack);
			
		//do the thing
		func( node, i, stack );
		i++;
	}	
}

PageTrackingObj.prototype.SavePageTracking = function()
{
	var hexVal = 0;
	var hexString = '';
	
	var arrayIds = [];
	var arrayStatus= [];
	
	this.IterateTree( function(node, i, stack){
		if( node.v != 0 )
		{
			arrayIds.push(node.id);
			arrayStatus.push(node.v);
		}
	});
	
	for( var i=0; i<arrayIds.length; i++ )
	{
		if( i!=0 ) hexString += ',';
		hexString += arrayIds[i].toString(16);
	}
	
	hexString += '#';
	
	var bits = 4;
	var num = 0;
	for( var i=0; i<arrayStatus.length; i++ )
	{
		var bit = arrayStatus[i] == 2 ? 1 : 0
		num |= bit << (i%bits);
		if( ((i+1)%bits==0) || ((i+1)==arrayStatus.length) )
		{
			hexString += num.toString(16);
			num = 0;
		}
	}
	
	this.VarTrivPageTracking.set(hexString);
}

var trivPageTracking = new PageTrackingObj(365,'medizinische_biometrie', 0, null);
trivPageTracking.numPages = 56;

trivPageTracking.publishTimeStamp = 201651812741;

trivPageTracking.title={id:1,v:0,c:[{id:80804,v:0},{id:2285,v:0,c:[{id:2286,v:0},{id:35356,v:0},{id:3302,v:0},{id:2851,v:0},{id:2852,v:0},{id:2853,v:0},{id:3039,v:0,c:[{id:3040,v:0},{id:24131,v:0},{id:85315,v:0}]}]},{id:2287,v:0,c:[{id:89444,v:0},{id:89453,v:0,c:[{id:89454,v:0},{id:89460,v:0},{id:89466,v:0},{id:89472,v:0},{id:89478,v:0},{id:89483,v:0}]},{id:89519,v:0,c:[{id:89520,v:0},{id:89526,v:0},{id:89539,v:0},{id:89553,v:0},{id:89560,v:0},{id:89568,v:0},{id:89586,v:0},{id:89605,v:0},{id:89622,v:0},{id:89627,v:0},{id:89649,v:0}]}]},{id:21787,v:0,c:[{id:35229,v:0},{id:21788,v:0},{id:79337,v:0},{id:35230,v:0},{id:35231,v:0},{id:35240,v:0},{id:35232,v:0},{id:35233,v:0},{id:35242,v:0}]},{id:2223,v:0,c:[{id:35243,v:0},{id:2224,v:0}]},{id:47101,v:0,c:[{id:63492,v:0},{id:64194,v:0},{id:56129,v:0},{id:65607,v:0},{id:56190,v:0},{id:55689,v:0},{id:68121,v:0},{id:69141,v:0},{id:48830,v:0},{id:70470,v:0},{id:71133,v:0},{id:47044,v:0},{id:47102,v:0},{id:51502,v:0},{id:50894,v:0},{id:48554,v:0},{id:91247,v:0}]}]};
