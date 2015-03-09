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
- `reset` (slides)
- `update` (slides, options)
- `reset group` (group)
- `update group` (group, options)
- `change group` (group, previousState, options)
- `change item` (item, previousState, options)

## Examples

### Adding methods to the Slides "prototype" example

```js
var Slides = require('cross-slides').Slides;

Slides.setActiveIndexById = function (id) {
  if (!id) return;
  var self = this;

  this.children.some(function (group) {
    if (group.id === id) { // check 'reset group' example below
      self.activeIndex = group.index;
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

// Add an `id` property to every group instance 
// based on its DOM element `id` attribute
slides.on('reset group', function (group) {
  group.id = group.el.getAttribute('id');
});
```
