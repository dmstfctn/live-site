const path = require('path')
const fs = require('fs');

const Config = require( '../Config.js' );
const H = require('./Helpers.js');

const YAML = require('yaml');

const cheerio = require('cheerio');
const frontmatter = require('@github-docs/frontmatter')
const markdown = require( 'markdown-it' )( 'commonmark', {
  html: true,
  breaks: true,
  linkify: true
});

const removeDotFiles = ( f ) => {
  return f.indexOf('.') !== 0;
};
const removeMetaYaml = ( f ) => {
  return f !== 'meta.yaml';
}
const readJSON = ( path ) => {
  let json = false; 
  try{
    json = fs.readFileSync( path ) 
    json = JSON.parse( json );
  } catch ( e ){
    if( e.errno === -2 ){
      Config.log( 'No json present at ', path );
    } else {
      Config.log( e );
    }
  }
  return json;
}; 

const readYAML = ( path ) => {
  let yaml = false; 
  try{
    yaml = fs.readFileSync( path )   
    yaml = YAML.parse( yaml.toString() );
  } catch ( e ){
    if( e.errno === -2 ){
      Config.log( 'No yaml present at ', path );
    } else {
      Config.log( e );
    }
  }
  return yaml;
}; 

const replacePwithBR = ( text ) => {
  return text.replace(/(<\/p>(\s*)<p>)+/g,'<br><br>')
             .replace(/<p>+/g, '')
             .replace(/<\/p>+/g, '');
}

const tokeniseString = ( text ) => {
  const arr = text.split('');
  let result = '';
  for( let i = 0; i < arr.length; i++ ){
    result += `<span data-char="${ arr[i].charCodeAt(0) }">${arr[i]}</span>`;
  }
  return result;
}

const removeOrderFromFilename = ( filename ) => {
  return filename.replace(/(^[0-9]+\.)/gm, '' );
};

const getProjectCvItems = ( title, cv ) => {
  const slug = H.createSlug( title );
  let relatedCv = cv.entries.filter( function( entry ){
    if( Array.isArray( entry.related ) ){
      for( let i = 0; i < entry.related.length; i++ ){
        if( 
          H.createSlug( entry.related[i] ) === slug 
          && entry.hideon !== 'mobile'
        ){
          return true;
        }
      }
    } else if( typeof entry.related === 'string' ){
      if( 
        H.createSlug( entry.related ) === slug 
        && entry.hideon !== 'mobile'
      ){        
        return true;
      }
    }
    return false;
  });
  return relatedCv;
}

const getSlideType = ( filename ) => {
  let ext = path.extname( filename );
  if( ext === '.md' ){
    return 'text';
  } else if( ext === '.embed' ){   
    return 'embed';   
  } else if( ext === '.window' ){
    return  'window';
  } else if( ext ==='.mp3' ){
    return 'audio';
  } else if( ext === '.mp4' ){
    return 'video';
  }
  return 'image';
}

/* 
  constructSlideshow( versions, meta )
  --------------------------------------
  versions:   array of paths to folders of content (e.g. portrait & andscape folder)
  p:          the path to the versions
  meta:       an object containing meta info, indexed by filename
*/

const constructSlideshow = ( versions, p, meta ) => {
  let slideshow = {};
  versions.forEach( ( directory ) => {
    const pDir = path.join( p, directory );
    const contents = fs.readdirSync( pDir )
                      .filter( removeDotFiles )
                      .filter( removeMetaYaml );
    contents.forEach( ( filename ) => {
      const slide = constructSlide( filename, pDir, meta[filename] );
      if( !slideshow[filename] ){
        slideshow[filename] = {          
          meta: meta[filename],
          type: getSlideType( filename ),
          content: {}
        };
      }      
      slideshow[filename].content[ directory ] = slide.content;
    });    
  });

  return Object.values( slideshow );
}

