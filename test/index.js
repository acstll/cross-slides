var test = require('tape');

var createSlides = require('../');
var Slides = createSlides.Slides;
var Group = createSlides.Group;
var Item = createSlides.Item;
var noop = function () {};


test('createSlides()', function (t) {
  t.plan(4);

  var options = { slides: { a: 1 }};
  var slides = createSlides(null, options, noop);

  t.notEqual(options, slides.options, '`options` passed is not mutable');
  t.equal(slides.options.a, 1, '`options` is correct');

  t.throws(function () {
    return createSlides(null);
  }, 'not passing an `alter` function with 1 arg throws');

  t.throws(function () {
    return createSlides(null, options);
  }, 'not passing an `alter` function with 2 args throws');
});

test('`state` gets set correctly by changeState()', function (t) {
  var group = Object.create(Group).init(0, null);

  group.children = [
    { index: 0, alter: noop, emit: noop },
    { index: 1, alter: noop, emit: noop },
    { index: 2, alter: noop, emit: noop },
    { index: 3, alter: noop, emit: noop },
    { index: 4, alter: noop, emit: noop },
    { index: 5, alter: noop, emit: noop },
    { index: 6, alter: noop, emit: noop }
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

  t.end();
});

test('passing options.group = false omits Items', function (t) {
  t.plan(1);

  // TODO
  t.ok(true, 'nothing tested');
});

test('EventEmitter', function (t) {
  t.plan(3);

  var el = {
    children: [
      {
        el: {
          children: [
            {
              el: {}
            },
            {
              el: {}
            }
          ]
        }
      },
      {
        el: {
          children: [
            {
              el: {}
            },
            {
              el: {}
            }
          ]
        }
      }
    ]
  };

  var slides = createSlides(el, noop);

  slides.on('test', function (value) {
    t.equal(value, 1, 'emits events')
  });

  slides.emit('test', 1);

  // 2 times
  slides.on('change group', function (group, previousState, options) {
    t.ok(group, 'group state change triggered');
  });

  slides.move();

  // 2 times
  // slides.on('item change', function (item, previousState, options) {
  //   t.ok(item, 'item state change triggered');
  // });

  // slides.moveDeep();
});

test('childrenToArray() should return an empty array when no `children`', function (t) {
  t.plan(2);

  t.equal(typeof Slides.childrenToArray().forEach, 'function');
  t.equal(typeof Slides.childrenToArray({ children: undefined }).forEach, 'function');
});
