import 'pepjs'

const F = require('./Functions.js');
const PopOutWindow = require('./PopOutWindow.js');

const GFX = function(){
  this.$nav_logo = document.querySelector('[data-dc-localtarget="#related-matters"] svg' );
  this.$gfx = document.querySelector('.dc-gfx');
  this.timeout = null;
  this.showDelay = 15000;  
  this.firstUserHide = true;
  this.firstUserHideDelay = 700;
  this.ignoreFirstPointerMove = true;
  this.loadedAt = (new Date()).getTime();
  this.increaseDelay( false );
  this.unhidable = false;
  this.isPrevented = false;
  this.visible = true;
}

GFX.prototype = {
  disableAnimation: function(){
    this.$gfx.style.animationDuration = '0s';
    this.$nav_logo.style.animationDuration = '0s';
  },
  enableAnimation: function(){
    this.$gfx.style.animationDuration = '';
    this.$nav_logo.style.animationDuration = '';
  },
  increaseDelay: function( shouldIncrease ){
    if( shouldIncrease ){
      this.useShowDelay = this.showDelay * 2;
    } else{
      this.useShowDelay = this.showDelay;
    }
  },
  preventAppearance: function(){
    this.isPrevented = true;
  },
  enableAppearance: function(){
    this.isPrevented = false;
  },
  hide: function( immediate ){
    if( this.unhidable ){
      return;
    }

    clearTimeout( this.timeout );
    this.timeout = setTimeout( () => {
      this.show( true );
    }, this.useShowDelay );

    if( this.visible ){
      if( immediate ){
        this.disableAnimation();
      }
      this.$gfx.classList.add('hidden');
      this.$gfx.classList.remove('visible');
      this.$nav_logo.classList.remove('hidden');
      this.$nav_logo.classList.add('visible');    
      if( this.firstUserHide ){
        this._onFirstHide();
      }
      this.firstUserHide = false;
      this._onHide();
      this.visible = false;
      if( immediate ){
        this.enableAnimation();
      }
    }
  },
  show: function( immediate ){
    if( this.isPrevented ){
      this.hide();
      return false;
    }
    if( immediate ){
      this.disableAnimation();
    }    
    clearTimeout( this.timeout );
    this.$gfx.classList.remove('hidden');
    this.$gfx.classList.add('visible');
    this.$nav_logo.classList.add('hidden');
    this.$nav_logo.classList.remove('visible');
    this.visible = true;
    if( immediate ){
      setTimeout(() => {
        this.enableAnimation();
      }, 10 );      
    }
  },
  _onMove: function(){
    if( this.firstUserHide ){
      const timeSinceLoad = (new Date()).getTime() - this.loadedAt;
      if( timeSinceLoad > this.firstUserHideDelay ){
        this.hide();
      } else {
        this.timeout = setTimeout( () => {
          this.hide();
        }, this.firstUserHideDelay );
      }
    } else {
      this.hide();
    }    
  },
  activate: function(){
    let visibilityAPI = F.visibilityChangeCompat();

    window.addEventListener('wheel', () => {
      this._onMove();
    }, {passive: true} );
    window.addEventListener('keydown', ( e ) => {    
      if( 
        e.key === 'ArrowDown' || e.key === 'ArrowUp' 
        || e.key === 'ArrowLeft' || e.key === 'ArrowRight' 
      ){
        this._onMove();
      }      
    });
    window.addEventListener('pointermove', () => {
      if( this.ignoreFirstPointerMove ){
        this.ignoreFirstPointerMove = false;
      } else {
        this._onMove();
      }
    }, {passive: true});
    window.addEventListener('pointerup', () => {
      this._onMove();
    }, {passive: true});
    // window.addEventListener('click', () => {
    //   this._onMove();
    // });
    this.$gfx.addEventListener('touchmove', function (event) {
      if (event.targetTouches.length === 1) {
        event.preventDefault();
      }
    });
    if( visibilityAPI.property ){
      document.addEventListener( visibilityAPI.eventName, () => {              
        if( document[ visibilityAPI.property ] ){ //is hidden    
          clearTimeout( this.timeout );
          this.show( true ) //show, immediately
        } else { 
          /*is visible*/ 
          this.ignoreFirstPointerMove = true;
        }
      }, false );
    }
  },
  deactivate: function(){
    window.removeEventListener('mousemove', () => {
      this._onMove();
     });
  },
  startLoadingSequence: function(){
    this.show();
    this.unhidable = true;
  },
  endLoadingSequence: function(){
    this.unhidable = false;
    this.hide();
  },
  removeLayer: function(){
    this.layerToRemove = this.layerToRemove || 1;
    let $remove = this.$gfx.querySelector(`svg > :nth-child(${this.layerToRemove})`);
    if( $remove ){
      $remove.style.display = 'none';
      this.layerToRemove++;
    }
  },
  reenableFirstHide: function(){
    this.show();
    this.firstUserHide = true;
  },
  _onFirstHide: function(){
    this.onFirstHide();
  },
  onFirstHide: function(){ /* ... override ... */ },
  _onHide: function(){
    this.onHide();
  },
  onHide: function(){ /* ... override ... */ }
};

module.exports = GFX;