/* 
  constructSlide( filename, p, meta )
  -----------------------------------
  filename: the name of the file
  p:        the path to the file
  captions: an object containing meta info, indexed by filename
  
  e.g:
    H.constructSlide( 
      "a.jpg", 
      "root/folder/", 
      { 
        "a.jpg": "a caption", 
        "b.jpg": "another caption" 
      }
    );

  loads content for text slides, constructs paths for media slides
  returns an object defining the slide:

  {
    caption:  String | false,
    type:     String            "text", "embed", "audio", "video", "image",
    content:  String            either path to file, or html embed/from markdown
  }

*/
const constructSlide = ( filename, p, meta ) => {
  let filePath = path.join( p, filename );
  let ext = path.extname( filename );
  
  let type;
  let slide = {
    meta: meta,
    type: getSlideType( filename )
  };
  if( filename === 'meta.yaml' ){
    return;
  } 
  if( slide.type === 'text' ){    
    slide.content = markdown.render( fs.readFileSync( filePath ).toString() );
    //slide.content = replacePwithBR( slide.content );                
  } else if( slide.type === 'embed' ){
    // embed code in a text doc with .embed as an extension
    slide.content = fs.readFileSync( filePath ).toString();    
  } else if( slide.type === 'window'){
    // url in a text doc with .window as an extension
    // will appear in a new pop-out window    
    const yaml = readYAML( filePath );
    if( typeof yaml === 'object' ){
      slide.content = yaml;
      slide.content.name = removeOrderFromFilename( path.basename( filePath, path.extname(filePath) ) );
    } else {
      slide.content = fs.readFileSync( filePath ).toString();
      slide.content.name = 'watch';
    }
  } else if( slide.type === 'audio' ){
    slide.content = filePath;
  } else if( slide.type === 'video' ){
    slide.content = filePath;
  } else { 
    // assume an image
    slide.content = filePath;
  }
  return slide;
};
/* 
  readFolder( path )
  ------------------
  path: path to the folder that should be read

  reads e.g. 'related matters' or 'focus groups' and 
  constucts an object based on the folder structure.

  Each step down the object has: 
    'name': the folder name minus any 1. or 2. style numbering
    'contents': an object containing the folder's children
                the keys are the folder's name
*/
const readFolder = ( folderPath, cv ) => {
  let name = path.basename( folderPath );
  let data = {
    name: removeOrderFromFilename( name ),
    contents: {}
  };
  const root = folderPath; 
  const dir = fs.readdirSync( root ).filter( removeDotFiles );

  dir.forEach( ( year ) => {
    const p = path.join( root, year );
    const projects = fs.readdirSync( p ).filter( removeDotFiles );
    data.contents[year] = {
      name: removeOrderFromFilename( year ),
      contents: {}
    };
    projects.forEach( (project ) => {
      const name = removeOrderFromFilename( project );
      const p = path.join( root, year, project );
      const contents = fs.readdirSync( p ).filter( removeDotFiles );
      const relatedCv = getProjectCvItems( name, cv );
      let projectData = {
        name: name,
        slug: H.createSlug( name ),
        title: {
          normal: name,
          justified: tokeniseString(name)
        },
        slideshows: {},
        data: {},
        info: '',
        cv: { entries: relatedCv }
      };
      contents.forEach( ( item ) => {
        const itemPath = path.join( p, item );
        if( item === 'info.md' ){
          // the info file for the project
          // contains some config & the description
          let fm = frontmatter( fs.readFileSync( itemPath ));
          projectData.data = fm.data;
          projectData.info = {
            content: markdown.render( renderMarkdownPrecolumns(fm.content) ),
            contentNoColumns: markdown.render( removePrecolumns( fm.content) ),
            hasPreColumns: markdownHasPreColumns( fm.content )
          };
          if( fm.data.title ){
            projectData.title.normal = fm.data.title;
          } else {
            projectData.title.normal = name;
          }
          if( fm.data.titleJustified ){
            projectData.title.justified = tokeniseString( fm.data.titleJustified );
          } else if( fm.data.title ){
            projectData.title.justified = tokeniseString( fm.data.title );
          } else {
            projectData.title.justified = tokeniseString( name );
          }            
        } else {         
          const p = path.join( root, year, project, item );
          // find the meta file
          const meta = readYAML( path.join(p, 'meta.yaml') ) || {};

          let files = fs.readdirSync( p )
                        .filter( removeDotFiles )         
                        .filter( removeMetaYaml );

          let slideshow; 
          if( item === 'main' ){
            // the main slideshow (large / desktop site)
            slideshow = constructSlideshow( [item], path.join( root, year, project), meta );
          } else if( item === 'small' ){
            slideshow = constructSlideshow(
              files.sort().reverse(),
              p,
              meta
            );
          } else {
            return;
          }

          projectData.slideshows[item] = {slides: slideshow};
        }             
      });
      data.contents[year].contents[project] = projectData;
    })
  });

  return data;
};

const loadCV = ( file ) => {
  const cvYaml = fs.readFileSync( file );
  return {
    entries: YAML.parse( cvYaml.toString() )
  };
}

const removePrecolumns = ( md ) => {
  if( markdownHasPreColumns(md) ){
    return md.replace( /(\n*?)(<COLBREAK>)(\n*?)/g, '$1$3' );
  } else {
    return md;
  }
}

const renderMarkdownPrecolumns = ( md ) => {
  if( markdownHasPreColumns(md) ){
    let col = '<div class="dc-col">\n\n' 
    col += md.replace(/<COLBREAK>/g, '\n\n</div><div class="dc-col">\n\n' ) 
    col += '\n\n</div>';
    return col;
  } else {
    return md;
  }
}

const markdownHasPreColumns = ( md ) => {
  return md.indexOf('<COLBREAK>') !== -1;
};

const renderMarkdownAndProcess = ( md ) => {  
  let rendered = markdown.render( md );

  //rendered =  replacePwithBR( rendered );

  /* wrap @ symbols like so:
    <span class="dctxt--at">@</span>
  */
  const $ = cheerio.load( rendered )
  $('body *').each(function( i, ele ){
    const $this = $(this);
    if( $this.children().length <= 0 ){
      let text = $this.text();
      let replaced = text.replace( '@', '<span class="dctxt--at">@</span>' );
      $this.html( replaced );
    }
  });
  rendered = $('body').html();

  return rendered;
};

const cvToDissemination = function( cv, contentPath ){
  let dissemination = []
  for( i in cv.entries ){
    let entry = cv.entries[i]
    if( entry.image && entry.image !== "" ){
      entry.image = path.join( contentPath, 'track-record', 'images', entry.image );
    }
    if( entry.type === 'dissemination' ){
      dissemination.push( entry );
    }
  }
  return dissemination;
};

const ContentCollector = function( contentPath ){
  const cv = loadCV( path.join( contentPath, 'track-record', 'cv.yaml' ) );
  const dissemination = cvToDissemination( cv, contentPath );
  return {
    bio: renderMarkdownAndProcess( fs.readFileSync( path.join( contentPath, 'track-record', 'bio.md' ) ).toString() ),
    cv: cv,
    dissemination: dissemination,
    related_matters: readFolder( path.join( contentPath, 'related matters'), cv ),
    focus_groups: readFolder( path.join( contentPath, 'focus groups'), cv )
  }
}

module.exports = ContentCollector;