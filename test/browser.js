var createSlides = require('..');

var el = document.querySelector('.slides');

var alter = function (action, options) {
  var el = this.el;

  switch (this.state) {
    case 'current':
      el.style.fontWeight = 'bold';
      el.style.color = 'red';
      break;
    case 'previous':
      el.style.fontWeight = 'normal';
      el.style.color = 'black';
      break;
    case 'next':
      el.style.fontWeight = 'normal';
      el.style.color = 'yellow';
      break;
    default:
      el.style.fontWeight = 'normal';
      el.style.color = '#ccc';
  }

  el.classList.add(this.state);
  if (options.previousState) {
    el.classList.remove(options.previousState);
  }
};

var slides = createSlides(el, { loop: true, 0: { loop: true } }, alter);

slides.start();

window._s = slides;