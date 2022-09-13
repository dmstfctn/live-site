const SmallAnimations = function( $ele ){
  this.$ele = $ele;
  this.triggerNoFurtherTimeout = null;
  this.forwardHintTimeout = null;
}

SmallAnimations.prototype = {
  clearNoFurtherTimeout: function(){
    clearTimeout( this.triggerNoFurtherTimeout );
  },
  clearForwardHintTimeout: function(){
    clearTimeout( this.forwardHintTimeout );
  },
  clearForwardHintAnimationTimeout: function(){
    clearTimeout( this.forwardHintAnimationTimeout );
  },
  triggerNoFurther: function(){
    this.clearNoFurtherTimeout();
    this.$ele.classList.add('no-further');
    this.triggerNoFurtherAnimationTimeout =  setTimeout( () => {
      this.$ele.classList.remove('no-further');
    }, 10 );
  },
  triggerForwardHint: function(){
    this.clearForwardHintAnimationTimeout();
    this.$ele.classList.add('go-further');
    this.forwardHintAnimationTimeout = setTimeout(() => {
      this.$ele.classList.remove('go-further');
    }, 1200);
  },
  readyForwardHint: function(){
    this.clearForwardHintTimeout();
    this.forwardHintTimeout = setTimeout(() => {
      
    }, 10000 );
  },
  cancelForwardHint: function(){
    this.clearForwardHintTimeout();
    document.querySelector('html').classList.add('dc-has-gone-further');
  }
};

module.exports = SmallAnimations;