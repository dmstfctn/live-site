//import * as VimeoPlayer from "@vimeo/player/dist/player.min.js" ;
const VimeoPlayer = require('@vimeo/player');


const Embed = function( $slide ){
  this.$slide = $slide;
  this.$ele = this.$slide.querySelector('.dc-embed');
  this.service = this.$ele.getAttribute('data-embed-service');
  this.url = this.$ele.getAttribute('data-embed-url');
  this.isEmbedded = this.$ele.classList.contains('embedded');
  this.controller = false;  
  this.isPreactivating = false;
}

Embed.prototype = {  
  preactivate: function( _callback ){
    const cb = _callback;
    clearTimeout( this.preactivateTimeout );
    if( this.service === 'vimeo' ){
      this.isPreactivating = true;
      this.controller.setVolume( 0 );
      this.controller.play().then( () => {      
        if(this.isPreactivating){
          clearTimeout( this.preactivateTimeout );
          this.preactivateTimeout = setTimeout( () => {            
            this.controller.setVolume( 1 );
            if( !this.isActive ){     
              this.controller.setCurrentTime(0);        
              this.controller.pause();
            }
            if( typeof _callback === 'function' ){
              cb( true );
            };
          }, 5)
        }
      });
    } else {
      _cb( false );
    }
  },
  createControllerForService: function(){
    if( this.controller ) return this.controller;
    if( this.service === 'vimeo' ){
      if( this.isEmbedded ){
        return new VimeoPlayer( this.$ele.querySelector('iframe') );
      } else {
        return new VimeoPlayer( this.$ele, {
          url: this.url,
          autoplay: false,
          controls: false,
          autopause: false
        })
      }
    }
  },
  prepare: function(){
    this.controller = this.createControllerForService();
    if( this.service === 'vimeo' ){
      this.controller.on('ended', (data) => {
        this._onEnded();
      });
      this.preactivate();
    }
  },
  activate: function(){
    this.isPreactivating = false;
    this.isActive = true;
    if( !this.controller ){
      this.controller = this.createControllerForService();
    }
    if( this.service === 'vimeo' ){      
      this.controller.play();
      this.controller.setVolume( 1 );
    }
  },
  deactivate: function(){
    this.isActive = false;    
    if(!this.controller) return;
    if( this.service === 'vimeo' ){
      if( this.isPreactivating ) return;      
      this.controller.pause();
    }
  },
  _onEnded: function(){
    this.onEnded();
  },
  onEnded: function(){ /* ... override ... */ }
}

module.exports = Embed;