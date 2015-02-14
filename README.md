# Cross-slides

Slideshow utility.

## TODO

- [x] use a different `state` for right next and right before items
- [x] add `onstatechange(previousState)` hook  
- [ ] remove jQuery
- [ ] use `options` to `Slides()` to get `children()`, `group.load()`, `selector? (String)` and `loop (Bool)` (these functions should be the only ones touching the DOM)
- [ ] test it
- [ ] call load Groups selectively
- [ ] implement `shift()` and `shiftDeep()`
- [ ] implement `moveTo(index)`

- allow passing "event handlers" in `options`?

### Adding methods to the Slides prototype example

```js
Slides.prototype.setActiveIndexById = function (id) {
  if (!id) return;
  var self = this;

  this.children.some(function (group) {
    if (group.id === id) {
      self.activeIndex = group.index;
      return true;
    }
  });
}
```
