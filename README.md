# Cross-slides

Slideshow utility.

## API

### createSlides(el, [options,] alter);

#### #move(steps[, options, callback]);
#### #moveDeep(steps[, options, callback]);
#### #start([index])
#### #stop()
#### #is(state)
#### #reset(el)

### Events

- `start` (slides)
- `stop` (slides)
- `reset` (slides) [*not* on initial createSlides call]
- `update` (slides, options), (unit, options)
- `update <depth>` (unit, options)
- `change` (unit, previousState, options)
- `change <depth>` (unit, previousState, options)
- `initialize' (unit)
- `initialize <depth>` (unit)

## Examples

### Adding methods to the Slides "prototype" example

```js
var Slides = require('cross-slides').Slides;

Slides.setActiveIndexById = function (id) {
  if (!id) return;
  var self = this;

  this.children.some(function (unit) {
    if (unit.id === id) { // check 'reset unit' example below
      self.activeIndex = unit.index;
      return true;
    }
  });
};
```

### Event handler example

```js
var slides = createSlides(el);

// Reset all groups to the first position on start.
slides.on('start', function () {
  slides.children.forEach(function (group) {
    group.activeIndex = 0;
  });
};

// Add an `id` property to every unit instance 
// based on its DOM element `id` attribute
slides.on('initialize', function (unit) {
  unit.id = unit.el.getAttribute('id');
});
```
