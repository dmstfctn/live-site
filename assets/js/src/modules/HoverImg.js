const HoverImg = function( $hoverImg ){
  this.$img = $hoverImg.querySelector('img');
  $hoverImg.addEventListener( 'mouseover', ( e ) => {
    this.$img.addEventListener('load', () => {
      this.$img.classList.add('loaded');      
      this._onShow();
    }, {once: true});
    this.$img.src = this.$img.getAttribute( 'data-src' );
  });
};

HoverImg.prototype = {
  _onShow: function(){
    this.onShow();
  },
  onShow: function(){ /* ... override ... */ }
};

module.exports = HoverImg;