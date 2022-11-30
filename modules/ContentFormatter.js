const fs = require('fs-extra');
const URL = require('url').URL;
const path = require('path');
const Config = require('../Config.js');
const H = require('./Helpers.js');
const ImgSize = require('image-size');
const JSDOM = require("jsdom").JSDOM;

const createURLPath = ( name, section ) => {
  const slug = H.createSlug( name );  
  const section_slug = H.createSlug( section );
  let url = section_slug + '/' + slug;
  // if( url[0] !== '/' ){
  //   url = '/' + url;
  // }
  return url;
}

/*
  prepareFile( originalPath, destinationPath, src ):
      from a source path, e.g 'content/related matters/1.2019/1.ECHO FX/landscape/1.image.jpg' 
      and a destination path e.g. 'public/related-matters/echo-fx/content/landscape/'
      create: 
        {
          originalPath: 'content/related matters/1.2019/1.ECHO FX/landscape/1.image.jpg',
          newPath: 'public/related-matters/echo-fx/content/landscape/1.image.jpg',
          src: 'content/landscape/1.image.jpg'
        }
    */

const prepareFile = (  original, destinationPath, src ) => {
  if( typeof original === 'object' ){
    if( 'originalPath' in original ){
      //assume it's already been processed...
      return original;
    }
    const keys = Object.keys(original);
    let list = {};  
    Object.values(original).forEach( (value, index ) => {
      list[ keys[index] ] = prepareFile( value, destinationPath, src );
    });
    return list;
  }  
  const filename = path.basename( original );
  const prepared = {
    originalPath: original,
    newPath: path.join( destinationPath, filename ),
    src: path.join( src, filename ),
    processed: false
  };
  return prepared;
}

/* 
  prepareImage( originalPath, destinationPath, destinationSrc, _prefix ):
      from a source path, e.g 'content/related matters/1.2019/1.ECHO FX/landscape/1.image.jpg' 
      and a destination path e.g. 'public/related-matters/echo-fx/content/landscape/'
      create: 
        {
          originalPath: 'content/related matters/1.2019/1.ECHO FX/landscape/1.image.jpg',
          newPath: 'public/related-matters/echo-fx/content/landscape/1.image.jpg',
          src: 'content/landscape/1.image.jpg',
          lowPath: 'public/related-matters/echo-fx/content/landscape/tiny.1.image.jpg',
          lowSrc: 'content/landscape/tiny.1.image.jpg'.
          isImage: true,
          processed: false /// set to true once file has been moved, sized, etc
        }
    */
const prepareImage = ( original, destinationPath, src, _prefix ) => {
  let prefix = _prefix || false;
  if( typeof original === 'object' ){
    if( 'dimensions' in original ){
      //assume it's already been processed...
      return original;
    }
    const keys = Object.keys(original);
    let list = {};      
    Object.values(original).forEach( (value, index ) => {      
      list[ keys[index] ] = prepareImage( value, destinationPath, src, keys[index] );
    });
    return list;
  }  
  const filename = path.basename( original );
  const outFilename = ( prefix ) ? prefix + '.' + filename : filename;
  const lowFilename = 'tiny.' + outFilename;  
  const halfFilename = 'half.' + outFilename;
  const prepared = {
    originalPath: original,
    newPath: path.join( destinationPath, outFilename ),
    src: path.join( src, outFilename ),
    lowPath: path.join( destinationPath, lowFilename ),
    lowSrc: path.join( src, lowFilename ),
    halfPath: path.join( destinationPath, halfFilename ),
    halfSrc: path.join( src, halfFilename ),
    isImage: true,
    processed: false,
    dimensions: ImgSize( original )
  };
  return prepared;
}

/* prepareWindow( original ):
  takes the contents (original) of a .window slide and configures
  contents might be:
    - an object,
      in which case we read the config object
    - text/html,
      in which case we create a config object around this as content

    returns:
    {
      original: original,
      content: the text/html OR false,
      url: the url OR false,
      config: the config object OR false
    }
*/

