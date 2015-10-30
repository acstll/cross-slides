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
  - 'update' (slide)
  - 'change' (slide, options)
*/

var BEFORE = "before";
var PREVIOUS = "previous";
var CURRENT = "current";
var NEXT = "next";
var AFTER = "after";
var OPEN = "open";

var defaults = {
  loop: false,
  0: {
    loop: false
  }
};

function getConfig(slide) {
  return slide.depth === 0 ? slide.config : slide.config[slide.depth] || {};
}

function findSlide(_x, _x2) {
  var _again = true;

  _function: while (_again) {
    _again = false;
    var slide = _x,
        depth = _x2;

    if (slide.depth === depth) {
      return slide;
    }

    _x = slide.activeChild;
    _x2 = depth;
    _again = true;
    continue _function;
  }
}

var noop = function noop() {};

// Change a slide's state based on new index and total
function changeState(slide, _ref) {
  var index = _ref.index;
  var total = _ref.total;

  var config = getConfig(slide);
  var previousState = slide.state;

  if (slide.index === index) {
    slide.state = CURRENT;
  }

  if (slide.index < index) {
    slide.state = slide.index === index - 1 ? PREVIOUS : BEFORE;
  }
  if (slide.index > index) {
    slide.state = slide.index === index + 1 ? NEXT : AFTER;
  }

  // Loop mode corrections.
  if (config.loop === true) {
    // If last item is 'current' and we're first.
    if (slide.index === 0 && index + 1 === total) {
      slide.state = NEXT;
    }
    // If first item is 'current' and we're last.
    if (slide.index + 1 === total && index === 0) {
      slide.state = PREVIOUS;
    }
  }

  return previousState;
}

// Move active index by n steps
function moveIndex(slide) {
  var steps = arguments[1] === undefined ? 1 : arguments[1];

  var config = getConfig(slide);
  var newIndex = slide.activeIndex + steps;

  if (!config.loop) {
    if (newIndex > slide.lastIndex || newIndex < 0) {
      return false;
    }
  } else {
    if (newIndex > slide.lastIndex) {
      newIndex = 0;
    }
    if (newIndex < 0) {
      newIndex = slide.lastIndex;
    }
  }

  slide.activeIndex = newIndex;

  return true;
}

function initialize(slide) {
  var depth = slide.depth + 1;
  var config = slide.config;

  slide.state = null;
  slide.children = [];
  slide.activeIndex = 0;

  slide.childrenToArray(slide.el, slide.depth).forEach(function (el, index) {
    var child = Object.create(Slide).init({ index: index, el: el, depth: depth, config: config });
    slide.children.push(child);
  });

  slide.lastIndex = slide.size ? slide.size - 1 : null;

  if (typeof slide.load === "function") {
    slide.load();
  }

  return slide;
}

var Slide = Object.defineProperties({
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
  var rootSlide = Object.create(Slide).init({ index: null, el: el, config: config });

  var emitter = new EventEmitter();
  var emit = emitter.emit.bind(emitter);

  if (typeof el !== "object" || isArray(el)) {
    throw new TypeError("The `el` param must be a DOM Node or a plain object.");
  }

  if (typeof alter !== "function") {
    throw new TypeError("An `alter` function as second parameter is mandatory.");
  }

  function update(slide, _x2, recurse) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    var index = slide.activeIndex;
    var total = slide.size;

    emit("update", slide);

    slide.children.forEach(function (child) {
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

    var slide = findSlide(rootSlide, depth);

    if (!moveIndex(slide, steps) || slide.size === 0) {
      return false;
    }

    update(slide, options, false);
    callback(slide);

    return true;
  }

  function moveTo(index, _x2, options) {
    var depth = arguments[1] === undefined ? 0 : arguments[1];
    var callback = arguments[3] === undefined ? noop : arguments[3];

    var slide = findSlide(rootSlide, depth);

    if (!slide || index >= slide.size) {
      return false;
    }

    slide.activeIndex = index;
    update(slide, options, false);
    callback(slide);

    return true;
  }

  function run(options) {
    var self = this;

    update(rootSlide, options);
    emit("run");

    return self;
  }

  function reset(el) {
    rootSlide.el = el;
    initialize(rootSlide);
    run();
    emit("reset");
  }

  function start() {
    var options = arguments[0] === undefined ? {} : arguments[0];

    var self = this;

    rootSlide.state = OPEN;
    emit("start", self);
    run();

    return self;
  }

  function stop() {
    var self = this;

    rootSlide.state = null;
    emit("stop", self);
  }

  return assign(emitter, {
    move: move,
    moveTo: moveTo,
    run: run,
    reset: reset,
    start: start,
    stop: stop,
    root: rootSlide,
    BEFORE: BEFORE,
    PREVIOUS: PREVIOUS,
    CURRENT: CURRENT,
    NEXT: NEXT,
    AFTER: AFTER,
    OPEN: OPEN
  });
};

createSlides.Slide = Slide;

module.exports = createSlides;

