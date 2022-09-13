const chokidar = require('chokidar');
const fs = require('fs');
const express = require('express');
const path = require('path');
const cp = require('child_process');

const Config = require('../Config.js');

const buildScript = path.join( __dirname, '..', 'build.js' );
const publicDir = path.join( __dirname, '..', 'public' );
console.log( ' ---------------- SETUP ---------------- ')
console.log( '  1 - run build script at:' );
console.log( '      ' + buildScript );
console.log( '  2 - run static server from:' ); 
console.log( '      ' + publicDir );
console.log();

const app = express();
app.use(express.static('public'));
app.listen( Config.dev.local_port, () => {
  console.log( ' ---------------- SERVER --------------- ')
  console.log( '  - Local address: ' );
  console.log( '    http://localhost:' + Config.dev.local_port + '/' + Config.url_root );
  console.log();
  console.log();
});

console.log( ' ----------- SETUP COMPLETE ------------ ')
 


let buildWait; 
let buildProcess;
const runBuild = () => {
  clearTimeout( buildWait );
  buildWait = setTimeout( ()=>{    
    if( buildProcess ){
      buildProcess.kill();
      console.log( " ----------- BUILD CANCELLED ----------- ")
    }
    console.log( " ------------ BUILDING SITE ------------ ")
    buildProcess = cp.spawn('node', ['build.js'] );
    buildProcess.stderr.on('data', ( err ) => {
      if( err ) throw new Error( err );
    });
    buildProcess.stdout.on('data', ( stdout ) => {
      console.log( stdout.toString() );
    });
    buildProcess.on('close', ( code )=>{
      if( code === 0 ){
        console.log( " ----------- BUILD COMPLETED ----------- ")
      }
    });    
  }, 250 );
}

chokidar.watch( 
  [
    './content',
    './assets',
    './templates',
    './modules',
    './build.js',
    './package.json',
    './htaccess'
  ], 
  {
    ignored: ['./templates/partials/svg_*.handlebars']
  },
).on( 'change', ( filename ) => {
  //console.log('chokidar watch sez: changed ', filename );
  runBuild();
}).on( 'add', ( filename ) => {
  //console.log('chokidar watch sez: add', filename );
  runBuild();
}).on( 'addDir', ( filename ) => {
  //console.log('chokidar watch sez: addDir', filename );
  runBuild();
}).on( 'unlink', ( filename ) => {
  //console.log('chokidar watch sez: unlink', filename );
  runBuild();
}).on( 'unlinkDir', ( filename ) => {
  //console.log('chokidar watch sez: unlinkDir', filename );
  runBuild();
});

console.log();
console.log();
console.log( ' --------- WATCHING FOR CHANGES --------' );
console.log();
console.log();
