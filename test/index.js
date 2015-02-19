var test = require('tape');

var Slides = require('../');
var Group = Slides.Group;
var Item = Slides.Item;
var noop = function () {};


test('new Slides()', function (t) {
  t.plan(4);

  var options = { slides: { a: 1 }};
  var slides = new Slides(null, options, noop);

  t.notEqual(options, slides.options, '`options` passed is not mutable');
  t.equal(slides.options.a, 1, '`options` is correct');

  t.throws(function () {
    return new Slides(null);
  }, 'not passing an `alter` function with 1 arg throws');

  t.throws(function () {
    return new Slides(null, options);
  }, 'not passing an `alter` function with 2 args throws');
});

test('isGroup() and isItem()', function (t) {
  var item = new Item(0);
  var group = new Group(0, null);

  t.ok(item.isItem(), 'item is Item instance');
  t.notOk(group.isItem(), 'group is not Item instance');

  t.ok(group.isGroup(), 'group is Group instance');
  t.notOk(item.isGroup(), 'item is not Group instance');

  t.end();
});

test('`state` gets set correctly by changeState()', function (t) {
  var group = new Group(0, null);
  var counter = 0;

  function callback(previousState, currentState, options) {
    counter++;
  }

  group.children = [
    { index: 0, alter: noop, onstatechange: noop },
    { index: 1, alter: noop, onstatechange: noop },
    { index: 2, alter: noop, onstatechange: noop },
    { index: 3, alter: noop, onstatechange: noop },
    { index: 4, alter: noop, onstatechange: noop },
    { index: 5, alter: noop, onstatechange: noop },
    { index: 6, alter: noop, onstatechange: callback }
  ];

  group.activeIndex = 3;
  group.update();

  t.equal(group.children[0].state, 'before');
  t.equal(group.children[1].state, 'before');
  t.equal(group.children[2].state, 'previous');
  t.equal(group.children[3].state, 'current');
  t.equal(group.children[4].state, 'next');
  t.equal(group.children[5].state, 'after');
  t.equal(group.children[6].state, 'after');

  group.activeIndex = 0;
  group.update();

  t.equal(group.children[0].state, 'current');
  t.equal(group.children[1].state, 'next');
  t.equal(group.children[2].state, 'after');
  t.equal(group.children[6].state, 'after');

  group.activeIndex = 6;
  group.update();

  t.equal(group.children[4].state, 'before');
  t.equal(group.children[5].state, 'previous');
  t.equal(group.children[6].state, 'current');

  t.equal(counter, 2, 'onstatechange hook gets called');

  t.end();
});

test('passing options.group = false omits Items', function (t) {
  t.plan(1);

  // TODO
  t.ok(true);
});

test('defaults.childrenToArray() should return an empty array when no `children`', function (t) {
  t.plan(2);

  t.equal(typeof Slides.defaults.slides.childrenToArray().forEach, 'function');
  t.equal(typeof Slides.defaults.slides.childrenToArray({ children: undefined }).forEach, 'function');
});
