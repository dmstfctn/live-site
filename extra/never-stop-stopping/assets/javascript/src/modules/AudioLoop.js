var AudioLoop = function( url, _context ){
	this.url = url;
	this.context = _context || new AudioContext();
 	this.source = this.context.createBufferSource();
	this.source.connect( this.context.destination );
	this.playing = false;
}

var proto = AudioLoop.prototype;

proto.load = function(){
	var that = this;
	var request = new XMLHttpRequest();
	request.open('GET', this.url, true);
	request.responseType = 'arraybuffer';
	request.onload = function() {
		that.context.decodeAudioData( request.response, function(response) {
			that.source.buffer = response;
			that.source.loop = true;
			that.play();
			that.source.loop = true;
		}, function () { console.error('The request failed.'); } );
	}
 request.send();
}

proto.play = function(){
	if( !this.playing ){
		this.playing = true;
		this.source.start(0);
		this._onStartPlaying();
	}
}

proto._onStartPlaying = function(){
	console.log( 'onstartplaying' );
	if( typeof this.onStartPlaying === 'function' ){
		this.onStartPlaying();
	}
}

proto.onStartPlaying = function(){ /*... override */ }

proto.resume = function(){
	this.context.resume();
	if( !this.playing ){
		this.play();
	}
}

module.exports = AudioLoop;
