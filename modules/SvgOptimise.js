const fs = require('fs-extra');
const path = require('path');
const SVGO = require('svgo');
const deasync = require('deasync');

const svgo = new SVGO({
  plugins: [{
    removeDoctype: true,
  },{
    removeXMLProcInst: true,
  },{
    removeComments: true,
  },{
    removeMetadata: true,
  },{
    removeTitle: true,
  },{
    removeDesc: true,
  },{
    removeUselessDefs: true,
  },{
    removeEditorsNSData: true,
  },{
    removeEmptyAttrs: true,
  },{
    removeEmptyText: true,
  },{
    removeEmptyContainers: true,
  },{
    cleanupEnableBackground: true,
  },{
    convertStyleToAttrs: true,
  },{
    convertColors: true,
  },{
    convertPathData: true,
  },{
    convertTransform: true,
  },{
    removeUnknownsAndDefaults: true,
  },{
    removeNonInheritableGroupAttrs: true,
  },{
    removeUselessStrokeAndFill: true,
  },{
    removeUnusedNS: true,
  },{
    cleanupNumericValues: true,
  },{
    collapseGroups: true,
  },{
    removeRasterImages: false,
  },{
    mergePaths: true,
  },{
    convertShapeToPath: true,
  },{
    sortAttrs: true,
  },
  {
    cleanupIDs: false
  },
  {
    removeHiddenElems: false
  }]
});

const asyncOptimise = function( filepath, cb ){
  fs.readFile( filepath, 'utf8', function(err, data) {
    if( err ){ throw err }
    svgo.optimize( data, {path: filepath}).then( function(result){
      cb( false, result.data );
    }).catch( (error) => {
      cb( error );
    });
  });
}

const syncOptimise = deasync( asyncOptimise );

module.exports = {
  async: asyncOptimise,
  sync: syncOptimise
}

