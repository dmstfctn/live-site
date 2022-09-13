const Dots = function( $dots ){
  this.$dots = $dots;
  this.initialHTML = this.$dots.innerHTML;
  this.character = this.initialHTML.substring(0,1);
  this.content = this.character;
}

Dots.prototype = {
  isOverflowing: function(){
    return this.$dots.scrollWidth > this.$dots.clientWidth;
  },
  calculate: function(){
    this.content = this.initialHTML;
    this.$dots.innerHTML = this.content;
    this.isOverflowing();
    while( this.isOverflowing() ){
      this.content = this.content.substring( 0, this.content.length - 1 );
      this.$dots.innerHTML = this.content;
    }    
  }
};

module.exports = Dots;