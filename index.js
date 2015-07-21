"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var extend = _interopRequire(require("xtend"));

var assign = _interopRequire(require("xtend/mutable"));

var EventEmitter = _interopRequire(require("eventemitter3"));

var isArray = _interopRequire(require("isarray"));

/*
  Events:
  - 'start' (slides)
  - 'stop' (slides)
  - 'reset'
  - 'run'
  - 'update' (unit)
  - 'change' (unit, options)
*/

var BEFORE = "before";
var PREVIOUS = "previous";
var CURRENT = "current";
var NEXT = "next";
var AFTER = "after";

var defaults = {
  loop: false,
  0: {
    loop: false
  }
};

function getConfig(unit) {
  return unit.depth === 0 ? unit.config : unit.config[unit.depth] || {};
}

function findUnit(_x, _x2) {
  var _again = true;

  _function: while (_again) {
    _again = false;
    var unit = _x,
        depth = _x2;

    if (unit.depth === depth) {
      return unit;
    }

    _x = unit.activeChild;
    _x2 = depth;
    _again = true;
    continue _function;
  }
}

var noop = function noop() {};

// Change a unit's state based on new index and total
function changeState(unit, _ref) {
  var index = _ref.index;
  var total = _ref.total;

  var config = getConfig(unit);
  var previousState = unit.state;

  if (unit.index === index) {
    unit.state = CURRENT;
  }

  if (unit.index < index) {
    unit.state = unit.index === index - 1 ? PREVIOUS : BEFORE;
  }
  if (unit.index > index) {
    unit.state = unit.index === index + 1 ? NEXT : AFTER;
  }

  // Loop mode corrections.
  if (config.loop === true) {
    // If last item is 'current' and we're first.
    if (unit.index === 0 && index + 1 === total) {
      unit.state = NEXT;
    }
    // If first item is 'current' and we're last.
    if (unit.index + 1 === total && index === 0) {
      unit.state = PREVIOUS;
    }
  }

  return previousState;
}

// Move active index by n steps
function moveIndex(unit) {
  var steps = arguments[1] === undefined ? 1 : arguments[1];

  var config = getConfig(unit);
  var newIndex = unit.activeIndex + steps;

  if (!config.loop) {
    if (newIndex > unit.lastIndex || newIndex < 0) {
      return false;
    }
  } else {
    if (newIndex > unit.lastIndex) {
      newIndex = 0;
    }
    if (newIndex < 0) {
      newIndex = unit.lastIndex;
    }
  }

  unit.activeIndex = newIndex;

  return true;
}

function initialize(unit) {
  var depth = unit.depth + 1;
  var config = unit.config;

  unit.state = null;
  unit.children = [];
  unit.activeIndex = 0;

  unit.childrenToArray(unit.el, unit.depth).forEach(function (el, index) {
    var child = Object.create(Unit).init({ index: index, el: el, depth: depth, config: config });
    unit.children.push(child);
  });

  unit.lastIndex = unit.size ? unit.size - 1 : null;

  if (typeof unit.load === "function") {
    unit.load();
  }

  return unit;
}

var Unit = Object.defineProperties({
  init: function init(_ref) {
    var index = _ref.index;
    var el = _ref.el;
    var _ref$depth = _ref.depth;
    var depth = _ref$depth === undefined ? 0 : _ref$depth;
    var config = _ref.config;

    var self = this;

    self.index = index;
    self.el = el;
    self.depth = depth;
    self.config = config;

    return initialize(self);
  },

  childrenToArray: function childrenToArray(_x, depth) {
    var el = arguments[0] === undefined ? {} : arguments[0];

    return [].slice.call(el.children || [], 0);
  },

  load: noop
}, {
  activeChild: {
    get: function () {
      var self = this;
      return self.children[self.activeIndex];
    },
    configurable: true,
    enumerable: true
  },
  size: {
    get: function () {
      var self = this;
      return self.children.length;
    },
    configurable: true,
    enumerable: true
  }
});

var createSlides = function createSlides(el, alter) {
  var config = arguments[2] === undefined ? {} : arguments[2];

  config = extend(defaults, config);
  var rootUnit = Object.create(Unit).init({ index: null, el: el, config: config });

  var emitter = new EventEmitter();
  var emit = emitter.emit.bind(emitter);

  if (typeof el !== "object" || isArray(el)) {
    throw new TypeError("The `el` param must be a DOM Node or a plain object.");
  }

  if (typeof alter !== "function") {
    throw new TypeError("An `alter` function as second parameter is mandatory.");
  }

  function update(unit, _x2, recurse) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    var index = unit.activeIndex;
    var total = unit.size;

    emit("update", unit);

    unit.children.forEach(function (child) {
      var previousState = changeState(child, { index: index, total: total });
      var opts = extend({ previousState: previousState, type: "move" }, options);

      if (previousState !== child.state) {
        alter(child, opts);
        emit("change", child, opts);
      }

      if (recurse !== false) {
        update(child, options);
      }
    });
  }

  function move(_x2, _x3, options) {
    var steps = arguments[0] === undefined ? 1 : arguments[0];
    var depth = arguments[1] === undefined ? 0 : arguments[1];
    var callback = arguments[3] === undefined ? noop : arguments[3];

    var unit = findUnit(rootUnit, depth);

    if (!moveIndex(unit, steps) || unit.size === 0) {
      return false;
    }

    update(unit, options, false);
    callback(unit);

    return true;
  }

  function run(options) {
    var self = this;

    update(rootUnit, options);
    emit("run");

    return self;
  }

  function reset(el) {
    rootUnit.el = el;
    initialize(rootUnit);
    run();
    emit("reset");
  }

  function start() {
    var options = arguments[0] === undefined ? {} : arguments[0];

    var self = this;

    rootUnit.state = "open";
    emit("start", self);
    run();

    return self;
  }

  function stop() {
    var self = this;

    rootUnit.state = "closed";
    emit("stop", self);
  }

  return assign(emitter, {
    move: move,
    run: run,
    reset: reset,
    start: start,
    stop: stop,
    is: function (state) {
      return rootUnit.state === state;
    },
    root: rootUnit
  });
};

createSlides.Unit = Unit;

module.exports = createSlides;

