const CFG = require('./Config.js' );
const F = require( './Functions.js' );
const Embed = require('./Embed.js');

const ScrollQuantiser = require( './ScrollQuantiser.js' );

const DC_INFO_CLASS = 'dc-track-record';

const ProjectSmall = function( backwards, hasGfx ){
  this.$wrapper = document.querySelector( '.dc-item' );
  if( this.$wrapper ){
    this.$title = document.querySelector( '.dc-item--header' );
    this.$info = this.$wrapper.querySelector('.dc-item--info');
  }
  this.items = this.getItems();
  this.hasGfx = hasGfx;
  this.minIndex = (hasGfx) ? 0 : 1;  
  this.slideIndex = (backwards) ? this.items.length - 1 : this.minIndex;
  this.size = {
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: 'portrait'
  };
  if( this.getProjectItems().length === 0 ){
    this.type = 'cv';
  } else {
    let $projectcvLines = this.$wrapper.querySelectorAll('.dc-cv--entry');
    if( $projectcvLines.length > 0 ){
      this.type = 'project';
      this.cvScroller = new ScrollQuantiser( 
        this.$wrapper.querySelector('.dc-cv'), 
        $projectcvLines,
        0.4, //speed,
        4, //bottom lines to cut
        true // prevent input / interaction being initialised
      );
      this.cvScroller.recalculate();
    } else {
      this.type = 'project-nocv';
    }
  }  

  this.loadPlaceholderImages();  
  this.update();
  this.ifBackwards( backwards );
  
  //if( this.type === 'project' ) this.cropInfoEvents();
};

