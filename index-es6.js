
import extend from 'xtend';
import assign from 'xtend/mutable';
import { EventEmitter } from 'eventemitter3';

/*
  Events:
  - 'start' (slides)
  - 'stop' (slides)
  - 'reset' (slides)
  - 'update' (slides, options)
  
  - 'change' (unit, previousState, options)
  - 'change `depth`' (unit, previousState, options)
  - 'reset `depth`' (unit)
  - 'update `depth`' (unit, options)
*/

// States.
const BEFORE = 'before';
const PREVIOUS = 'previous';
const CURRENT = 'current';
const NEXT = 'next';
const AFTER = 'after';

const OPEN = 'open';
const CLOSED = 'closed';

const noop = function () {};


var childrenToArray = function childrenToArray (el={}, depth) {
  return [].slice.call(el.children || [], 0);
};

var defaults = {
  loop: false
};

// Sets the own state of `Unit` to
// 'before', 'previous', 'current', 'next' or 'after'.
const changeState = function changeState () {
  let { index, total, config, options } = arguments[0];
  let previousState = this.state;
  let event = `change ${this.depth}`;

  if (this.index === index) {
    this.state = CURRENT;
  }

  if (this.index < index) {
    this.state = (this.index === index - 1)
      ? PREVIOUS
      : BEFORE;
  }
  if (this.index > index) {
    this.state = (this.index === index + 1)
      ? NEXT
      : AFTER;
  }

  // Loop mode corrections.
  if (config.loop === true) {
    // If last item is 'current' and we're first.
    if (this.index === 0 && (index + 1 === total)) {
      this.state = NEXT;
    }
    // If first item is 'current' and we're last.
    if ((this.index + 1 === total) && index === 0) {
      this.state = PREVIOUS;
    }
  }

  if (previousState !== this.state) {
    this.alter('move', extend({ previousState }, options));
    this.emit('change', this, previousState, options);
    this.emit(event, this, previousState, options);
  }
};

// Calls `changeState` on children passing `activeIndex`.
const update = function update (options) {
  let index = this.activeIndex;
  let total = this.children.length;
  let config = this.config;
  let event = this.depth > -1 ? `update ${this.depth}` : 'update';

  this.children.forEach(function (child) {
    changeState.call(child, { index, total, config, options });
  });

  this.emit(event, this, options);
};

// Typical next/prev function:
// increases/decreases `activeIndex` and calls `update`.
const move = function move (steps=1, options={}, callback=noop) {
  if (arguments.length === 2 && typeof options === 'function') {
    callback = options;
    options = {};
  }

  let newIndex = this.activeIndex + steps;

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
  init (index, el, depth=0, config={}, emit=noop) {
    this.index = index;
    this.state = '';
    this.depth = depth;
    this.emit = emit;

    this.children = []; // Item instances
    this.activeIndex = 0;
    this.lastIndex = null;

    this.config = config[this.depth] || {};
    this.__config = config;

    if (el !== null) {
      this.reset(el);
    }

    return this;
  },

  reset (el) {
    let children = this.children = [];
    let emit = this.emit;
    let depth = this.depth + 1;
    let config = this.__config;
    this.el = el;

    this.childrenToArray(this.el, this.depth).forEach(function (element, index) {
      let unit = Object.create(Unit).init(index, element, depth, config, emit);
      children.push(unit);
    });

    if (this.children.length) {
      this.lastIndex = this.children.length - 1;
    }

    this.load(this.children);
    this.emit(`reset ${this.depth}`, this);
    this.update();
  },

  update,
  
  childrenToArray,
  
  load: noop
};

var Slides = {
  init (el=null, config={}) {
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

  reset (el) {
    let children = this.children = [];
    let config = this.config;
    let emit = this.emit.bind(this);

    this.el = el;
    this.childrenToArray(this.el, this.depth).forEach(function (element, index) {
      let unit = Object.create(Unit).init(index, element, 0, config, emit);
      children.push(unit);
    });
    this.activeIndex = 0;
    this.lastIndex = this.children.length - 1;

    this.emit('reset', this);

    return this;
  },

  start (index) {
    if (index > -1 && index < this.children.length) {
      this.activeIndex = index;
    }

    this.update({});
    this.emit('start', this);
    this.state = OPEN;

    return this;
  },

  stop () {
    this.emit('stop', this);
    this.state = CLOSED;

    return this;
  },

  is (state) {
    return this.state === state;
  },

  move,

  moveDeep (steps=1, depth=1, options={}) {
    // TODO: traverse into depth
    let activeUnit = this.children[this.activeIndex];
    return move.apply(activeUnit, [steps, options]);
  },

  update,

  childrenToArray
};



const create = function (el, options, alter) {
  if (arguments.length === 2 && typeof options === 'function') {
    alter = options;
    options = {};
  }

  if (typeof alter !== 'function') {
    throw new Error('An `alter` function as second or third parameter is mandatory.');
  }

  Unit.alter = alter;
  return Object.create(Slides).init(el, options);
};

create.Slides = Slides;
create.Unit = Unit;
create.defaults = defaults;

module.exports = create;
