const CFG = require('./Config.js');
const $html = document.querySelector('html');

const Functions = {
  isChrome: function(){
    // i know, i know, but chrome's css column layout 
    // is shit and as that's all this is being used to
    // change, if it stops working or correctly detecting 
    // it's really not the end of the world
    // (stolen from is.js: https://github.com/arasatasaygin/is.js/blob/master/is.js)
    const UA = (navigator && navigator.userAgent || '').toLowerCase();
    const vendor = (navigator && navigator.vendor || '').toLowerCase();
    return /google inc/.test(vendor) ? UA.match(/(?:chrome|crios)\/(\d+)/) : false;
  },
  isFirefox: function(){
    // see above...
    // this is being used to add margin to the right of the VII glyph
    const UA = (navigator && navigator.userAgent || '').toLowerCase();
    return UA.match(/(?:firefox|fxios)\/(\d+)/) ? true : false;
  },
  visibilityChangeCompat: function(){
    let hidden, visibilityChange; 
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
      hidden = "hidden";
      visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
      hidden = "msHidden";
      visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
      hidden = "webkitHidden";
      visibilityChange = "webkitvisibilitychange";
    }
    return {
      property: hidden,
      eventName: visibilityChange
    }
  },
  /* hover items in project page */
  loadSlidePlaceholder: function( $slide ){
    const $img = $slide.querySelector('img');
    const $picture = $slide.querySelector('picture');
    const $top = ($picture) ? $picture : $img;
    const type = ($picture) ? 'picture' : 'img';
    if( $top && !$top.classList.contains('loaded') && !$top.classList.contains('placeholder-loaded') ){
      if( type === 'img' ){
        $top.addEventListener('load', () => {
          $top.classList.add('placeholder-loaded');
        }, {once: true});
        $top.src = $top.getAttribute( 'data-low-src' );
      } else if( type === 'picture' ){       
        $img.addEventListener('load', () => {
          $top.classList.add('placeholder-loaded');
        }, {once: true});
        $top.querySelectorAll('source').forEach( ($source) => {
          $source.setAttribute('srcset', $source.getAttribute('data-low-src') );
        });
      }
    }
  },
  loadSlideImage: function( $slide ){
    const $img = $slide.querySelector('img');
    if( !$img ){
      return;
    }
    const $picture = $slide.querySelector('picture');
    const $top = ($picture) ? $picture : $img;
    const type = ($picture) ? 'picture' : 'img';
    if( $top && !$top.classList.contains('loaded') ){
      if( type === 'img' ){
        $img.addEventListener('load', () => {
          $img.classList.add('loaded');
        }, {once: true});
        $img.srcset = $img.getAttribute( 'data-srcset' );
        $img.sizes = $img.getAttribute( 'data-sizes' );
      } else if( type === 'picture' ){
        $img.addEventListener('load', () => {
          $top.classList.add('loaded');
        }, {once: true});
        
        $top.querySelectorAll('source').forEach( ($source) => {
          $source.setAttribute('srcset', $source.getAttribute('data-srcset') );
          $source.setAttribute('sizes', $source.getAttribute('data-sizes') );
        });
      }
    }
  },
  loadSlideImages: function( $slides, _delay ){
    $slides.forEach(( $m, mediaIndex ) => {
      if( _delay ){
        setTimeout(function(){
          Functions.loadSlideImage( $m );
        }, mediaIndex * _delay );      
      } else {
        Functions.loadSlideImage( $m );
      }
    });
  },
  slashStart: ( str ) => {
    return str.startsWith( '/' ) ? str : '/' + str;
  },
  slashEnd: ( str ) => {
    return str.endsWith( '/' ) ? str : str + '/';
  },
  slashBoth: ( str ) => {
    let result = Functions.slashStart( str );
    result = Functions.slashEnd( result );
    return result;
  },
  loadPage: ( path ) => {
    let load = ( path.startsWith( '/' ) ) ? path : '/' + path;
    window.location.href = load;
  }, 
  isHome: () => {
    return $html.getAttribute('data-dc-pagetype') === 'home';
  },
  siteIsInSubfolder: () => {
    return ( CFG.URL_ROOT !== '' && CFG.URL_ROOT !== '/' )
  },
  urlRoot: () => {
    return CFG.URL_ROOT;
  },
  siteBase: () => {
    if( CFG.URL_ROOT !== '' && CFG.URL_ROOT !== '/' ){
      return '/' + CFG.URL_ROOT;
    } else{
      return '';
    }
  }
}

module.exports = Functions;