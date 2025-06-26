import 'pepjs'

const Hammer = require('hammerjs');

const CFG = require('./Config.js' );
const F = require( './Functions.js' );

const Loader = require('./Loader.js');
const Project = require('./ProjectSmall.js');
const Orientation = require('./Orientation.js');
const ProgressBar = require( './ProgressBar.js' );

const ScrollQuantiser = require( './ScrollQuantiser.js' );

const SITE_BASE = F.siteBase();

const TITLE_TOUCH_AREA_H = 50;

const Small = function( _loops ){
  this.$interactionEle = document.querySelector('.dc-mobile-nav');    
  this.$mainContent = document.querySelector( '.dc-main-content' );  

  this.loader = new Loader();
  this.minLoadTime = 800;
  
  this.orientation = new Orientation();
  this.orientation.onSizeRoot = ( w, h ) => {
    this.project.setSize( w, h, this.orientation.orientation );
    this.cvScroller.recalculate();
  }
  this.setupData();

  this.project = new Project( false, false );
  this.progress = new ProgressBar( this.project.items.length );
  this.progress.init(1, this.project.items.length)

  this.cvScroller = new ScrollQuantiser( 
    document.querySelector('#track-record .dc-cv'), 
    document.querySelectorAll('#track-record .dc-cv--entry'),
    0.4, //speed,
    0, //bottom lines to cut
    true // prevent input / interaction being initialised
  );
  this.cvScroller.recalculate();

  this.setupProjectEvents();
  this.setupInteraction();
  this.orientation.sizeRoot();

  console.log( 'Small(): this.project.slideIndex = ',this.project.slideIndex  );
};

Small.prototype.setupData = function(){
  const pathname = ( F.slashBoth(window.location.pathname) === SITE_BASE + '/focus-groups/' ) ? SITE_BASE + '/' : window.location.pathname;
  this.data = window.DCSMALL.pages;  
  this.homePath = this.data[0].url;
  this.homeIndex = 0;
  this.pageIndex = this.getPageIndexFor( pathname );
  if( this.pageIndex !== 0 ){
    this.data.splice( this.pageIndex, 0, this.data.shift() );
    this.pageIndex = this.getPageIndexFor( pathname );
    this.homeIndex = this.pageIndex + 1;
  }
  this.startPageIndex = this.pageIndex;
}

Small.prototype._onLoadingStart = function(){
  this.loadingStartTime = (new Date()).getTime();
  this.onLoadingStart();
}
Small.prototype.onLoadingStart = function(){ /* ... override ... */ };

Small.prototype._onLoadingComplete = function(){
  this.onLoadingComplete( this.loadingTime );
}
Small.prototype.onLoadingComplete = function(){ /* ... override ... */ };

Small.prototype._onEndInteraction = function(){
  this.onEndInteraction();
}
Small.prototype.onEndInteraction = function(){ /* ... override ... */ };

Small.prototype._onReenableFirstGfxHide = function(){
  this.onReenableFirstGfxHide();
}
Small.prototype.onReenableFirstGfxHide = function(){ /* ... override ... */ };


/* Utilities / Data */
Small.prototype.getPageIndexFor = function( _path ){
  const path = F.slashBoth( _path );  
  
  const index = window.DCSMALL.pages
    .findIndex( (item) => { 
      let url = F.slashBoth( item.url );        
      return url === path;  
    });

  return index;
}

/* Activate / Deactivate */
Small.prototype.activate = function(){
  this.setupLoader();
  this.cvScroller.activate();
  this.orientation.activate();
  this.project.activate();  
}

Small.prototype.deactivate = function(){
  this.cancelLoader();
  this.cvScroller.deactivate();
  this.orientation.deactivate();
  this.project.deactivate();
}