ProjectSmall.prototype = {
  activate: function(){
    this.preloadImages( 2 );
  },
  deactivate: function(){
    this.deactivateAll();
  },
  _onCantGoBack: function(){
    this.isCurrentlyOnGfxPlaceholder();
    this.onCantGoBack();
  },
  onCantGoBack: function(){ /* ... override ... */ },
  _onEnd: function(){
    this.onEnd();
  },
  onEnd: function(){ /* ... override ... */ },
  _onChange: function(){
    this.prepareEmbeds();
    this.isCurrentlyOnGfxPlaceholder();
    this.onChange();
  },
  onChange: function(){ /* ... override ... */ },
  _onNext: function(){
    this.onNext();
  },
  onNext: function(){ /* ... override ... */ },
  _onAutoNext: function(){ 
    this.onAutoNext();
  },
  onAutoNext: function(){ /* ... override ... */ },
  _onPrev: function(){
    this.onPrev();
  },
  onPrev: function(){ /* ... override ... */ },
  _onGfx: function(){
    this.onGfx();
  },
  onGfx: function(){ /* ... override ... */ }, 
  toggleInfo: function(){
    if( this.type === 'project' ){
      this.$info.classList.toggle('small-visible');
    }
  },
  hideInfo: function(){
    if( this.type === 'project' ){
      let shouldHide = this.$info.classList.contains('small-visible');
      this.$info.classList.remove('small-visible');
      return shouldHide;
    }
    return false;
  },
  infoIsVisible: function(){
    if( this.type === 'project' ){
      return this.$info.classList.contains('small-visible');
    }
    return false;
  },
  cropInfoEvents: function(){    
    if( this.type === 'project' ){
      let $eventsWrapper = this.$wrapper.querySelector('.dc-item--cv');
      let $events = $eventsWrapper.querySelectorAll('.dc-cv--entry, .dc-cv--title');
      if( $events.length < 1 ) return;
      let lineH = $events[0].offsetHeight;
      $events.forEach(( $ele ) => {
        $ele.style.display = '';
      });            
      if( $eventsWrapper.offsetTop + $eventsWrapper.offsetHeight < window.innerHeight - lineH ){        
        return;
      }
      let index = $events.length-1;
      while( $eventsWrapper.offsetTop + $eventsWrapper.offsetHeight > window.innerHeight - lineH && index > 0 ){   
        $events[index].style.display = 'none';
        index--;
        if( $events[index].classList.contains('dc-cv--title') ){
          $events[index].style.display = 'none';
          index--;
        }
      }
    }
  },
  ifBackwards: function( backwards ){
    const slide = this.items[ this.slideIndex ];
    if( backwards && slide.ele ){
      this.activateSlide( slide );    
    }
  },
  setSizeForSlide: function( slide, w, h, orientation ){
    this.size.width = w || this.size.width;
    this.size.height = h || this.size.height;
    this.size.orientation = orientation || this.size.orientation;
    const contentType = slide.contentType;
    const $slide = slide.ele;      
    if( contentType === 'embed' ){
      const $iframe = $slide.querySelector('iframe');
      if( !$iframe ) return;
      if( this.size.orientation === 'portrait' ){
        $iframe.style.width = this.size.height + 'px';
        $iframe.style.height = this.size.width + 'px';
      } else {
        $iframe.style.width = this.size.width + 'px';
        $iframe.style.height = this.size.height + 'px';
      }
    }
  },
  setSizeForSlideByIndex: function( index, w, h, orientation ){
    this.setSizeForSlide( this.items[index], w, h, orientation  );
  },
  setSize: function( w, h, orientation  ){
    this.size.width = w || this.size.width;
    this.size.height = h || this.size.height;
    this.size.orientation = orientation || this.size.orientation;
    for( let index = 0; index <  this.items.length; index++ ){
      this.setSizeForSlideByIndex( index, this.size.width, this.size.height, this.size.orientation  );
    }
    if( this.type === 'project' ){
      this.cvScroller.recalculate();
    }
    // if( this.type === 'project' ){
    //   this.cropInfoEvents();
    // }
  },
  isCurrentlyOnGfxPlaceholder: function(){
    if( this.slideIndex <= 0 && this.minIndex === 0 ){
      this.isOnGfxPlaceholder = true;
      this._onGfx();
    } else {
      this.isOnGfxPlaceholder = false;
    }
    return this.isOnGfxPlaceholder;
  },
  isCurrentlyOnCV: function(){
    if( !this.items[ this.slideIndex ] ){
      return false;
    }
    const current = this.items[ this.slideIndex ];
    const parent = current.parentElement;
    let parentIsInfo = (parent) ? parent.classList.contains( DC_INFO_CLASS ) : false;
    let isInfo = current.classList.contains( DC_INFO_CLASS );      
    return parentIsInfo || isInfo;
  },
  getSlideContentType: function( $ele ){
    if( $ele.classList.contains('dc-media__image') ){
      return 'image';
    } else if( $ele.classList.contains('dc-media__embed') ){
      return 'embed';
    } else if( $ele.classList.contains('dc-media__video') ){
      return 'video';
    } else if( $ele.classList.contains('dc-media__audio') ){
      return 'audio';
    } else {
      return 'text';
    }
  },
  getProjectItems: function(){
    let result = [];
    if( !this.$wrapper ){  
      return result;
    }
    // // project info
    // const $info = this.$wrapper.querySelector('.dc-item--info')
    // result = [
    //   {
    //     type: 'standard',
    //     ele: $info,
    //     parent: false,
    //     contentType: this.getSlideContentType( $info )
    //   }
    // ];
   
    //images/content
    result = result.concat(
      [...this.$wrapper.querySelectorAll( '.dc-media__small .dc-media--list li' )]
        .map( ($ele, index) => {
          return {
            type: 'standard',
            ele: $ele,
            parent: false,
            contentType: this.getSlideContentType( $ele ),
            index: index
          }
        })
    );
    
    // //related cv entries
    // result = result.concat(
    //   [...this.$wrapper.querySelectorAll('.dc-item--info .dc-small-chunk')]
    //     .map( ($ele) => {
    //       return {
    //         type: 'chunk',
    //         ele: $ele,
    //         parent: $info,
    //         contentType: this.getSlideContentType( $ele )
    //       }
    //     })
    // );

    return result;
  },
  getCvItems: function(){
    const $dcInfo = document.querySelector( `.${DC_INFO_CLASS}`);
    const $dcInfoSections = document.querySelectorAll( `.${DC_INFO_CLASS} .dc-small-chunk` );
    return [].concat(
      [... $dcInfoSections]
      .map( ($ele) => {
        return {
          type: 'chunk',
          ele: $ele,
          parent: $dcInfo,
          contentType: this.getSlideContentType( $ele )
        }
      })
    );
  },
  hideCv: function(){
    const items = this.getCvItems();
    items
      .forEach( ( item ) => {
        if( item.type === 'gfx' ) return;
        item.ele.classList.remove( 'active' );
        if( item.type === 'chunk' ) item.parent.classList.remove('active');
      });
  },
  getItems: function(){
    let result = this.getProjectItems();
   
    if( result.length === 0 ){ //there are no project slides, must be cv
      result = this.getCvItems();
    } else {
      this.hideCv();
    }

    //add gfx placeholder at the start
    result = [{
      type: 'gfx',
      ele: false,
      parent: false
    }].concat( result );

    return result;
  },
  loadPlaceholderImages: function(){
    for( let index = 0; index <  this.items.length; index++ ){      
      const slide = this.items[ index ];
      if( !slide ) continue;
      if( slide.type === 'gfx' ) continue;
      if( slide.contentType === 'image' ){
        F.loadSlidePlaceholder( slide.ele );
      }  
    }
  },
  prepareEmbeds: function(){
    if( this.embedsPrepared ) return;
    for( let index = 0; index <  this.items.length; index++ ){      
      const slide = this.items[ index ];
      if( !slide ) continue;
      if( slide.type === 'gfx' ) continue;
      if( slide.contentType === 'embed' ){        
        this.prepareEmbed( slide );
      }
    }
    this.embedsPrepared = true;
  },
  prepareEmbed: function( slide ){
    if( slide.embedPrepared ) return;
    slide.embedPrepared = true;
    if( !slide.controller ){
      slide.controller = new Embed( slide.ele, slide.index === 0 );
      slide.controller.onEnded = () =>{
        this.next();
        this._onAutoNext();
      }
    }
    slide.controller.prepare();    
  },
  deactivateAll: function(){
    this.items
      .forEach( ( item ) => {
        if( item.type === 'gfx' ) return;
        item.ele.classList.remove( 'active' );
        if( item.type === 'chunk' ) item.parent.classList.remove('active');
        this.deactivateSlide( item );
      });
  },
  preloadImages: function( _preloadCount ){
    let preloadCount = _preloadCount | 2;  
    for( let i = -preloadCount; i < 1 + preloadCount; i++ ){
      let index = this.slideIndex + i;
      const slide = this.items[ index ];
      if( !slide ) continue;
      if( slide.contentType === 'image' ){
        F.loadSlideImage( slide.ele )
      } else if( slide.contentType === 'embed' ){
        this.prepareEmbed( slide );
      }

    } 
  },
  next: function(){
    this.slideIndex++;    
    // we've gone past the last slide for this part
    if( this.slideIndex >= this.items.length ){
      this._onEnd();
      return;
    }    
    this.update();
    this._onNext();
    this._onChange();    
  },
  prev: function(){
    this.slideIndex--;
    if( this.slideIndex < this.minIndex ){     
      this.slideIndex = this.minIndex;
      this._onCantGoBack();
      return;
    }

    this.update();
    this._onPrev();
    this._onChange();
  },
  update: function(){
    const slide = this.items[ this.slideIndex ]    
    this.deactivateAll();
    
    if( slide.type === 'gfx' ){

    } else {
      slide.ele.classList.add( 'active' );
      if( slide.type === 'chunk' ){
        slide.parent.classList.add('active');
        //if( this.type === 'project' ) this.cropInfoEvents();
      }
      this.activateSlide( this.items[ this.slideIndex ] );      
    }

    if( this.slideIndex > 0 && this.hasGfx ){
      this.minIndex = 1;
    }

    document.body.scrollTop = 0;
    this.setSizeForSlide( slide );
    
    this.preloadImages( 2 );
  },
  deactivateSlide: function( slide ){
    if( slide.contentType === 'video'  ){
      const $video = slide.ele.querySelector('video');
      $video.pause();
      $video.currentTime = 0;
    } else if( slide.contentType === 'embed'  ){
      if( !slide.controller ){
        this.prepareEmbed( slide );
      }
      slide.controller.deactivate();
    }
  },
  activateSlide: function( slide ){
    const $slide = slide.ele;
    if( slide.contentType === 'video' ){
      if( window.DC_GFX ) window.DC_GFX.preventAppearance();
      let videoPlay = slide.ele.querySelector('video').play();
      if( videoPlay ){
        videoPlay.catch( ( e ) => {
          //console.log('VIDEO CANT PLAY.', e );
        });
      }
    }  else if( slide.contentType === 'embed' ){
      if( window.DC_GFX ) window.DC_GFX.preventAppearance();
      if( !slide.controller ){
        this.prepareEmbed( slide );
      }
      slide.controller.activate();
      this.setSizeForSlide( slide, this.size.width, this.size.height, this.size.orientation );
    } else {
      if( window.DC_GFX ){ 
        window.DC_GFX.enableAppearance();
        if( slide.contentType === 'text'){
          window.DC_GFX.increaseDelay( true );
        } else {
          window.DC_GFX.increaseDelay( false );
        }
      }
    }
  },
};

module.exports = ProjectSmall;