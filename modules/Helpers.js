const Config = require('../Config.js');

const createSlug = ( name ) => {
  return name.toLowerCase()
          .replace( /[^\w\d]/g, '-' )
          .replace( /-+/g, '-' )
          .replace( /^-|-$/, '' );
}

const buildToSubfolder = () => {
  return Config.url_root !== '' && Config.url_root !== '/';
}

module.exports = {
  createSlug,
  buildToSubfolder
};