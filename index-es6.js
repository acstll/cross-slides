
import extend from 'xtend';
import assign from 'xtend/mutable';
import { EventEmitter } from 'eventemitter3';

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

const noop = function () {};

var childrenToArray = function childrenToArray (el) {
  if (!el) {
    return [];
  }

  return [].slice.call(el.children || [], 0);
};

var load = function load (children) {};

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
const changeState = function changeState () {
  let { index, total, _options, options } = arguments[0];
  let previousState = this.state;
  let event = `change ${this.type}`;

  if (this.index === index) {
    this.state = 'current';
  }

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

  // Loop mode corrections.
  if (_options.loop === true) {
    // If last item is 'current' and we're first.
    if (this.index === 0 && (index + 1 === total)) {
      this.state = 'next';
    }
    // If first item is 'current' and we're last.
    if ((this.index + 1 === total) && index === 0) {
      this.state = 'previous';
    }
  }

  if (previousState !== this.state) {
    this.alter('move', extend({ previousState: previousState }, options));
    this.emit(event, this, previousState, options);
  }
};

// Calls `changeState` on children passing `activeIndex`.
const update = function update (options) {
  let index = this.activeIndex;
  let total = this.children.length;
  let _options = this.options || {}; // internal
  let event = this.type ? `update ${this.type}` : 'update';

  this.children.forEach(function (child) {
    changeState.call(child, { index, total, _options, options });
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
  init (index, el, emit=noop) {
    this.index = index;
    this.el = el;
    this.state = '';
    this.emit = emit;
    this.type = 'item';

    return this;
  }
};

var Group = {
  init (index, el=null, options={}, emit=noop) {
    this.index = index;
    this.state = '';
    this.emit = emit;
    this.type = 'group';

    this.children = []; // Item instances
    this.activeIndex = 0;
    this.lastIndex = null;

    this.options = options === false
      ? options
      : extend(defaults.group, options);

    if (el !== null) {
      this.reset(el);
    }

    return this;
  },

  reset (el) {
    let children = this.children = [];
    let emit = this.emit;
    this.el = el;

    if (this.options !== false) {
      this.childrenToArray(this.el).forEach(function (element, index) {
        let item = Object.create(Item).init(index, element, emit);
        children.push(item);
      });
      this.lastIndex = this.children.length - 1;

      this.load(this.children);
    }

    this.emit('reset group', this);
    this.update();
  },

  update,
  
  childrenToArray,
  
  load
};

var Slides = {
  init (el=null, options={}) {
    this.state = 'closed'; // 'open' or 'closed'
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

  reset (el) {
    let children = this.children = [];
    let options = this._options.group;
    let emit = this.emit.bind(this);

    this.el = el;
    this.childrenToArray(this.el).forEach(function (element, index) {
      let group = Object.create(Group).init(index, element, options, emit);
      children.push(group);
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
    this.state = 'open';

    return this;
  },

  stop () {
    this.emit('stop', this);
    this.state = 'closed';

    return this;
  },

  is (state) {
    return this.state === state;
  },

  move,

  moveDeep () {
    let activeGroup = this.children[this.activeIndex];
    return move.apply(activeGroup, arguments);
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

  Group.alter = Item.alter = alter;
  return Object.create(Slides).init(el, options);
};

create.Slides = Slides;
create.Group = Group;
create.Item = Item;
create.defaults = defaults;

module.exports = create;
