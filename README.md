# Cross-slides

Slideshow utility.

## TODO

- [x] use a different `state` for right next and right before items
- [x] add `onstatechange(previousState)` hook  
- [x] add `isGroup()` and `isItem()`
- [x] remove `_move` method and use a single `alter` function for both Group and Item? so it's easier to setup by just passing that one function
- [x] remove jQuery
- [x] implement internal `children()` and `load()`
- [x] use `options` to `Slides()` to get `children()`, `group.load()`, and `loop (Bool)` (these functions should be the only ones touching the DOM)
- [x] implement looping mode on `move()`
- [x] use events instead of "hooks" WIP
- [ ] implement looping mode on `changeState()`
- [ ] test it for real (browser)
- [ ] test options.group = false
- [x] call Groups.load selectively? (user)
- [ ] implement `shift()` and `shiftDeep()` (maybe use the same `move` with `steps` being 1-100 to move or 0-1 to shift)
- [ ] implement `moveTo(index)`
- [ ] finish docs

## API

### createSlides(el, [options,] alter);

#### #move(steps[, options, callback]);
#### #moveDeep(steps[, options, callback]);
#### #start([index])
#### #stop()
#### #is(state)

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
