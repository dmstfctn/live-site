const fs = require('fs-extra');
const path = require('path');

const SvgOptimise = require('./SvgOptimise.js');
const Handlebars = require('handlebars');

const buildToSubfolder = require('./Helpers.js').buildToSubfolder();

const Config = require('../Config.js');

let Templating = () => {
  Templating.registerPartials();
  Templating.registerHelpers();
  return Templating.getTemplates();
}

Templating.registerPartials = () => {
  fs.readdirSync( path.join( 'templates', 'partials' ) )
    .forEach( ( f ) => {
      let p = path.join( 'templates', 'partials', f );
      let contents = fs.readFileSync( p ).toString();
      let name = f.replace( '.handlebars','' );
      Handlebars.registerPartial( name, contents );
    });
};

Templating.registerHelpers = () => {
  Handlebars.registerHelper('dc_slidetype', (type, slide, options) => {
    if( type === slide.type ){
      return options.fn(slide);
    }
  });
  Handlebars.registerHelper('dc_name', (options) => {
    return Config.name;
  });
  Handlebars.registerHelper('dc_title', (title, pagetype, options) => {
    if( pagetype && title ){
      return title;
    }
    return (title) ? title + ' | ' + Config.name : Config.name;
  });
  Handlebars.registerHelper('dc_urlpath', (url_path, options) => {
    if( buildToSubfolder ){
      return '/' + path.join( Config.url_root, url_path );
    } else {
      return '/' + url_path;
    }
  }); 
  Handlebars.registerHelper('dc_isrootmenu', ( menu, options) => {
    if( Config.name === menu.name ){
      return options.fn(menu);
    }
    return options.inverse(menu);
  });
  Handlebars.registerHelper('dc_ismenu', (name, menu, options) => {
    if( name === menu.name ){
      return options.fn(menu);
    }
    return options.inverse(menu);
  });
  Handlebars.registerHelper('dc_svg', ( svg_path, options ) => {
    let p = path.join( __dirname, '..', svg_path ); 
    return SvgOptimise.sync( p );
  });
  Handlebars.registerHelper('dc_cvcat', ( category, isnow, hasurl, options ) => { 
    if( category === 'live' && !isnow ){
      return category;
    }    
    if( !hasurl ){
      return category;
    }
    try {
      let p = path.join( __dirname, '..', 'assets', 'svg', 'cvcat_' + category + '.svg' ); 
      let svg = fs.readFileSync( p );
      return SvgOptimise.sync( p ) + '<span class="dc-cv--rawcat">' + category + '</span>';
    } catch (err) {
      return category;
    }    
  });
  Handlebars.registerHelper('dc_collectionLength', ( collection, options ) => {
    if( Array.isArray( collection ) ){
      return collection.length;
    }
    if( typeof collection === 'object' ){
      let count = 0;
      for( let key in collection ) {
        if( collection.hasOwnProperty(key) ){
          count++;
        }
      }
      return count;
    }
    return 0;
  });
  Handlebars.registerHelper( 'debug', ( obj, context ) => {
    console.log('HANDLEBARS DEBUG: ', context )
    console.log( obj );
  })
};

Templating.getTemplates = () => {
  const Templates = {};
  fs.readdirSync( 'templates' )
    .forEach( (f) => {
      if( f !== 'partials' ){
        let p = path.join( 'templates', f );
        let name = f.replace( '.handlebars', '' );
        Templates[name] = Handlebars.compile( fs.readFileSync( p ).toString() );
      }
    });
  return Templates;
};

module.exports = Templating;