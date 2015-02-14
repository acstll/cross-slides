var test = require('tape');

var Slides = require('../');
var Group = Slides.Group;
var Item = Slides.Item;
var noop = function () {};

test('isGroup() and isItem()', function (t) {
  var item = new Item(0);
  var group = new Group(0);

  t.ok(item.isItem(), 'item is Item instance');
  t.notOk(group.isItem(), 'group is not Item instance');

  t.ok(group.isGroup(), 'group is Group instance');
  t.notOk(item.isGroup(), 'item is not Group instance');

  t.end();
});

test('`state` gets set correctly by changeState()', function (t) {
  var group = new Group();
  var counter = 0;

  function callback(previousState) {
    counter++;
  }

  group.children = [
    { index: 0, _move: noop, onstatechange: noop },
    { index: 1, _move: noop, onstatechange: noop },
    { index: 2, _move: noop, onstatechange: noop },
    { index: 3, _move: noop, onstatechange: noop },
    { index: 4, _move: noop, onstatechange: noop },
    { index: 5, _move: noop, onstatechange: noop },
    { index: 6, _move: noop, onstatechange: callback }  
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