const prepareWindow = ( original ) => {
  if( typeof original === 'object' ){
    if( 'config' in original ){
      //assume it's already been processed...
      console.log(config);
      return original;
    }
    if( 'url' in original ){
      // let it go ahead
    } else {
      const keys = Object.keys( original );
      let list = {};  
      Object.values(original).forEach( (value, index ) => {
        list[ keys[index] ] = prepareWindow( value );
      });
      return list;
    }
  }  
  const prepFromUrl = ( config ) => { 
    prepared.config = config;
    return prepared;
  }
  const prepFromHTML = ( html ) => {
    prepared.content = html;
    return prepared;
  }
  let prepared = {
    original: original,
    content: false,    
    config: false,
    name: original.name
  };
  try{    
    let url = new URL(original.url);
    return prepFromUrl( original );
  } catch( e ){
    // assume it's an embed code
    return prepFromHTML( original );
  }
}

/*
  prepareEmbed( original ):
    takes the contents (original) of an .embed slide and configures.
    contents might be:
      - an embed code, 
          in which case we figure out what service it is and
          send the embed code straight out again with that attached
      - a url, 
          in which case we figure out what service it is and construct 
          an object with config options
    
      returns:
      {
        original: original,
        service: 'vimeo' // currently only vimeo supported...
        url: the link either input, or parsed from embed code,
        embed: the embed code (if it's there), otherwise: FALSE
      }
*/

const prepareEmbed = ( original ) => {
  if( typeof original === 'object' ){
    if( 'service' in original ){
      //assume it's already been processed...
      return original;
    }
    const keys = Object.keys( original );
    let list = {};  
    Object.values(original).forEach( (value, index ) => {
      list[ keys[index] ] = prepareEmbed( value );
    });
    return list;
  }  
  const serviceFromUrl = ( url ) => {
    const services = [
      {
        name: 'vimeo',
        identifier: 'vimeo.com'
      }
    ];
    for( let i = 0; i < services.length; i++ ){
      if( url.indexOf( services[i].identifier ) !== -1 ){
        return services[i].name;
      }
    }
    return false;
  }
  const prepFromUrl = ( url ) => {
    prepared.url = url;
    prepared.service = serviceFromUrl( url );
    return prepared;
  }
  const prepFromEmbed = ( embed ) => {
    const d = JSDOM.fragment( embed );
    const iframe = d.querySelector('iframe');
    const url = iframe.getAttribute('src');
    prepared.embed = embed;
    prepared.url = url;
    prepared.service = serviceFromUrl( url );
    return prepared;
  }
  let prepared = {
    original: original,
    service: false,
    url: false,
    embed: false
  };
  try{
    let url = new URL(original);
    return prepFromUrl( original );
  } catch( e ){
    // assume it's an embed code
    return prepFromEmbed( original );
  }
}

const prepareSlide = ( slide, pageName, slideshowName, section, addSectionToSrc ) => {
  const sectionToSrc = !!addSectionToSrc;
  const destinationPath = path.join( Config.paths.public, section, pageName, 'content', slideshowName );
  
  const src = ( sectionToSrc ) ? 
                path.join( section, 'content', slideshowName ) 
                : path.join( 'content', slideshowName );

  if( slide.type === 'image' ){    
    // move and resize
    slide.content = prepareImage( slide.content, destinationPath, src );
    return slide;
  }
  if( slide.type === 'video' || slide.type === 'audio' ){
    // just move
    slide.content = prepareFile( slide.content, destinationPath, src );
    return slide;
  }
  if( slide.type === 'embed'){    
    slide.content = prepareEmbed( slide.content );
    return slide;
  }   
  if( slide.type === 'window'){    
    slide.content = prepareWindow( slide.content );
    return slide;
  }   

  return slide;
}

