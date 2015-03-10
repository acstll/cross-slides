"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var extend = _interopRequire(require("xtend"));

var assign = _interopRequire(require("xtend/mutable"));

var EventEmitter = require("eventemitter3").EventEmitter;

/*
  Events:
  - 'start' (slides)
  - 'stop' (slides)
  - 'reset' (slides)
  - 'update' (slides, options)
  
  - 'reset group' (group)
  - 'update group' (group, options)
  - 'change group' (group, previousState, options)
  
  - 'change item' (item, previousState, options)
*/

var noop = function noop() {};

var childrenToArray = function childrenToArray(el) {
  if (!el) {
    return [];
  }

  return [].slice.call(el.children || [], 0);
};

var load = function load(children) {};

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
var changeState = function changeState() {
  var _arguments$0 = arguments[0];
  var index = _arguments$0.index;
  var total = _arguments$0.total;
  var _options = _arguments$0._options;
  var options = _arguments$0.options;

  var previousState = this.state;
  var event = "change " + this.type;

  if (this.index === index) {
    this.state = "current";
  }

  if (this.index < index) {
    this.state = this.index === index - 1 ? "previous" : "before";
  }
  if (this.index > index) {
    this.state = this.index === index + 1 ? "next" : "after";
  }

  // Loop mode corrections.
  if (_options.loop === true) {
    // If last item is 'current' and we're first.
    if (this.index === 0 && index + 1 === total) {
      this.state = "next";
    }
    // If first item is 'current' and we're last.
    if (this.index + 1 === total && index === 0) {
      this.state = "previous";
    }
  }

  if (previousState !== this.state) {
    this.alter("move", extend({ previousState: previousState }, options));
    this.emit(event, this, previousState, options);
  }
};

// Calls `changeState` on children passing `activeIndex`.
var update = function update(options) {
  var index = this.activeIndex;
  var total = this.children.length;
  var _options = this.options || {}; // internal
  var event = this.type ? "update " + this.type : "update";

  this.children.forEach(function (child) {
    changeState.call(child, { index: index, total: total, _options: _options, options: options });
  });

  this.emit(event, this, options);
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

var Item = {
  init: function init(index, el) {
    var emit = arguments[2] === undefined ? noop : arguments[2];

    this.index = index;
    this.el = el;
    this.state = "";
    this.emit = emit;
    this.type = "item";

    return this;
  }
};

var Group = {
  init: function init(index) {
    var el = arguments[1] === undefined ? null : arguments[1];
    var options = arguments[2] === undefined ? {} : arguments[2];
    var emit = arguments[3] === undefined ? noop : arguments[3];

    this.index = index;
    this.state = "";
    this.emit = emit;
    this.type = "group";

    this.children = []; // Item instances
    this.activeIndex = 0;
    this.lastIndex = null;

    this.options = options === false ? options : extend(defaults.group, options);

    if (el !== null) {
      this.reset(el);
    }

    return this;
  },

  reset: function reset(el) {
    var children = this.children = [];
    var emit = this.emit;
    this.el = el;

    if (this.options !== false) {
      this.childrenToArray(this.el).forEach(function (element, index) {
        var item = Object.create(Item).init(index, element, emit);
        children.push(item);
      });
      this.lastIndex = this.children.length - 1;

      this.load(this.children);
    }

    this.emit("reset group", this);
    this.update();
  },

  update: update,

  childrenToArray: childrenToArray,

  load: load
};

var Slides = {
  init: function init() {
    var el = arguments[0] === undefined ? null : arguments[0];
    var options = arguments[1] === undefined ? {} : arguments[1];

    this.state = "closed"; // 'open' or 'closed'
    this.children = []; // Group instances
    this.activeIndex = 0;
    this.lastIndex = null;

    assign(this, EventEmitter.prototype);

    this.options = extend(defaults.slides, options.slides || {});
    this._options = options;

    if (el !== null) {
      this.reset(el);
    }

    return this;
  },

  reset: function reset(el) {
    var children = this.children = [];
    var options = this._options.group;
    var emit = this.emit.bind(this);

    this.el = el;
    this.childrenToArray(this.el).forEach(function (element, index) {
      var group = Object.create(Group).init(index, element, options, emit);
      children.push(group);
    });
    this.activeIndex = 0;
    this.lastIndex = this.children.length - 1;

    this.emit("reset", this);

    return this;
  },

  start: function start(index) {
    if (index > -1 && index < this.children.length) {
      this.activeIndex = index;
    }

    this.update({});
    this.emit("start", this);
    this.state = "open";

    return this;
  },

  stop: function stop() {
    this.emit("stop", this);
    this.state = "closed";

    return this;
  },

  is: function is(state) {
    return this.state === state;
  },

  move: move,

  moveDeep: function moveDeep() {
    var activeGroup = this.children[this.activeIndex];
    return move.apply(activeGroup, arguments);
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

