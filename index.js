"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var extend = _interopRequire(require("xtend"));

var assign = _interopRequire(require("xtend/mutable"));

var EventEmitter = require("eventemitter3").EventEmitter;

/*
  Events:
  - 'start' (slides)
  - 'stop' (slides)
  - 'reset' (slides) [*not* on initial createSlides call]
  - 'update' (slides, options), (unit, options)
  - 'update `depth`' (unit, options)
  - 'change' (unit, previousState, options)
  - 'change `depth`' (unit, previousState, options)
  - 'initialize' (unit)
  - 'initialize `depth`' (unit)
*/

// States.
var BEFORE = "before";
var PREVIOUS = "previous";
var CURRENT = "current";
var NEXT = "next";
var AFTER = "after";

var OPEN = "open";
var CLOSED = "closed";

var noop = function noop() {};

var childrenToArray = function childrenToArray(_x, depth) {
  var el = arguments[0] === undefined ? {} : arguments[0];

  return [].slice.call(el.children || [], 0);
};

var defaults = {
  loop: false
};

// Sets the own state of `Unit` to
// 'before', 'previous', 'current', 'next' or 'after'.
var changeState = function changeState() {
  var _arguments$0 = arguments[0];
  var index = _arguments$0.index;
  var total = _arguments$0.total;
  var config = _arguments$0.config;
  var options = _arguments$0.options;

  var previousState = this.state;
  var event = "change " + this.depth;

  if (this.index === index) {
    this.state = CURRENT;
  }

  if (this.index < index) {
    this.state = this.index === index - 1 ? PREVIOUS : BEFORE;
  }
  if (this.index > index) {
    this.state = this.index === index + 1 ? NEXT : AFTER;
  }

  // Loop mode corrections.
  if (config.loop === true) {
    // If last item is 'current' and we're first.
    if (this.index === 0 && index + 1 === total) {
      this.state = NEXT;
    }
    // If first item is 'current' and we're last.
    if (this.index + 1 === total && index === 0) {
      this.state = PREVIOUS;
    }
  }

  if (previousState !== this.state) {
    this.alter("move", extend({ previousState: previousState }, options));

    this.emit("change", this, previousState, options);
    this.emit(event, this, previousState, options);
  }
};

// Calls `changeState` on children passing `activeIndex`.
var update = function update(options) {
  var index = this.activeIndex;
  var total = this.children.length;
  var config = this.config;
  var event = this.depth > -1 ? "update " + this.depth : "update";

  this.children.forEach(function (child) {
    changeState.call(child, { index: index, total: total, config: config, options: options });
  });

  this.emit("update", this, options);
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

  if (!this.config.loop) {
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

var Unit = {
  init: function init(index, el) {
    var depth = arguments[2] === undefined ? 0 : arguments[2];
    var config = arguments[3] === undefined ? {} : arguments[3];
    var emit = arguments[4] === undefined ? noop : arguments[4];

    this.index = index;
    this.state = "";
    this.depth = depth;
    this.emit = emit;

    this.children = []; // Item instances
    this.activeIndex = 0;
    this.lastIndex = null;

    this.config = config[this.depth] || {};
    this.__config = config;

    if (el !== null) {
      this.initialize(el);
    }

    return this;
  },

  initialize: function initialize(el) {
    var children = this.children = [];
    var emit = this.emit;
    var depth = this.depth + 1;
    var config = this.__config;
    this.el = el;

    this.childrenToArray(this.el, this.depth).forEach(function (element, index) {
      var unit = Object.create(Unit).init(index, element, depth, config, emit);
      children.push(unit);
    });

    if (this.children.length) {
      this.lastIndex = this.children.length - 1;
    }

    this.load(this.children);

    // Defer so listeners can be attached.
    setTimeout((function () {
      this.emit("initialize", this);
      this.emit("initialize " + this.depth, this);
    }).bind(this), 0);

    this.update();
  },

  update: update,

  childrenToArray: childrenToArray,

  load: noop
};

var Slides = {
  init: function init() {
    var el = arguments[0] === undefined ? null : arguments[0];
    var config = arguments[1] === undefined ? {} : arguments[1];

    this.state = CLOSED; // 'open' or 'closed'
    this.children = []; // Unit instances
    this.activeIndex = 0;
    this.lastIndex = null;

    assign(this, EventEmitter.prototype);

    this.config = extend(defaults, config || {});

    if (el !== null) {
      this.reset(el);
    }

    return this;
  },

  reset: function reset(el) {
    var children = this.children = [];
    var config = this.config;
    var emit = this.emit.bind(this);

    this.el = el;
    this.childrenToArray(this.el, this.depth).forEach(function (element, index) {
      var unit = Object.create(Unit).init(index, element, 0, config, emit);
      children.push(unit);
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
    this.state = OPEN;

    return this;
  },

  stop: function stop() {
    this.emit("stop", this);
    this.state = CLOSED;

    return this;
  },

  is: function is(state) {
    return this.state === state;
  },

  move: move,

  moveDeep: function moveDeep() {
    var steps = arguments[0] === undefined ? 1 : arguments[0];
    var depth = arguments[1] === undefined ? 1 : arguments[1];
    var options = arguments[2] === undefined ? {} : arguments[2];
    var callback = arguments[3] === undefined ? noop : arguments[3];

    // TODO: traverse into depth
    var activeUnit = this.children[this.activeIndex];
    return move.apply(activeUnit, [steps, options, callback]);
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

  Unit.alter = alter;
  return Object.create(Slides).init(el, options);
};

create.Slides = Slides;
create.Unit = Unit;
create.defaults = defaults;

module.exports = create;

