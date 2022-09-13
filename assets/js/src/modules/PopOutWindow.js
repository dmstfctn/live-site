const CFG = require('./Config.js' );

const PopOutWindow = function( type, title, contents_or_url, _config ){
  this.config = this.configure( _config );
  this.title = title;  
  this.type = type || 'html';
  if( type === 'url' ){
    this.url = contents_or_url;
  } else {
    this.html = this.createHTML( title, contents_or_url );  
    this.url = this.createURL( this.html );    
  }
};

PopOutWindow.prototype = {
  _onClose: function(){
    this.onClose();
  },
  onClose: function(){ /* ... override ... */ },
  configure: function( userConfig ){
    const defaultConfig = {
      width: 640,
      height: 480
    };
    let config = {};
    for( let prop in defaultConfig ){
      config[prop] = userConfig[prop] || defaultConfig[prop]
    }
    return config;
  },
  open: function(){
    const browserChrome = window.outerHeight - window.innerHeight;
    const w = Math.round(this.config.width);
    const h = Math.round(this.config.height);
    const x = Math.round( (window.innerWidth - w) / 2 ) + window.screenX;
    const y = Math.round( (window.innerHeight - h) / 2 ) + window.screenY + (browserChrome/2);
    
    this.window = window.open(       
      this.url,
      this.title,      
      `width=${w},height=${h},screenX=${x},screenY=${y},location=on`
    );

    if( this.type === 'url' ){
      clearInterval(this.checkWindowOpenInterval);
      this.checkWindowOpenInterval = setInterval(() => {
        if( this.window.closed ){
          clearInterval(this.checkWindowOpenInterval);
          this._onClose();
        }
      }, 500 );
    } else {
      this.window.addEventListener('load', () => {   
        const ownChrome = this.window.outerHeight - this.window.innerHeight;     
        this.window.resizeTo(w,h+ownChrome);
        this.window.addEventListener('unload', () => {        
          this._onClose();
        });      
      });

      clearInterval(this.titleChangeInterval);
      this.titleChangeInterval = setInterval( () => {
        if( this.window.document.title === this.title ){
          this.window.document.title = CFG.NAME;
        } else {
          this.window.document.title = this.title;
        }
      }, 1600 )
    }
  },
  close: function(){
    clearInterval(this.titleChangeInterval);
    this.window.close();    
  },
  destroy: function(){
    this.close(); 
    if( this.type !== 'url' ){
      URL.revokeObjectURL( this.url );
    }
  },
  createURL: function( html ){
    return URL.createObjectURL(
      new Blob( [this.html], { type: "text/html" } )
    );
  },
  createHTML: function( title, contents ){
    return `<!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            html, body, iframe{
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              background: #000000;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          ${contents}
        </body>
      </html>
    `;
  }
};

module.exports = PopOutWindow;