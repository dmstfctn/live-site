const title = document.title;
let currentTitle = title;

const titleShift = () => {
  const firstChar = currentTitle.substring(0, 1);
  currentTitle = currentTitle.substring(1, currentTitle.length) + firstChar;
  if( firstChar === ' ' ){
    titleShift();
  } else {
    document.title = currentTitle;
  }
}

const titleScroll = () => {
  titleShift();
  setTimeout( titleScroll, 150);
}

titleScroll();