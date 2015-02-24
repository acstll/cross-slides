
/*
  move(steps) sets `activeIndex` and calls
  update() which calls
  changeState(index) on each child, which calls
  alter() on itself

  "Hooks" (events):
    #onstart()  Slides
    #onstop()  Slides
    #oninitialize()  Slides, Group
    #onupdate()  Slides, Group
    #onstatechange() Slides, Group, Item
*/
var assign = require('xtend');

var noop = function () {};

var childrenToArray = function childrenToArray (el) {
  if (!el) {
    return [];
  }
  return [].slice.call(el.children || [], 0);
};

var load = function load (instance) {
  if (!instance.el) {
    return;
  }

  var img = instance.el.querySelector('img');
  img.src = img.getAttribute('data-src');
};

var defaults = {
  slides: {
    loop: false,
    childrenToArray: childrenToArray
  },
  group: {
    loop: false,
    childrenToArray: childrenToArray,
    load: load
  }
};

// Sets the own state of `Group` and `Item` to
// 'before', 'previous', 'current', 'next' or 'after'.
var changeState = function (index, options) {
  var self = this;
  var previousState = this.state;

  if (this.index === index) {
    this.state = 'current';
  }

  // TODO: mind options.loop to make first or last "previous" or "next",
  // which makes loop mode work properly.
  if (this.index < index) {
    this.state = (this.index === index - 1)
      ? 'previous'
      : 'before';
  }
  if (this.index > index) {
    this.state = (this.index === index + 1)
      ? 'next'
      : 'after';
  }

  if (previousState !== this.state) {
    this.alter('move', assign({ previousState: previousState }, options));

    if (typeof this.onstatechange === 'function') {
      this.onstatechange(previousState, this.state, options);
    }
  }
};

// Calls `changeState` on children passing `activeIndex`.
var update = function (options) {
  var index = this.activeIndex;

  this.children.forEach(function (child) {
    changeState.call(child, index, options);
  });

  if (typeof this.onupdate === 'function') {
    this.onupdate(options);
  }
};

// Typical next/prev function:
// increases/decreases `activeIndex` and calls `update`.
var move = function (steps, options, callback) {
  steps = steps || 1;
  callback = callback || noop;

  if (arguments.length === 2 && typeof options === 'function') {
    callback = options;
    options = {};
  }

  var newIndex = this.activeIndex + steps;

  if (!this.options.loop) {
    if (newIndex > this.lastIndex || newIndex < 0) {
      return false;
    }
  } else {
    if (newIndex > this.lastIndex) {
      newIndex = 0;
    }
    if (newIndex < 0) {
      newIndex = this.lastIndex;
    }
  }

  this.activeIndex = newIndex;
  this.update(options);
  callback(this.children, this.activeIndex);

  return true;
};

var isGroup = function () {
  return this instanceof Group;
};

var isItem = function () {
  return this instanceof Item;
};



function Slides (el, options, alter) {
  this.state = 'closed'; // 'open' or 'closed'
  this.children = []; // Group instances
  this.activeIndex = 0;
  this.lastIndex = null;

  if (arguments.length === 2) {
    alter = options;
    options = {};
  }

  if (typeof alter !== 'function') {
    throw new Error('An `alter` function is mandatory.');
  }

  this.options = assign(defaults.slides, options.slides || {});
  this.alter = alter;

  this._options = options || {};

  if (el !== null) {
    this.initialize(el);
  }
}

Slides.prototype = {
  initialize: function (el) {
    var children = this.children = [];
    var self = this;

    this.el = el;
    this.options
      .childrenToArray.apply(this, [this.el])
      .forEach(function (element, index) {
        children.push(new Group(index, element, self._options.group, self.alter));
      });
    this.activeIndex = 0;
    this.lastIndex = this.children.length - 1;

    return this;
  },


  start: function (index) {
    if (index > -1 && index < this.children.length) {
      this.activeIndex = index;
    }

    this.update({});

    if (typeof this.onstart === 'function') {
      this.onstart();
    }

    this.state = 'open';

    return this;
  },

  stop: function () {
    if (typeof this.onstop === 'function') {
      this.onstop();
    }

    this.state = 'closed';

    return this;
  },

  is: function (state) {
    return this.state === state;
  },

  move: move,

  moveDeep: function () {
    var item = this.children[this.activeIndex];
    return move.apply(item, arguments);
  },

  update: update
};



function Group (index, el, options, alter) {
  options = options || {};

  this.index = index;
  this.state = '';

  this.children = []; // Item instances
  this.activeIndex = 0;
  this.lastIndex = null;
  this.isLoaded = false;

  this.options = assign(defaults.group, options);
  this.alter = alter;

  if (el !== null) {
    this.initialize(el);
  }
}

Group.prototype = {
  initialize: function (el) {
    var children = this.children = [];
    var self = this;

    this.el = el;

    if (this.options) {
      this.options.childrenToArray.apply(this, [this.el]).forEach(function (element, index) {
        children.push(new Item(index, element, self.alter));
      });
      this.lastIndex = this.children.length - 1;

      // TODO: do this at the right time!
      // only for 'previous', 'next' and 'current' states.
      this.load();
    }

    if (typeof this.oninitialize === 'function') {
      this.oninitialize();
    }

    this.update();
  },

  load: function () {
    this.children.forEach(this.options.load);
    this.isLoaded = true;
  },

  update: update,

  isGroup: isGroup,
  isItem: isItem
};



function Item (index, el, alter) {
  this.index = index;
  this.el = el;
  this.state = '';
  this.alter = alter;
}

Item.prototype = {
  isGroup: isGroup,
  isItem: isItem
};



Slides.Group = Group;
Slides.Item = Item;
Slides.defaults = defaults;

module.exports = Slides;
