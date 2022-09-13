const path = require('path');
const fs = require('fs-extra');
const Browserify = require('browserify');

const NodeSass = require('node-sass');

const buildToSubfolder = require('./Helpers.js').buildToSubfolder();
const SvgOptimise = require('./SvgOptimise.js');

const Config = require( '../Config.js' );

const js = ( src, dist ) => {  
  // ensure dist exists
  fs.mkdirSync( path.dirname(dist), { recursive: true } );
  const out = fs.createWriteStream( dist );

  // run browserify, babelify, and optionally uglify(ify)
  const b = Browserify( src );
  b.transform( "babelify", {presets: ["@babel/preset-env"], global: true } );  
  b.transform( 'browserify-replace', {replace: [ {from: /\|\|\*\*URL_ROOT\*\*\|\|/g, to: Config.url_root }]})
  b.transform( 'browserify-replace', {replace: [ {from: /\|\|\*\*NAME\*\*\|\|/g, to: Config.name }]})
  if( Config.minify ){ b.transform('uglifyify', { global: true  }) }  
  b.bundle()
    .on('error', function(err){
      console.log(err.message);
      this.emit('end');
    })
    .pipe( out );
};

const sass = ( src, dist ) => {
  // create Config.js dependent variable
  // ensure build-temp exists
  const buildTempDir = path.join( __dirname, '..', 'build-temp' );
  try{
    fs.mkdirSync( buildTempDir );
  } catch (e){
    Config.log('  - not creating build-temp, already exists');
  }
  const sassConfig = `$urlRoot: '${(buildToSubfolder) ? '/' + Config.url_root + '/' : '/' }';`;
  fs.writeFileSync( path.join(buildTempDir,'config.scss'), sassConfig );


  // ensure dist exists
  fs.mkdirSync( path.dirname(dist), {recursive: true} );
  NodeSass.render({
    file: src,
    includePaths: [ buildTempDir ],
    outputStyle: ( Config.minify ) ? 'compressed' : 'nested',
    sourceComments: ( Config.minify ) ? false : true
  }, ( err, result ) => {
    if( err ){
      throw new Error(err);
    }
    fs.writeFile( dist, result.css );
  });
}

const svgToTemplate = ( src, dist ) => {
  // ensure dist exists
  fs.mkdirSync( path.dirname(dist), {recursive: true} );
  const svgs = fs.readdirSync( src ).filter( ( f ) => { return path.extname(f) === '.svg' });
  for( let i = 0; i < svgs.length; i++ ){
    if( svgs[i].indexOf('cvcat_') === 0 ){
      continue; // ignore svgs used for categories on the cv
    }
    const filename = path.basename( svgs[i], '.svg' );
    const templatename = 'svg_' + filename + '.handlebars';
    const pIn = path.join( src, svgs[i] ); 
    const pOut = path.join( dist, templatename );
    const optim = SvgOptimise.sync( pIn );    
    fs.writeFileSync( pOut, optim );
  }
  
  
}

const AssetProcessor = {
  js,
  sass,
  svgToTemplate
}

module.exports = AssetProcessor;