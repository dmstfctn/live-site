/*
  $ele: // [Required] wrapper element to apply height to
  $units: // [Required] the units / lines / contents
  $inset: // [Optional] element/s to measure to take away from available space (e.g. NOW line)
*/


const Run = function( $ele, $units, _inset ){
  const inset = _inset || 0;
  const unitCount = $units.length;
  const unitSize = $units[0].getBoundingClientRect().height;
  let availableSpace = window.innerHeight;
  if( inset ){    
    availableSpace -= inset;
  }
  const bottom = $ele.getBoundingClientRect().bottom;
  if( bottom >= availableSpace ){
    const overflow = bottom - availableSpace;
    const overflowUnitCount = Math.ceil( overflow / unitSize );
    const maxUnits = unitCount - overflowUnitCount;
    $units.forEach(function( $ele, index ){
      if( index >= maxUnits ){
        $ele.style.opacity = 0;
        $ele.style.pointerEvents = 'none';
      } else {
        $ele.style.opacity = '';
        $ele.style.pointerEvents = '';
      }
    });
  } else {
    $units.forEach(function( $ele, index ){
      $ele.style.opacity = '';
      $ele.style.pointerEvents = '';
    });
  }
}

const VisualQuantiser = function( $ele, $units, $_inset ){
  const $inset = $_inset || false;  
  if( $inset ){
    return {
      run: function(){
        Run( $ele, $units, $inset.getBoundingClientRect().height );
      }
    };
  }
  return {
    run: function(){
      Run( $ele, $units );  
    }  
  };
}

module.exports = VisualQuantiser;