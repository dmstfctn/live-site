const CFG = require('./Config.js' );
const F = require( './Functions.js' );

const Loader = require('./Loader.js');

const Menus = require( './Menus.js' );
const Project = require( './ProjectLarge.js' );
const HoverImg = require( './HoverImg.js' );

const VisualQuantiser = require( './VisualQuantiser.js' );
const ScrollQuantiser = require( './ScrollQuantiser.js' );

const SITE_BASE = F.siteBase();

const Large = function(){
  this.project = new Project();
  this.menus = new Menus();
  this.loader = new Loader([
    'a[href^="' + SITE_BASE + '/related-matters/"]',
    'a[href^="' + SITE_BASE + '/focus-groups/"]'
  ]);

  this.setupLogo();
  this.setupMenus();  
  this.initQuantisers(); 

  document.querySelectorAll( '.dc-list-hoverimg' )
    .forEach( ($hoverImg) => {            
      let hoverImg = new HoverImg( $hoverImg );
      hoverImg.onShow = function(){
        let lineH = $hoverImg.offsetHeight;
        let distFromBottom = parseInt($hoverImg.getAttribute('data-lines-from-bottom')) * lineH;
        if( distFromBottom < hoverImg.$img.offsetHeight ){
          hoverImg.$img.style.marginTop = distFromBottom - hoverImg.$img.offsetHeight + 'px';
        }
      }
   });
};

Large.prototype.setupLogo = function(){
  //This used to pick which version of the DC we used, but now randomises the
  const faceNames = [1,2,3,4,5,6,7,8].sort(() => Math.random() - 0.5);
  const $faces = document.querySelectorAll('.dc-faces .face');
  $faces.forEach( ($face, i ) =>{
    const index = i % faceNames.length;
    const name = faceNames[ index ];
    $face.setAttribute( 'data-face', name );
  });
}

Large.prototype.setupMenus = function(){
  this.menus.onChange = ( id ) => {
    let p = id;
    document.documentElement.setAttribute('data-dc-menuvisible', id );

    if( id === 'related-matters' ){ p = ''; }    
    if( this.historyActive ){
      history.pushState(
        {
          type: 'menu', 
          url: SITE_BASE + '/' + p, 
          id: id,
        }, 
        null, 
        SITE_BASE + '/' + p 
      );
    }
    //run the 'visual quantiser' 
    if( this.vcList[ p ] ){
      this.vcList[ p ].run();
    }
    if( p === 'track-record' ){
      this.cvScroller.recalculate();
    }
    this.project.deactivate();
  }
};

Large.prototype.cancelLoader = function(){
  this.loader.onLoad = () => {};
  window.removeEventListener('popstate', this.popstateHandler );
}

Large.prototype.setupLoader = function(){
  this.loader.initEvents();

  this.historyActive = true;
  this.$mainContent = document.querySelector( '.dc-main-content' );  

  this.loader.onLoad = ( data, url, disableHistory  ) => {
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
    this.renderPage( data );
    //this.menus.hideMenus();
  };

  let popstateFunction = ( event ) => {
    const state = history.state;
    if( state.type === 'menu' ){
      this.historyActive = false;
      this.menus.showMenuById( state.id );
      document.documentElement.setAttribute('data-dc-menuvisible', state.id );
      this.historyActive = true;
    } else {
      this.menus.hideMenus();
      document.documentElement.setAttribute('data-dc-menuvisible', '' );
      this.loader.load( state.url, true );
    }
  };

  this.popstateHandler = popstateFunction.bind( this );
  
  window.addEventListener('popstate', this.popstateHandler );
  
  this.firstHistoryState();
}

Large.prototype.firstHistoryState = function(){
  //first history state:
  let type;
  if( F.siteIsInSubfolder() ){
    type = ( window.location.pathname.split('/').length > 4 ) ? 'page' : 'menu';
  } else {
    type = ( window.location.pathname.split('/').length > 3 ) ? 'page' : 'menu';
  }
  let initialState = {
    type: type,
    url: window.location.pathname
  };
  if( type === 'menu' ){
    let pathSegments = window.location.pathname.split('/');
    let pathLast = pathSegments.pop() || pathSegments.pop();   
    initialState.id = ( pathLast === F.urlRoot() ) ? 'related-matters' : pathLast;
  }
  console.log('initial history state: ', initialState );
  history.replaceState( initialState, null, window.location.pathname );
};

Large.prototype.initScrollQuantiser = function(){
  this.cvScroller = new ScrollQuantiser( 
    document.querySelector('#track-record .dc-cv'), 
    document.querySelectorAll('#track-record .dc-cv--entry'),
    0.4, //speed,
    0 // no. of lines to cut off bottom 
  );

  const $cvScrollerContents = document.querySelectorAll('#track-record .quantised-scroller--wrapper dl > *');
  let scrollerTitles = [];
  let entriesWithImages = [];
  let entryIndex = 0;
  const totalEntries = [... $cvScrollerContents].filter(function( $ele ){
    return $ele.classList.contains('dc-cv--entry');
  }).length;
  $cvScrollerContents.forEach( ($ele, index ) => {
    if( $ele.tagName === 'DT' ){
      scrollerTitles.push({
        $ele: $ele,
        index: entryIndex
      });
    } else {
      const $img = $ele.querySelector('img');
      $ele.setAttribute('data-lines-from-bottom',  totalEntries - entryIndex );     
      entryIndex++;
    }    
  });
  this.cvScroller.onScroll = () => {
    // scrollerTitles.forEach( ( title ) =>{
    //   if( title.index < this.cvScroller.minVisLine || title.index > this.cvScroller.maxVisLine ){
    //     title.$ele.classList.add( 'quantised-scroller--hidden');
    //   } else {
    //     title.$ele.classList.remove( 'quantised-scroller--hidden');
    //   }
    // });  
  }
}

Large.prototype.initQuantisers = function(){
  this.vcList = {
    'related-matters': VisualQuantiser( 
      document.querySelector('#related-matters ol'),
      document.querySelectorAll('#related-matters ol li'),
      document.querySelector('#related-matters .dc-biglist--now')
    ),
    'focus-groups': VisualQuantiser( 
      document.querySelector('#focus-groups ol'),
      document.querySelectorAll('#focus-groups ol li'),
      document.querySelector('#focus-groups .dc-biglist--now')
    )
  };
  
  this.initScrollQuantiser();
}

Large.prototype.renderPage = function( data ){
  document.title = data.title;
  document.documentElement.setAttribute('data-dc-pagetype', data.pagetype );
  document.documentElement.setAttribute('data-dc-menuvisible', '' );
  if( data.pagetype !== 'relatedmatter' && data.pagetype !== 'focusgroup' ){
    return;
  }
  this.project.deactivate();
  this.$mainContent.innerHTML = data.html; 
  this.project = new Project();
  this.project.activate();
  this.loader.initEvents( this.$mainContent );  
};

Large.prototype.quantise = function(){
  for( let i in this.vcList ){
    this.vcList[i].run();
  }
  this.cvScroller.recalculate();
}

Large.prototype.activate = function(){
  this.setupLoader();
  this.project.activate();
  this.quantise();
  this.resizeHandler = this.quantise.bind(this);
  this.cvScroller.activate();
  window.addEventListener('resize', this.resizeHandler );
}
Large.prototype.deactivate = function(){
  this.cancelLoader();
  this.cvScroller.deactivate();
  window.removeEventListener('resize', this.resizeHandler );
}

module.exports = new Large();