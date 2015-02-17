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
- [ ] implement looping mode on `move`
- [ ] test it for real
- [ ] call load Groups selectively
- [ ] implement `shift()` and `shiftDeep()` (maybe use the same `move` with `steps` being 1-100 to move or 0-1 to shift)
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

### Hook example

```js
// Reset all groups to the first position on start.
Slides.prototype.onstart = function () {
  this.children.forEach(function (group) {
    group.activeIndex = 0;
  });
}
```
