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

## Examples

### Adding methods to the Slides "prototype" example

```js
var Slides = require('cross-slides').Slides;

Slides.setActiveIndexById = function (id) {
  if (!id) return;
  var self = this;

  this.children.some(function (group) {
    if (group.id === id) {
      self.activeIndex = group.index;
      return true;
    }
  });
};
```

### Event handler example

```js
// Reset all groups to the first position on start.
var slides = createSlides(el);

slides.on('start', function () {
  slides.children.forEach(function (group) {
    group.activeIndex = 0;
  });
};
```