/* interaction */
Small.prototype.setupInteraction = function(){
  this.interactTimeouts = {};
  this.$zoomEle = document.querySelector('.dc-zoomable-wrap');
  this.zoomTimeout = null;
  this.hammertime = new Hammer(this.$interactionEle, {
    domEvents: false,
    touchAction: 'manipulation'
  });
  
  this.hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
  this.hammertime.get('press').set({ time: 10 });
  this.hammertime.get('pinch').set({ enable: true });
  this.hammertime.get('pan').requireFailure(this.hammertime.get('pinch'));
  this.hammertime.get('pinch').dropRequireFailure(this.hammertime.get('pan'));

  this.scale = 1;
  this.translate = {
    x: 0,
    y: 0
  };
  this.pinchPoint = {
    x: 0,
    y: 0
  };
  this.pScale = 1;
  const minScale = 1;
  const maxScale = 4;

  const update = () => {
    const x = (-1 * this.pinchPoint.x) + this.translate.x;
    const y = (-1 * this.pinchPoint.y) + this.translate.y;
    const scale = this.scale;
    const originX = (this.pinchPoint.x/window.innerWidth) * 100;
    const originY = (this.pinchPoint.y/window.innerHeight) * 100;
    this.$zoomEle.style.transformOrigin = originX + '% ' + originY + '%'; 
    this.$zoomEle.style.transform = 'translateX('+ x +'px) translateY('+ y +'px) scale(' + scale + ')';
  }
  let isZoom = false
  this.hammertime.on('pinchstart', (e) => {
    this.hideInteraction( 'forward' );
    this.hideInteraction( 'back' );
    this.pinchPoint.x = e.center.x;
    this.pinchPoint.y = e.center.y;    
    this.translate.x = this.pinchPoint.x;
    this.translate.y = this.pinchPoint.y;
    isZoom = true;
  });

  this.hammertime.on('pinchin pinchout', (e) => {
    this.hideInteraction( 'forward' );
    this.hideInteraction( 'back' );
    this.translate.x = e.center.x;
    this.translate.y = e.center.y;
    this.scale = Math.max( minScale, Math.min(this.pScale * (e.scale), maxScale));      
    update();
    isZoom = true;
  });

  this.hammertime.on('pinchmove', (e) => {
    this.hideInteraction( 'forward' );
    this.hideInteraction( 'back' );
    this.translate.x = e.center.x;
    this.translate.y = e.center.y;
    update();
    isZoom = true;
  })

  this.hammertime.on('pinchend pinchcancel', (e) => {
    this.zoomTimeout = setTimeout( () => {
      this.pScale = this.scale;
      this.scale = minScale;
      this.pScale = minScale;
      this.translate.x = 0;
      this.translate.y = 0;
      this.pinchPoint.x = 0;
      this.pinchPoint.y = 0;
      this.$zoomEle.style.transition = 'transform .1s ease-out';
      this.$zoomEle.style.transform = 'translateX(0px) translateY(0px) scale(' + minScale + ')';
      setTimeout( () => {
        this.$zoomEle.style.transformOrigin = 'center center';
        this.$zoomEle.style.transition = '';
        isZoom = false;
      }, 100 );
    }, 100 );
    this.hideInteraction( 'forward' );
    this.hideInteraction( 'back' );
  });

  this.hammertime.on('tap pressup', (e) => {      
    if( this.project.type === 'cv' ){ return }    
    if( isZoom ){ return }
    
    if( e.center.y >= window.innerHeight - TITLE_TOUCH_AREA_H ){
      this.project.toggleInfo();
    } else {
      let didHide = this.project.hideInfo();
      if( !didHide ){
        if(e.center.x >= window.innerWidth / 2){      
          this.project.next();
        } else {      
          this.project.prev();
        }
      }
    }
    
    this.hideInteraction( 'forward' );
    this.hideInteraction( 'back' );
    if( this.project.isOnGfxPlaceholder ){
      e.stopPropagation();
    }
  });

  this.hammertime.on('press', (e) => { 
    if( this.project.infoIsVisible() ) return;
    if( e.center.y >= window.innerHeight - TITLE_TOUCH_AREA_H ) return;
    if( this.project.type === 'cv' ) return; 
    if(e.center.x >= window.innerWidth / 2){
      this.showInteraction( 'forward' );
    } else {      
      this.showInteraction( 'back' );
    }
  });

  let cvScrollPos = 0;
  let pDelta = 0;
  const $cvScroll = this.cvScroller.$scrollable.querySelector(':scope > dl');
  const maxScroll = $cvScroll.offsetHeight - this.cvScroller.$scrollable.offsetHeight;
  
  this.hammertime.on('pan', (e) => {
    this.cvScroller.measure();    
    const deltaY = e.deltaY - pDelta;
    //console.log(  this.cvScroller.lineH , ' , ', deltaY, ' , ', Math.floor( deltaY / this.cvScroller.lineH ) * this.cvScroller.lineH );
    //if( Math.abs(deltaY) < this.cvScroller.lineH * 0.8 ) return;
    //cvScrollPos += Math.floor( deltaY / this.cvScroller.lineH ) * this.cvScroller.lineH;
    cvScrollPos += deltaY;
    if( cvScrollPos < maxScroll * -1 ){
      cvScrollPos = maxScroll * -1;
    }
    if( cvScrollPos > 0 ){
      cvScrollPos = 0;
    }
    $cvScroll.style.transform = 'translateY(' + cvScrollPos + 'px)';
    pDelta = e.deltaY;
  });

  this.hammertime.on('panend', (e) => {
    pDelta = 0;
  });

  // this.$interactionEle.addEventListener('pointerdown', (e) => {
  //   if(e.pageX >= window.innerWidth / 2){
  //     this.showInteraction( 'forward' );
  //   } else {
  //     this.showInteraction( 'back' );
  //   }
  // });
  this.$interactionEle.addEventListener('pointerup', (e) => {
    this.hideInteraction( 'forward' );
    this.hideInteraction( 'back' );
  });

  this.$interactionEle.addEventListener('touchmove', function (event) {
    if (event.targetTouches.length === 1) {
      event.preventDefault();
    }
  });
  document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
  });
  document.addEventListener('touchstart', function(e){
    if( e.target.classList.contains('dc-mobile-home-link') === false ){
      e.preventDefault();
    } else {
      console.log('home link!');
    }
  }, {passive: false});

};