const slideshowNav = ( slideshow, _first ) => {
  let first = _first || 'info';
  let labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let nav = [];  
  for( let i = 0; i < slideshow.slides.length; i++ ){
    if( i === 0 ){     
      nav.push( {
        left: { label: first + Config.letterSeparator, active: false}, 
        right: { label: labels[i] + Config.letterSeparator, active: true},
        self: { label: labels[i], active: true }
      } );
    } else if( i === slideshow.slides.length - 1 ){
      nav.push( {
        left: { label: labels[i] + Config.letterSeparator, active: true}, 
        right: { label: '(end)', active: false},
        self: { label: labels[i], active: true }
      } );
    } else {
      if( i % 2 !== 0 ){
        nav.push( {
          left: { label: labels[i] + Config.letterSeparator, active: true}, 
          right: { label: labels[i+1] + Config.letterSeparator, active: false},
          self: { label: labels[i], active: true }
        });
      } else {
        nav.push( {
          left: { label: labels[i-1] + Config.letterSeparator, active: false}, 
          right: { label: labels[i] + Config.letterSeparator, active: true},
          self: { label: labels[i], active: true }
        });
      }
    }
  }
  return nav;
};

const prepareSlideshow = ( slideshow, pageName, slideshowName, section, addSectionToSrc  ) => {
  let nav = slideshowNav( slideshow, pageName );
  for( let i in slideshow.slides ){
    slideshow.slides[i] = prepareSlide( slideshow.slides[i], H.createSlug(pageName), slideshowName, section, addSectionToSrc );
    slideshow.slides[i].nav = nav[i];
  }
  return slideshow;
}

const dateToHTML = ( date ) => { 
  return date.replace( '-', '<span class="dctxt--date--hyphen">-</span>' );
}

const createRelatedMatters = ( related_matters, cv ) => {
  const section_name = Config.name;
  const section_slug = H.createSlug('Related Matters');

  let list = [];
  let now = false;
  for( let i in related_matters.contents ){
    let item = related_matters.contents[i];
    let line = {
      name: item.name,
      name_html: dateToHTML( item.name ),
      contents: []
    };
    for( let j in item.contents ){
      let sub_item = item.contents[j];           
      for( slideshowName in sub_item.slideshows ){
        let slideshow = sub_item.slideshows[ slideshowName ];
        sub_item.slideshows[ slideshowName ] = prepareSlideshow( slideshow, sub_item.name, H.createSlug(slideshowName), section_slug  );
      }
      sub_item.cv = structureCV( sub_item.cv );
      line.contents.push({
        name: sub_item.name,
        title: sub_item.title,
        date: item.name,
        pagetype: 'relatedmatter',        
        slug: H.createSlug( sub_item.name ),
        url: (sub_item.data.link) ? sub_item.data.link : createURLPath( sub_item.name, 'related matters' ),
        is_external: !!sub_item.data.link,
        data: sub_item
      });
    }
    list.push( line );
  }

  for( let i = 0; i < cv.entries.length; i++ ){
    if( cv.entries[i].now ){
      now = cv.entries[i];
      now.label = (typeof cv.entries[i].now === 'string') ? cv.entries[i].now : 'now';
      break;
    }    
  }

  return {
    name: section_name,
    slug: section_slug,
    template: 'list_work',
    pagetype: 'relatedmatter',
    contents: list,
    now: now
  };
}

const createFocusGroups = ( focus_groups ) => {
  const section_name = 'focus groups';
  const section_slug = H.createSlug('Focus Groups');

  let list = [];
  for( let i in focus_groups.contents ){
    let item = focus_groups.contents[i];
    for( let j in item.contents ){
      let sub_item = item.contents[j];
      for( slideshowName in sub_item.slideshows ){
        let slideshow = sub_item.slideshows[ slideshowName ];
        sub_item.slideshows[ slideshowName ] = prepareSlideshow( slideshow, sub_item.name, H.createSlug(slideshowName), section_slug  );
      }
      sub_item.cv = structureCV( sub_item.cv );
      let line = {
        name: item.name,
        name_html: dateToHTML( item.name ),
        contents: [
          {
            name: sub_item.name,
            title: sub_item.title,
            date: item.name,
            pagetype: 'focusgroup',
            slug: H.createSlug( sub_item.name ),
            url: (sub_item.data.link) ? sub_item.data.link : createURLPath( sub_item.name, 'focus groups' ),
            is_external: !!sub_item.data.link,
            data: sub_item
          }
        ]
      };
      list.push( line );
    }
  }
  return {
    name: section_name,
    slug: section_slug,
    pagetype: 'focusgroup',
    template: 'list_work',
    contents: list
  };
};

