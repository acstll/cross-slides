var createSlides = require('..');

var el = document.querySelector('.slides');

var alter = function (action, options) {
  var el = this.el;
  if (this.state === 'current') {
    el.style.fontWeight = 'bold';
    el.style.color = 'pink';
  } else {
    el.style.fontWeight = 'normal';
    el.style.color = 'black';
  }

  el.classList.add(this.state);
  if (options.previousState) {
    el.classList.remove(options.previousState);
  }
};

var slides = createSlides(el, { slides: { loop: true }}, alter);

slides.start();

window._s = slides;