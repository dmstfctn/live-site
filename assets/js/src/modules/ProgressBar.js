const ProgressBar = function( length ){  
  this.$ele = document.querySelector('.dc-mobile-bar');
  this.init( 0, length );  
}

ProgressBar.prototype = {
  init: function( current, length ){
    this.setLength( length );
    this.setCurrent( current);
    this.render();
  },
  setLength: function( length ){
    this.length = length;   
  },
  setCurrent: function( current ){
    this.index = current;
    this.setLength( this.length );
  },
  setProgress: function( to ){
    this.index = (to <= this.length) ? to : this.index;
  },
  next: function(){
    this.setProgress( this.index + 1 );
    this.render();
  },
  prev: function(){
    this.setProgress( this.index - 1 );
    this.render();
  },
  render: function(){
    this.percent = this.index / this.length  * 100;
    this.$ele.style.width = this.percent + '%';
  },
  cancelLoadAnim: function(){
    clearTimeout( this.animTimeout );
  },
  startLoadAnim: function( time, backwards ){
    // clearTimeout( this.animTimeout );
    // let indices = [
    //   this.length * 0.75,
    //   this.length * 0.5,
    //   this.length * 0.25
    // ];
    // if( backwards ){ indices.reverse() };

    // this.index = indices[0];
    // this.render();

    // this.animTimeout = setTimeout( () => {
    //   clearTimeout( this.animTimeout );

    //   this.index = indices[1];
    //   this.render();

    //   this.animTimeout = setTimeout( () => {
    //     clearTimeout( this.animTimeout );

    //     this.index = indices[2];
    //     this.render();
        
    //   }, time/2);
    // }, time/2);
    if( backwards ){
      this.index = this.length;
    } else {
      //this.index = 0;
      this.index = this.length;
    }    
    this.render();
  }
}

module.exports = ProgressBar;