const createDissemination = ( dissemination ) => {
  const section_name = 'dissemination';
  const section_slug =  H.createSlug( 'Dissemination' );
  const destinationPath = path.join( Config.paths.public, 'track-record', 'content' );
  const src = path.join( 'track-record', 'content' );
  for( let i in dissemination ){    
    dissemination[i].image = prepareImage( dissemination[i].image, destinationPath, src );    
  }
  let list = [];  
  return {
    name: section_name,
    slug: section_slug,
    template: 'list_dissemination',
    pagetype: 'dissemination',
    contents: dissemination
  }
};

const structureCV = ( cv ) => {
  /* paths / src for moving images */
  const destinationPath = path.join( Config.paths.public, 'track-record', 'content' );
  const src =  path.join( 'track-record', 'content' );

  let structure = [];
  const years = cv.entries
    .map( e => e.year )
    .filter( (year, index, self ) => {
      return self.indexOf(year) === index;
    })
    .sort( (y1, y2) => {
      //order descending
      return parseInt( y2 ) - parseInt( y1 );
    });
  
  years.forEach( ( year ) => {
    const entries = cv.entries.filter( e => e.year === year );
    let contents = {};
    let yearPriority = Infinity;
    entries.forEach( (entry) => {      
      if( !contents[entry.type] ){
        contents[entry.type] = {
          type: entry.type,
          contents: []
        };
      }
      if( !!entry.image ){
        entry.image = prepareImage( entry.image, destinationPath, src );    
      }
      contents[entry.type].contents.push( entry );
      if( entry.priority < yearPriority ){
        yearPriority = entry.priority;
      }
    });
    structure.push({
      'year': year,
      'priority': yearPriority,
      'contents': contents
    });
  });

  return structure;
}

const createTrackRecord = ( bio, cv ) => {
  const section_name = 'track record';
  const section_slug = H.createSlug( 'Track Record' );

  return {
    name: section_name,
    slug: section_slug,
    template: 'list_track-record',
    url: createURLPath( 'Track Record', '' ),
    contents: {
      bio: bio,
      cv: structureCV( cv )
    }
  };
}

const createPageList = ( from ) => {  
  return from.map( (e) => {
    return e.contents;
  })
  .flat()
  // .filter( (p) => {
  //   return !p.is_external;
  // })
  .reverse();
}

const yearNameToNumeric = ( name )=>{
  return name.match( /([0-9]+)/g )
    .map( ( y ) => {
      if( y.length < 4 ){ return parseInt( '20' + y ); }
      return parseInt( y );
    })
    .sort( ( a, b ) => {
      return a - b; // pick lowest - i.e. start year
    })[0];
};

const createSmallSite = ( content ) => {
  let site = {
    pages: [{
      year: Infinity,
      url: Config.url_root + '/',
      title: Config.name
    }],    
  };
  for( let i in content.related_matters.contents ){
    let year = content.related_matters.contents[i];
    let yearNumeric = yearNameToNumeric( year.name );
     
    for( let j in year.contents ){
      let item = year.contents[j];
      if( !item.data.link ){
        site.pages.push({
          year: yearNumeric + 0.5, //so that these go before focus groups
          url: Config.url_root + '/' + createURLPath( item.name, 'related matters' ),
          title: item.name
        });
      }
    }
  }
  for( let i in  content.focus_groups.contents ){
    let year = content.focus_groups.contents[i];
    let yearNumeric = yearNameToNumeric( year.name );

    for( let j in year.contents ){
      let item = year.contents[j];
      if( !item.data.link ){
        site.pages.push({
          year: yearNumeric,
          url: Config.url_root + '/' + createURLPath( item.name, 'focus groups' ),
          title: item.name
        });
      }
    }
  }
  site.pages = site.pages.sort( (a, b) => b.year - a.year );
  return site;
};

module.exports = {
  createRelatedMatters, 
  createFocusGroups, 
  createDissemination,
  createTrackRecord,
  createPageList,
  createSmallSite
};