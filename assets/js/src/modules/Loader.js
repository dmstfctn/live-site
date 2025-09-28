import 'whatwg-fetch';

const Loader = function( _triggers ){
  this.loaded = {};
  this.triggers = _triggers || [];
};

Loader.prototype = {
  initEvents: function( _context ){
    const context = _context || document;
    this.triggers.forEach( (trigger) => {
      context.querySelectorAll( trigger ).forEach( ( $a ) => {
        $a.addEventListener( 'click', ( e ) => {
          if( !e.metaKey ){
            e.preventDefault();
            this.load( $a.getAttribute( 'href' ) ); 
          }
        });
      });
    });
  },
  load: function( url, disableHistory, _passThrough ){
    const passThrough = _passThrough || {};
    if( this.loaded[ url ] ){
      setTimeout( () => {
        this._onLoad( this.loaded[ url ], url, disableHistory, passThrough );
      }, 10 );      
      return;
    }  

    const fragmentURL = ( url === '/' ) ? '/fragment/index.json' : url + '/fragment/index.json'; 
    
    fetch( fragmentURL )
      .then(function( response ){
        if (response.ok) {
          return response;
        } else {
          var error = new Error(response.statusText)
          error.response = response
          window.location.href = url;
          throw error;
        }
      })
      .then( (response) => {        
        return response.json();
      })
      .then( ( data ) => {
        this.loaded[url] = data;
        this._onLoad( data, url, disableHistory, passThrough );               
      });
  },
  _onLoad: function( data, url, disableHistory, passThrough ){
    this.onLoad( data, url, disableHistory, passThrough );
  },
  onLoad: function( data, url, disableHistory ){ /* ... override .. */ }
};

module.exports = Loader;