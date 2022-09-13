var jQuery = require('jquery');
var $ = jQuery;
window.jQuery = jQuery;
var blast = require('blast-text');
var canAutoplay = require('can-autoplay');

var Data = require('./modules/GSData.js');

var AudioLoop = require('./modules/AudioLoop.js');
var Column = require('./modules/Column.js');
var $track = $('audio.d-sol');
var aCtx = new AudioContext();
var audio = new AudioLoop( $track.attr('src'), aCtx );

$(window).click(function(){
	audio.resume();
	audio.play();
});

var lastFontRandom = new Date().getTime();
var fontRandomActive = false;
var fonts = [ 'font-temp-unifraktur','font-temp-ceviche', 'font-temp-tex' ];
var nextFontRandom = 100;
var setFontRandom = function(){
	$('.blast').each(function(){
		if( Math.random() > 0.9 ){
			$(this).addClass( fonts[Math.floor(Math.random(fonts.length))] );
		}
	});
}
var clearFontRandom = function(){
	$('.blast').removeClass( fonts.join(' ') );
}
var fontRandom = function(){
	var now = new Date().getTime();
	if( Math.random() > 0.5 ){
		if( now - lastFontRandom > nextFontRandom ){
			if( !fontRandomActive ){
				setFontRandom();
				fontRandomActive = true;
				lastFontRandom = now;
				nextFontRandom = Math.floor( (Math.random() * 8000) + 2000 );
			} else {
				clearFontRandom();
				fontRandomActive = false;
				lastFontRandom = now;
				nextFontRandom = Math.floor( (Math.random() * 8000) + 2000 );
			}
		}
	}
}

var c1 = new Column( '.column__1', 0.2, false, true );
var c2 = new Column( '.column__2', -0.4, true, true );
var cInfo = new Column( '.sachs-info', 0.7, false, false );
var c3 = new Column( '.column__3', 0.6, false, true );

c1.onScroll = c2.onScroll = c3.onScroll = function(){
	audio.resume();
	audio.play();
}

$('.item').each(function(){
	$(this).blast({ delimiter: "sentence" });
});

setFontRandom();

c1.setValues(); c1.setInitial();
c2.setValues(); c2.setInitial();
cInfo.setValues(); cInfo.setInitial();
c3.setValues(); c3.setInitial();

var $progress = $('.progress');
var $progressHandle = $('.progress--handle');
var progressPos = 0;
var progressPosDir = 1;
var progressPosStep = (Math.random() * 0.3) + 0.2;
var maxProgressPos = $progress.width() - $progressHandle.width();

var $sachsInfo = $('.sachs-info');
var $sachsInfoInner = $sachsInfo.find('.sachs-info-inner div');

var time = new Date().getHours() + ':' + new Date().getMinutes() + ':00';
var pTime = time;
var previousStockValue = 0;


var loop = function(){
	c1.autoScroll();
	c2.autoScroll();
	//cInfo.autoScroll();
	c3.autoScroll();

	if( audio.playing ){
		progressPos += progressPosDir * progressPosStep;
		if( progressPos >= maxProgressPos ){
			progressPosDir = progressPosDir * -1;
			progressPosStep =   (Math.random() * 0.3) + 0.2;
		}
		if( progressPos <= 0 ){
			progressPosDir = progressPosDir * -1;
			progressPosStep =   (Math.random() * 0.3) + 0.2;
		}
		$progressHandle.css('transform', 'translateX(' + progressPos + 'px) translateY(-50%) translateZ(0)');
	}
	//fontRandom();

	time = new Date().getHours() + ':' + new Date().getMinutes() + ':00';
	if( !Data[time] ){
		time = '09:30:00'
	}
	var currentStockValue = parseInt( Data[time]['4. close'] );
	var stockString =  'NYSE, GS: ' + Data[time]['4. close'] + ' &mdash; ';
	$sachsInfoInner.html( stockString.repeat(100) )
	if( time !== pTime ){
		if( currentStockValue == previousStockValue ){
			$sachsInfo.removeClass('going-down');
			$sachsInfo.removeClass('going-up');
		}else if( currentStockValue > previousStockValue ){
			$sachsInfo.removeClass('going-down');
			$sachsInfo.addClass('going-up');
		} else {
			$sachsInfo.removeClass('going-up');
			$sachsInfo.addClass('going-down');
		}
		previousStockValue = currentStockValue;
	}
	pTime = time;
	requestAnimationFrame( loop );
}

requestAnimationFrame( loop );


var windowIndex = 0;
var maxWindows = 3;
var windows = [];
var windowFeatures = "menubar=no,location=no,resizable=yes,scrollbars=yes,status=yes";

$('a').on('click', function(e){
	audio.resume();
	audio.play();
	e.preventDefault();
	var href = $(this).attr('href');
	if( windows.length >= maxWindows ){
		var w = windows.shift();
		w.close();
	}
	console.log('open window');
	var x = Math.floor(Math.random() * window.innerWidth/100) * 100;
	var y = Math.floor(Math.random() * window.innerWidth/100)*100;
	var features = windowFeatures + ',left=' + (e.pageX - 200) + ',top=' + e.pageY + ',width=687,height=687';
	var windowRef = window.open( href, 'window-' + windowIndex, features );
	windowRef.focus();
	windows.push( windowRef )
	windowIndex++;
	if( windowIndex > maxWindows ){
		windowIndex = 0;
	}
});

$(window).on('mousemove', function(){
	audio.resume();
});

audio.load();

var testForAutoplay = function(){
	canAutoplay.audio.then(function( result ){
		if( result === true ){
			$('.not-playing-sound').hide();
			$('.is-playing-sound').show();
		} else {
			$('.not-playing-sound').show();
			$('.is-playing-sound').hide();
		}
	});
}

audio.onStartPlaying = function(){
	testForAutoplay();
};

canAutoplay.audio.then(function( result ){
	testForAutoplay();
});
