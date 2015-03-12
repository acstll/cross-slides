var test = require('tape');
var inspect = require('util').inspect;

var createSlides = require('../');
var Slides = createSlides.Slides;
var Unit = createSlides.Unit;
var noop = function () {};


test('createSlides()', function (t) {
  t.plan(4);

  var options = { a: 1 };
  var slides = createSlides(null, options, noop);

  t.notEqual(options, slides.config, '`options` passed is not mutable');
  t.equal(slides.config.a, 1, '`options` is correct');

  t.throws(function () {
    return createSlides(null);
  }, 'not passing an `alter` function with 1 arg throws');

  t.throws(function () {
    return createSlides(null, options);
  }, 'not passing an `alter` function with 2 args throws');
});

test('`state` gets set correctly by changeState()', function (t) {
  var unit = Object.create(Unit).init({ index: 0 });

  unit.children = [
    { index: 0, alter: noop, emit: noop },
    { index: 1, alter: noop, emit: noop },
    { index: 2, alter: noop, emit: noop },
    { index: 3, alter: noop, emit: noop },
    { index: 4, alter: noop, emit: noop },
    { index: 5, alter: noop, emit: noop },
    { index: 6, alter: noop, emit: noop }
  ];

  unit.activeIndex = 3;
  unit.update();

  t.equal(unit.children[0].state, 'before');
  t.equal(unit.children[1].state, 'before');
  t.equal(unit.children[2].state, 'previous');
  t.equal(unit.children[3].state, 'current');
  t.equal(unit.children[4].state, 'next');
  t.equal(unit.children[5].state, 'after');
  t.equal(unit.children[6].state, 'after');

  unit.activeIndex = 0;
  unit.update();

  t.equal(unit.children[0].state, 'current');
  t.equal(unit.children[1].state, 'next');
  t.equal(unit.children[2].state, 'after');
  t.equal(unit.children[6].state, 'after');

  unit.activeIndex = 6;
  unit.update();

  t.equal(unit.children[4].state, 'before');
  t.equal(unit.children[5].state, 'previous');
  t.equal(unit.children[6].state, 'current');

  t.end();
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
  slides.on('change 0', function (unit, options) {
    t.ok(unit, 'unit state change triggered');
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