Small.prototype.showInteraction = function( type ){
  clearTimeout( this.interactTimeouts[ type ] );
  this.$interactionEle.classList.add('interact-' + type );
}
Small.prototype.hideInteraction = function( type, _additionalTime ){
  const additionalTime = _additionalTime || 0;
  clearTimeout( this.interactTimeouts[ type ] );
  this.interactTimeouts[ type ] = setTimeout( () => {
    this.$interactionEle.classList.remove('interact-' + type );
  }, 50 + additionalTime );
}

Small.prototype.projectEnd = function( backwards ){
  if( backwards && this.pageIndex === this.startPageIndex ){
    return;
  }
  this.pageIndex = (backwards) ? this.pageIndex - 1 : this.pageIndex + 1;
  
  if( this.pageIndex >= this.data.length ){
    this.pageIndex = 0;    
  }
  if( this.pageIndex < 0 ){
    this.pageIndex = this.data.length-1;    
  }
  
  this.showLoader( backwards );

  if( this.data[this.pageIndex].url === SITE_BASE && !backwards ){  
    this._onReenableFirstGfxHide();
  }

  this.loader.load( 
    F.slashStart( this.data[ this.pageIndex ].url ), 
    false, 
    { 
      backwards: backwards
    } 
  );
  
};

Small.prototype.showLoader = function( backwards ){
  this._onLoadingStart();
  document.body.classList.add('dc-loading');  
  this.progress.startLoadAnim( this.minLoadTime, backwards );  
};
Small.prototype.hideLoader = function( _cb ){
  const cb = _cb || function(){};
  if( this.loadingTime < this.minLoadTime ){ 
    setTimeout( () => {
      this.progress.cancelLoadAnim();
      document.body.classList.remove('dc-loading');
      this._onLoadingComplete();
      cb();
    }, this.minLoadTime - this.loadingTime );
  } else {
    this.progress.cancelLoadAnim();
    document.body.classList.remove('dc-loading');
    this._onLoadingComplete();
    cb();
  }
};


Small.prototype.cancelLoader = function(){
  this.loader.onLoad = () => {};
  this.progress.cancelLoadAnim();
  window.removeEventListener('popstate', this.popstateHandler );
}

Small.prototype.setupLoader = function(){
  this.historyActive = true; 

  this.loader.onLoad = ( data, url, disableHistory, extra ) => {
    if( !disableHistory && this.historyActive ){     
      history.pushState(
        {
          type: 'page', 
          url: F.slashEnd( url )
        }, 
        null, 
        F.slashEnd( url ) 
      );
    }
    this.loadingEndTime = (new Date()).getTime();
    this.loadingTime = this.loadingEndTime - this.loadingStartTime;

    this.hideLoader( () => {
      this.renderPage( data, extra );  
    });
  };

  let popstateFunction = ( event ) => {
    const state = history.state;    
    const statePageIndex = this.getPageIndexFor( history.state.url );  
    this.showLoader();
    this.loader.load( state.url, true );    
  };

  this.popstateHandler = popstateFunction.bind( this );

  window.addEventListener('popstate', this.popstateHandler );

  //first history state:
  this.firstHistoryState();
}

Small.prototype.firstHistoryState = function(){
  history.replaceState(
    {
      type: 'page',
      url: window.location.pathname
    }, 
    null, 
    window.location.pathname 
  );
}

Small.prototype.renderPage = function( data, extra ){    
  const backwards = !!extra.backwards;  
  document.title = data.title;
  document.documentElement.setAttribute('data-dc-pagetype', data.pagetype );

  this.$mainContent.innerHTML = data.html;
  this.project.deactivate();
  this.project = new Project( backwards, false ); 
  this.project.activate();
  this.progress.init( this.project.slideIndex, this.project.items.length );
  this.orientation.sizeRoot()
  this.setupProjectEvents();  
  
}

Small.prototype.setupProjectEvents = function(){
  this.project.onEnd = () => {
    this.projectEnd( false );
  }; 
  this.project.onChange = () => {
    this.progress.setProgress( this.project.slideIndex );
    this.progress.render();
  }

  this.project.onGfx = () => {
    this.progress.setProgress( this.project.slideIndex );
    this._onReenableFirstGfxHide();
  }

  this.project.onCantGoBack = () => {
    this.projectEnd( true );
  };
  this.project.onAutoNext = () => {
    this.showInteraction( 'forward' );
    this.hideInteraction( 'forward', 250  );
  };
}

Small.prototype.firstGfxHide = function(){
  this.project.next();
}
module.exports = new Small( CFG.SITE_SHOULD_LOOP );