const path = require('path');

const UPLOAD = ( process.argv[2] === 'upload' );
if( UPLOAD ) console.log('Config.js -> upload mode' );

const url_root = '';
const public_root = (UPLOAD) ?  
                      path.join( __dirname, 'htdocs' )
                      : path.join( __dirname, 'public' );

let Config = {
  name: "dmstfctn",
  dev:{
    local_port: 8080
  },
  debug: false,
  minify: true,
  minifyHTML: true,
  resizeImages: true, 
  imgResizing: {
    'half': {
      name: 'half',
      sizeMax: 2100,
      quality: 70
    }
  },
  url_root: url_root,
  paths: {
    public_root: public_root,
    public: path.join( public_root, url_root ),
    public_data: path.join( public_root, url_root, 'data' ),
    public_assets: path.join( public_root, url_root, 'assets' )
  },
  letterSeparator: ','
};

Config.log = () => {
  if( Config.debug ){
    console.log.apply(null, arguments )
  }
}

if( UPLOAD ){
  Config.debug = false;
  Config.minify = true;
  Config.minifyHTML = true;
  Config.resizeImages = true;
}

module.exports = Config;
