# Cross-slides

Slideshow utility.

## TODO

- [x] use a different `state` for right next and right before items
- [x] add `onstatechange(previousState)` hook  
- [ ] implement `shift()` and `shiftDeep()`
- [ ] remove jQuery
- [ ] implement `moveTo(index)`
- [ ] test all
- [ ] load Groups selectively

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
