var createSlides = require('..')

var el = document.querySelector('.slides')

var alter = function (unit, options) {
  var el = unit.el

  switch (unit.state) {
    case 'current':
      el.style.fontWeight = 'bold'
      el.style.color = 'red'
      break
    case 'previous':
      el.style.fontWeight = 'normal'
      el.style.color = 'black'
      break
    case 'next':
      el.style.fontWeight = 'normal'
      el.style.color = 'yellow'
      break
    default:
      el.style.fontWeight = 'normal'
      el.style.color = '#ccc'
  }

  el.classList.add(unit.state)

  if (options.previousState) {
    el.classList.remove(options.previousState)
  }
}

createSlides.Unit.load = function () {
  var self = this
  var el = self.el

  el.id = 'index' + (self.index || '-')
}

var opts = {
  loop: true,
  1: { loop: true },
  2: { loop: true }
}

createSlides.Unit.childrenToArray = function (el, depth) {
  var children = [].slice.call(el.children || [], 0)
  
  children.forEach(function (_el) {
    _el.setAttribute('data-depth', depth)
  })

  return children
}

var slides = createSlides(el, alter, opts).run()

window.slides = slides
