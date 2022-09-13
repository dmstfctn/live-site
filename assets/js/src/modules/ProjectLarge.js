const CFG = require('./Config.js' );
const F = require( './Functions.js' );

const PopOutWindow = require( './PopOutWindow.js' );

let $mediaNavMain = document.querySelectorAll('.dc-media__main .dc-media--nav li:not(.dc-media--link)');
let $mediaListMain = document.querySelectorAll('.dc-media__main .dc-media--list li');

let $mediaPlay = document.querySelectorAll('.dc-media__main .dc-media--nav .dc-media--play');

const ProjectLarge = function(){
  this.$media = document.querySelectorAll('.dc-media__main .dc-media--list li');
  this.$nav = document.querySelectorAll('.dc-media__main .dc-media--nav li:not(.dc-media--link)');
  this.$title = document.querySelector('.dc-item--header h1');

  /* see: https://stackoverflow.com/a/55050568 */
  this.eventHandlers = new WeakMap();

  if( !this.$title ){
    this.legitimate = false;
    return;
  }
  this.legitimate = true;
  this.title = this.$title.innerText;
  this.index = 0;
  this.isPlaying = false;
  this.extraWindow = null;


};

ProjectLarge.prototype = {
  activate: function(){
    this.loadImages();
    this.loadMedia();
    this.setupEvents();
  },
  deactivate: function(){
    this.stopAllMedia();
    this.closeWindow();
    this.$media.forEach( ( $m, index ) => {
      if( $m.classList.contains('info') ){ return; }      
      const e = this.eventHandlers.get( $m );
      if( e ){
        $m.removeEventListener( e.event, e.handler );
      }
    });
    this.$nav.forEach(( $n, index ) => {
      const e = this.eventHandlers.get( $n );
      if( e ){
        $n.removeEventListener( e.event, e.handler );
      }
    });
    const windowEvent = this.eventHandlers.get( window );
    if( windowEvent ){
      window.removeEventListener( windowEvent.event, windowEvent.handler );
    }
  },
  _onChangeSlide: function( $slide, $nav ){
    if( window.DC_GFX ){
      if( $slide.classList.contains('info') || $slide.classList.contains('dc-media__text')){
        window.DC_GFX.increaseDelay( true );
      } else {
        window.DC_GFX.increaseDelay( false );
      }
    }
    this.onChangeSlide( $slide, $nav );
  },
  onChangeSlide: function( $slide, $nav ){ /* ... override ... */},
  stopAllMedia: function(){
    this.$nav.forEach(($n,index) => {
      if( $n.classList.contains('playing') ){
        this.stopMedia( index );
      }
    });
    this.isPlaying = false;
  },
  stopMedia: function( index ){
    const $nav = this.$nav[index]
    const $slide = this.$media[index];
    let $media = $slide.querySelector('audio') || $slide.querySelector('video');
    let $embed = $slide.querySelector('iframe');
    if( $media ){
      $media.pause();
    } else if( $embed ){
      // TODO: handle iframe for likely services properly (soundloud, vimeo, youtube?)
    }
    this.isPlaying = false;
    $nav.classList.remove('playing');
  },
  playMedia: function( index ){    
    const $nav = this.$nav[index]
    const $slide = this.$media[index];
    let $media = $slide.querySelector('audio') || $slide.querySelector('video');   
    let $embed = $slide.querySelector('iframe');     
    if( $media ){
      $media.addEventListener('ended', () => {
        this.stopMedia( index );
      }, {once: true});
      $media.play();
    } else if( $embed ){
      // TODO: handle iframe for likely services properly (soundloud, vimeo, youtube?)
    }
    this.isPlaying = true;
    $nav.classList.add('playing');
  },
  toggleMedia: function( index ){
    const $nav = this.$nav[index]
    const $slide = this.$media[index];
    let $media = $slide.querySelector('audio') || $slide.querySelector('video');
    if( this.isPlaying === false ){
      this.stopAllMedia();
      this.playMedia( index );
    } else {
      this.stopMedia( index )
    }
  },
  closeWindow: function( index ){
    if( this.extraWindow ){
      this.extraWindow.close();
      this.extraWindow = false;
    }
    if( index ){
      const $nav = this.$nav[index];
      $nav.classList.remove('playing');
    }
  },
  openWindow: function( index ){
    const $nav = this.$nav[index];
    const $slide = this.$media[index];  
    const html = $slide.getAttribute('data-content');
    const url = $slide.getAttribute('data-url');
    const widthScale = ($slide.getAttribute('data-window-scale')) 
                          ? 1 / parseFloat( $slide.getAttribute('data-window-scale') ) 
                          : 2.3;
    let w = (window.innerWidth / widthScale < window.screen.availWidth / widthScale ) 
                ? window.screen.availWidth / widthScale 
                : window.innerWidth / widthScale;
    let h = ( w / 16 ) * 9;
    
    if( !url && !!html ){
      if( html.indexOf('player.vimeo.com/video/530496254') > -1 ){
        h = window.screen.availHeight - 175;
        w = h * (475/1200);
      }
    }

    if( this.extraWindow ){
      this.extraWindow.destroy()
    }

    this.extraWindow = new PopOutWindow( 
      (url) ? 'url' : 'html',
      this.title, 
      (html) ? html : url,
      {
        width: w,
        height: h
      }
    );

    this.extraWindow.onClose = () => {      
      $nav.classList.remove('playing');
      this.extraWindow = false;
    };

    this.extraWindow.open();

    $nav.classList.add('playing');
  },
  toggleWindow: function( index ){
    if( this.extraWindow ){
      this.closeWindow( index );
    } else {
      this.openWindow( index );
    }
  },
  loadMedia: function(){
    this.$media.forEach( ( $m ) => {
      const $mEle = $m.querySelector('video') || $m.querySelector('audio');
      if( $mEle ){
        const src = $mEle.getAttribute('data-src');
        $mEle.setAttribute('src', src );
      }
    })
  },
  loadImages: function(){
    clearTimeout(this.loadRestOfImagesTimeout);
    if( !this.$media[0] ) return;
    
    F.loadSlideImage( this.$media[0] );
    this.loadRestOfImagesTimeout = setTimeout( () => {
      F.loadSlideImages( [ ... this.$media].slice(1) ); 
    }, 50);    
  },
  deactivateSlide: function( index ){
    const $slide = this.$media[index];
    const $nav = this.$nav[index];
    const $video = $slide.querySelector('video');
    if( $video ){ $video.pause() }
    $slide.classList.remove( 'active' );
    $nav.classList.remove( 'active' );
  },
  activateSlide: function( index ){
    const $slide = this.$media[index];
    const $nav = this.$nav[index];
    const $video = $slide.querySelector( 'video' );
    F.loadSlideImage( $slide );
    if( $video && $video.muted ){
      $video.play();
    }
    $slide.classList.add( 'active' );
    $nav.classList.add( 'active' );    
    this._onChangeSlide( $slide, $nav );
  },
  navShouldShowSlide: function( $nav ){
    if( 
      $nav.classList.contains('dc-media__playable') || 
      $nav.classList.contains('dc-media__openable')
    ){ 
      return false; 
    }
    return true;
  },
  selectSlide: function( _index ){
    this.index = _index;
    if( _index >= this.$nav.length ){ this.index = this.$nav.length - 1; }
    if( _index < 0 ){ _index = 0; } 

    if( !this.navShouldShowSlide( this.$nav[ this.index ] ) ){ return false; }

    this.$media.forEach(( $m, index ) => {      
      if( index !== this.index ){
        this.deactivateSlide( index );
      } else {
        this.activateSlide( index );
      }
    });
  },
  nextSlide: function(){
    if( this.navShouldShowSlide( this.$nav[ this.index + 1 ] ) ){ 
      this.selectSlide( this.index + 1 );
    } else  {
      this.index = this.index + 1;
      this.nextSlide();
    }    
  },
  prevSlide: function(){
    if( this.navShouldShowSlide( this.$nav[ this.index - 1 ] ) ){ 
      this.selectSlide( this.index - 1 );
    } else  {
      this.index = this.index - 1;
      this.prevSlide();
    }    
  },
  setupEvents: function(){
    /* click to advance */    
    this.$media.forEach( ( $m, index ) => {
      if( $m.classList.contains('info') ){ return; }
      const handler = this.nextSlide.bind(this)
      this.eventHandlers.set( $m, {handler: handler, event: 'click'} );
      $m.addEventListener( 'click', handler );
    });

    /* arrow keys */
    const onKeydown = (e) => {
      if( e.key === 'ArrowRight'){
        this.nextSlide()
      }
      if( e.key === 'ArrowLeft'){
        this.prevSlide()
      }
    }
    const keydownHandler = onKeydown.bind( this );
    this.eventHandlers.set( window, {handler: keydownHandler, event: 'keydown'} )
    window.addEventListener('keydown', keydownHandler);

    /* hover to select */
    this.$nav.forEach(( $n, index ) => {
      let func;
      let handler;
      let event;
      if($n.classList.contains('dc-media__playable')){ 
        func = (e) => {
          this.toggleMedia( index );
        }
        handler = func.bind(this);
        event = 'click';
        $n.addEventListener('click', handler );
      } if($n.classList.contains('dc-media__openable')){ 
        func = (e) => {
          this.toggleWindow( index );
        };
        handler = func.bind(this);
        event = 'click';
        $n.addEventListener('click', handler);
      } else {
        func = () => {                  
          this.selectSlide( index );
        };
        handler = func.bind(this);
        event = 'mouseover';
        $n.addEventListener( 'mouseover', handler );
      }
      this.eventHandlers.set( $n, { handler: handler, event: event })
    });
  }
};

module.exports = ProjectLarge;