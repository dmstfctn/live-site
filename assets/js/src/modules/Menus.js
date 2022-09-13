const CFG = require('./Config.js');

const Menus = function(){
  this.INIT_PAGETYPE = document.querySelector('html').getAttribute('data-dc-pagetype');
  this.$titles = document.querySelectorAll( '.dc-sitenav__main a' );
  this.$dropdowns = document.querySelectorAll( '.dc-navigation-item, .dc-track-record' );
  this.$links = document.querySelectorAll( '.dc-work--items a' );

  this.$titles.forEach( ( $title ) => {
    this.setupTitleLink( $title );
  });

  this.$links.forEach( ( $link ) => {
    this.setupLink( $link );
  });
};

Menus.prototype = {
  onChange: function( id ){ /* ... override ... */ },
  _onChange: function( id ){
    this.onChange( id );
  },
  onTransitionStart: function(){ /* ... override ... */ },
  _onTransitionStart: function(){
    this.onTransitionStart();
  },
  onTransitionEnd: function(){ /* ... override ... */ },
  _onTransitionEnd: function(){
    this.onTransitionEnd();
  },
  showMenuById: function( id ){
    const $link = document.querySelector('.dc-sitenav__main [data-dc-localtarget="#' + id + '"]' );
    const $menu = document.querySelector( '#' + id );
    this.showMenu( $link, $menu );
  },
  showMenu: function( $title, $menu ){
    if( $title === null ){
      $title = document.querySelector('.dc-sitenav__main [data-dc-localtarget="#related-matters"]' );
    } 
    if( $menu === null ){
      $menu = document.querySelector( '#related-matters' );
    }
    const pagetype = $menu.getAttribute('data-pagetype');
    const id = $menu.id;    
    this.hideMenus();

    $title.classList.add( 'active' );
    $menu.style.display = 'block';  
    //console.log('showMenu(), pagetype: ', pagetype );
    
    // clear data-dc-homeactive attribute used to show correct menu on load
    document.querySelector('html').setAttribute('data-dc-homeactive', '');
    document.querySelector('html').setAttribute('data-dc-pagetype', pagetype );
    
    this._onChange( id );
  },
  hideMenus: function(){
    this.$titles.forEach( ( $title ) => { $title.classList.remove( 'active' ); });
    this.$dropdowns.forEach( ( $dropdown ) => { $dropdown.style.display = 'none'; });
  },
  setupTitleLink: function( $title ){
    $title.addEventListener( 'click', (e) => {
      if( window.innerWidth < CFG.BREAKPOINT ){
        return;
      }
      e.preventDefault();
      let target = $title.getAttribute( 'data-dc-localtarget' );
      let $menu = document.querySelector( target );          
      
      if( $title.classList.contains( 'active' ) ){ return false; }

      this.showMenu( $title, $menu );

      return false;
    });
  },
  setupLink: function( $link ){
    if( $link.classList.contains('dc-external-link') ){ 
      return 
    }
    
    $link.addEventListener('click', ( e ) => {
      e.preventDefault();
      this.runTransition( $link );
    });
  },
  resetTransition: function(){
    this.$dropdowns.forEach( ($dropdown) => {
      $dropdown
        .querySelectorAll( '.' + CFG.TRANSITION_HIDE_CLASS )
        .forEach(function( $out ){
          $out.classList.remove( CFG.TRANSITION_HIDE_CLASS );
        });
      $dropdown
        .querySelectorAll('.' + CFG.TRANSITION_ACTIVE_CLASS )
        .forEach(function( $active ){
          $active.classList.remove( CFG.TRANSITION_ACTIVE_CLASS );
        })
    });

  },
  runTransition: function( $link ){
    this._onTransitionStart();
    const $dropdown = $link.parentElement.parentElement.parentElement.parentElement;
    const $links = $dropdown.querySelectorAll( '.dc-work--items a' );
    const $thisYear = $link.parentElement.parentElement.querySelector('h2');
    const $others = [...$links].filter( ($e) => { return !$e.isSameNode( $link ) } ); 
    const $dcNow = $dropdown.querySelector('.dc-biglist--now');
    const $dates = $dropdown.querySelectorAll( '.dc-work--year h2' );

    $link.classList.add( CFG.TRANSITION_ACTIVE_CLASS );
    $others.forEach( ( $other ) => { $other.classList.add( CFG.TRANSITION_HIDE_CLASS ) });
    $dates.forEach( ( $date ) => { $date.classList.add( CFG.TRANSITION_HIDE_CLASS ) });
    $thisYear.classList.remove( CFG.TRANSITION_HIDE_CLASS );
    if( $dcNow ){
      $dcNow.classList.add( CFG.TRANSITION_HIDE_CLASS );
    }
    setTimeout(()=>{      
      this.hideMenus();
      this.resetTransition();
      this._onTransitionEnd();
    }, 600 );
  }
};

module.exports = Menus;