var $ = require('jquery');

$.fn.shuffle = function(){
    for(var j, x, i = this.length; i; j = Math.floor(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
    return this;
};

var id = 0;
var Column = function( _ele, _autoAmount, _shuffle, _duplicate ){
	this.id = id++;
	console.log( 'constructed column', this.id );
	this.$ele = $(_ele);
	this.autoAmount = _autoAmount;
	this.shuffle = !!_shuffle;
	this.duplicate = !!_duplicate;
	this.$inner = this.$ele.children('.column--inner');
	if( this.shuffle && this.duplicate){
		this.$inner.append( this.$inner.children().clone().shuffle() );
		this.$inner.append( this.$inner.children().clone().shuffle() );
	} else if( this.duplicate ){
		this.$inner.append( this.$inner.children().clone() );
		this.$inner.append( this.$inner.children().clone() );
	}


	this.setValues();
	this.setupEvents();
	this.setInitial();
}

var proto = Column.prototype;

proto.setupEvents = function(){
	var that = this;
	this.$ele.on('scroll', function(){
		if( !that.shouldAutoScroll ){
			that.scrollCallback();
		}
	});
	this.$ele.on('mouseover',function(){
		that.shouldAutoScroll = false;
	});
	this.$ele.on('mouseout',function(){
		that.shouldAutoScroll = true;
	});
}

proto.setInitial = function(){
	if( this.shouldAutoScroll && this.autoAmount < 0 ){
		this.setScroll( this.scrollThreshMax );
	} else{
		this.setScroll( this.scrollThreshMin );
	}
}

proto.setValues = function(){
	//this.scrollHeight = this.$inner[0].scrollHeight;
	this.scrollHeight = this.$ele[0].scrollHeight;
	this.height = $(window).height();
	this.scrollMax = this.scrollHeight - this.height;
	// console.log(this.id, 'scrollH', this.scrollHeight, 'H', this.height, 'Max', this.scrollMax );
	this.scrollThreshMin = 20;
	this.scrollThreshMax = (this.scrollHeight- this.height - this.scrollThreshMin) *0.9;
	this.scrollPos = 0;
	this.shouldAutoScroll = (typeof this.autoAmount !== 'undefined' ) ? true : false;
}

proto.autoScroll = function(){
	if( this.shouldAutoScroll ){
		this.changeScrollBy( this.autoAmount );
		this.infiniteScroll();
		this._onScroll();
	}
}

proto.changeScrollBy = function( by ){
	var newScroll = this.scrollPos + by;
	this.setScroll( newScroll );
}

proto.setScroll = function( to ){
	this.scrollPos = to;
	if( to > this.scrollThreshMax ){
		to = this.scrollThreshMax;
	}
	this.$ele.scrollTop( to )
}

proto.infiniteScroll = function(){	
	//this.setValues();
	if( this.scrollPos > this.scrollThreshMax ){
		this.setScroll( this.scrollThreshMin + 1 );
	} else if( this.scrollPos < this.scrollThreshMin  ){
		this.setScroll( this.scrollThreshMax - 1 );
	}
}

proto._onScroll = function(){
	if( typeof this.onScroll === 'function' ){
		this.onScroll();
	}
}

proto.scrollCallback = function(){
	var that = this;
	clearTimeout( this.extraCheck );
	this.extraCheck = setTimeout(function(){
		that.scrollPos = that.$ele.scrollTop();
		that.infiniteScroll();
		that._onScroll();
	}, 100)
	this.scrollPos = this.$ele.scrollTop();
	this.infiniteScroll();
	this._onScroll();
}

module.exports = Column;
