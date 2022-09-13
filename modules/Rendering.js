const fs = require('fs-extra');
const path = require('path');

const sharp = require('sharp');

const Config = require('../Config.js');

const Templates = require('./Templating.js')();
const HTMLO = require( './HtmlOptimise.js' );


const createLowResAndSave = (imagePath, savePath) => { 
  if( !Config.resizeImages ){
    fs.copyFileSync( imagePath, savePath );
    return;
  } 
  sharp( imagePath )
    .resize( 100, 100, {
      fit: sharp.fit.inside,
      withoutEnlargement: true
    })
    .toFile( savePath )
    .catch( err => {
      Config.log( 'Error with Image in CreateLowResAndSave() in Rendering.js ', err );
    });
};

const createIntermediaryResAndSave = (imagePath, savePath, cfg ) => { 
  if( !cfg || !Config.resizeImages ){
    fs.copyFileSync( imagePath, savePath );
    return;
  } 

  if( path.extname(imagePath) === '.png' ){
    fs.copyFileSync( imagePath, savePath );
    return;
  }
  const filename = path.basename( imagePath );
  const inSize = fs.statSync( imagePath ).size;
  sharp( imagePath )
    .resize( cfg.sizeMax, cfg.sizeMax, {
      fit: sharp.fit.inside,
      withoutEnlargement: true
    })
    .jpeg({
      quality: cfg.quality,
      progressive: false,
      force: false //if it's a png, keep it as a png
    })
    .toFile( savePath )
    .then( ( info ) => {      
      if( info.size > inSize ){
        //console.log('RESIZED ' + filename + ' was larger. Keeping original.' )        
        fs.copyFileSync( imagePath, savePath );
      }
    })
    .catch( err => {
      Config.log( 'Error with Image in CreateHalfResAndSave() in Rendering.js ', err );
    });
};

createOptimisedFullResAndSave = (imagePath, savePath) => { 
  if( !Config.resizeImages ){
    fs.copyFileSync( imagePath, savePath );
    return;
  } 
  sharp( imagePath )
    .jpeg({
      quality: 90,
      progressive: true,
      force: false //if it's a png, keep it as a png
    })
    .toFile( savePath )
    .catch( err => {
      Config.log( 'Error with Image in CreateHalfResAndSave() in Rendering.js ', err );
    });
};

const moveSlideshowContent = ( slideshows ) => {
  for( let name in slideshows){
    let slideshow = slideshows[ name ];
    slideshow.slides.forEach( (slide) => {
      if( slide.type === 'image' || slide.type === 'video' || slide.type === 'audio' ){
        let content = ( typeof slide.content === 'object' ) ? slide.content : [slide.content];
        for( i in content ){
          /* endure the destination exists */        
          fs.mkdirSync( path.dirname(content[i].newPath), {recursive: true} );
          
          if( slide.type === 'image' ){      
            for( name in Config.imgResizing ){
              createIntermediaryResAndSave( 
                content[i].originalPath, 
                content[i].halfPath, 
                Config.imgResizing[name] 
              );
            }
            createLowResAndSave( content[i].originalPath, content[i].lowPath );     
            //createOptimisedFullResAndSave( content[i].originalPath, content[i].newPath );    
            fs.copyFileSync( content[i].originalPath, content[i].newPath );
          } else {
            /* copy the file */
            fs.copyFileSync( content[i].originalPath, content[i].newPath );
          }
        }        
      }
    });
  }
};

const renderPage = ( pageData, index, partnerPages, rendered ) => {
  if( pageData.is_external ){
    return false;
  }

  pageData.prev = (index - 1 >= 0 ) ? partnerPages[index-1] : partnerPages[ partnerPages.length + (index-1) ];
  pageData.prev_prev = (index - 2 >= 0 ) ? partnerPages[index-2] : partnerPages[ partnerPages.length + (index-2) ]
  pageData.next = (index + 1 < partnerPages.length ) ? partnerPages[index+1] : partnerPages[ (index+1) - partnerPages.length ];
  pageData.next_next = (index + 2 < partnerPages.length ) ? partnerPages[index+2] : partnerPages[ (index+2) - partnerPages.length ];

  const p = path.join( Config.paths.public, pageData.url );  
  const fragP = path.join( p, 'fragment' );  
  moveSlideshowContent( pageData.data.slideshows );

  const rendered_project = (Config.minifyHTML) ? HTMLO(Templates.page( pageData )) : Templates.page( pageData );
  
  let render = {
    title: pageData.name,
    pagetype: pageData.pagetype,
    navigation: rendered.navigation,
    content: rendered_project,
    track_record: rendered.track_record,
    small_site: rendered.small_site
  };
  
  fs.mkdirSync( fragP, {recursive: true });
  
  /* write data/html for JS loading */
  fs.writeFileSync( 
    path.join( fragP, 'index.json'), 
    JSON.stringify({
      isPage: true,
      title: pageData.name,
      pagetype: pageData.pagetype,
      html: rendered_project 
    })
  );

  /* write html for initial loading */
  const page = ( Config.minifyHTML ) ? HTMLO( Templates.main( render ) ) : Templates.main( render );
  fs.writeFileSync( path.join( p, 'index.html' ), page );
};

const moveCvContent = ( cv ) => {  
  const cvContentDestination = path.join( Config.paths.public, 'track-record', 'content' );
  const newSrcPath = path.join( 'track-record', 'content' );
  /* ensure the destination exists */
  fs.mkdirSync( cvContentDestination, {recursive: true} );
  cv.forEach( ( year ) => {
    for( let i in year.contents ){
      let type = year.contents[i];
      for( j in type.contents ){
        let entry = type.contents[j];
        if( !entry.image ){          
          continue;
        }

        fs.copyFileSync( entry.image.originalPath, entry.image.newPath );
        createLowResAndSave( entry.image.originalPath, entry.image.lowPath );
      }
    }
  });
}

const renderTrackRecord = ( data ) => {
  moveCvContent( data.contents.cv );
  return Templates.track_record( data );
}

const renderSmall = ( small ) => {
  return Templates.small({
    json: JSON.stringify( {pages:small.pages} )
  });
}

module.exports = {
  renderPage,
  renderTrackRecord,
  renderSmall
}