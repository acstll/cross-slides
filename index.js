"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var assign = _interopRequire(require("xtend"));

var noop = function noop() {};

var childrenToArray = function childrenToArray(el) {
  if (!el) {
    return [];
  }

  return [].slice.call(el.children || [], 0);
};

var load = function load(children) {
  children.forEach(function (child) {
    if (!child.el) {
      return;
    }

    var img = child.el.querySelector("img");
    img.src = img.getAttribute("data-src");
  });
};

var defaults = {
  slides: {
    loop: false
  },
  group: {
    loop: false
  }
};

// Sets the own state of `Group` and `Item` to
// 'before', 'previous', 'current', 'next' or 'after'.
var changeState = function changeState(index, options) {
  var previousState = this.state;

  if (this.index === index) {
    this.state = "current";
  }

  // TODO: mind options.loop to make first or last "previous" or "next",
  // which makes loop mode work properly.
  if (this.index < index) {
    this.state = this.index === index - 1 ? "previous" : "before";
  }
  if (this.index > index) {
    this.state = this.index === index + 1 ? "next" : "after";
  }

  if (previousState !== this.state) {
    this.alter("move", assign({ previousState: previousState }, options));

    if (typeof this.onstatechange === "function") {
      this.onstatechange(previousState, this.state, options);
    }
  }
};

// Calls `changeState` on children passing `activeIndex`.
var update = function update(options) {
  var index = this.activeIndex;

  this.children.forEach(function (child) {
    changeState.call(child, index, options);
  });

  if (typeof this.onupdate === "function") {
    this.onupdate(options);
  }
};

// Typical next/prev function:
// increases/decreases `activeIndex` and calls `update`.
var move = function move() {
  var steps = arguments[0] === undefined ? 1 : arguments[0];
  var options = arguments[1] === undefined ? {} : arguments[1];
  var callback = arguments[2] === undefined ? noop : arguments[2];

  if (arguments.length === 2 && typeof options === "function") {
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

var isGroup = function isGroup() {
  return Group.isPrototypeOf(this);
};

var isItem = function isItem() {
  return Item.isPrototypeOf(this);
};

var Item = {
  init: function init(index, el) {
    this.index = index;
    this.el = el;
    this.state = "";

    return this;
  },

  isGroup: isGroup,

  isItem: isItem
};

var Group = {
  init: function init(index) {
    var el = arguments[1] === undefined ? null : arguments[1];
    var options = arguments[2] === undefined ? {} : arguments[2];

    this.index = index;
    this.state = "";

    this.children = []; // Item instances
    this.activeIndex = 0;
    this.lastIndex = null;

    this.options = options === false ? options : assign(defaults.group, options);

    if (el !== null) {
      this.initialize(el);
    }

    return this;
  },

  reset: function reset(el) {
    var children = this.children = [];
    this.el = el;

    if (this.options !== false) {
      this.childrenToArray(this.el).forEach(function (element, index) {
        var item = Object.create(Item).init(index, element);
        children.push(item);
      });
      this.lastIndex = this.children.length - 1;

      // TODO: do this at the right time!
      // only for 'previous', 'next' and 'current' states.
      this.load(this.children);
    }

    if (typeof this.oninitialize === "function") {
      this.oninitialize();
    }

    this.update();
  },

  update: update,

  childrenToArray: childrenToArray,

  load: load,

  isGroup: isGroup,

  isItem: isItem
};

var Slides = {
  init: function init() {
    var el = arguments[0] === undefined ? null : arguments[0];
    var options = arguments[1] === undefined ? {} : arguments[1];

    this.state = "closed"; // 'open' or 'closed'
    this.children = []; // Group instances
    this.activeIndex = 0;
    this.lastIndex = null;

    this.options = assign(defaults.slides, options.slides || {});
    this._options = options;

    if (el !== null) {
      this.initialize(el);
    }

    return this;
  },

  reset: function reset(el) {
    var children = this.children = [];
    var options = this._options.group;

    this.el = el;
    this.childrenToArray(this.el).forEach(function (element, index) {
      var group = Object.create(Group).init(index, element, options);
      children.push(group);
    });
    this.activeIndex = 0;
    this.lastIndex = this.children.length - 1;

    return this;
  },

  start: function start(index) {
    if (index > -1 && index < this.children.length) {
      this.activeIndex = index;
    }

    this.update({});

    if (typeof this.onstart === "function") {
      this.onstart();
    }

    this.state = "open";

    return this;
  },

  stop: function stop() {
    if (typeof this.onstop === "function") {
      this.onstop();
    }

    this.state = "closed";

    return this;
  },

  is: function is(state) {
    return this.state === state;
  },

  move: move,

  moveDeep: function moveDeep() {
    var group = this.children[this.activeIndex];
    return move.apply(group, arguments);
  },

  update: update,

  childrenToArray: childrenToArray
};

var create = function create(el, options, alter) {
  if (arguments.length === 2 && typeof options === "function") {
    alter = options;
    options = {};
  }

  if (typeof alter !== "function") {
    throw new Error("An `alter` function as second or third parameter is mandatory.");
  }

  Group.alter = Item.alter = alter;
  return Object.create(Slides).init(el, options);
};

create.Slides = Slides;
create.Group = Group;
create.Item = Item;
create.defaults = defaults;

module.exports = create;

