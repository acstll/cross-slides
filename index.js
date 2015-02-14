
/*
  Group#_move() and Item#_move() SHOULD be set.

  move(steps) sets `activeIndex` and calls
  update() which calls 
  changeState(index) on each child, which calls
  _move() on itself


  "Hooks" (events):
    #onstart()  Slides
    #onstop()  Slides
    #oninitialize()  Slides, Group
    #onupdate()  Slides, Group
*/

var noop = function () {};

// Sets the own state of `Group` and `Item` to
// 'before', 'previous', 'current', 'next' or 'after'.
var changeState = function (index, animate) {
  var self = this;
  var previousState = this.state;

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

  if (previousState !== this.state) {
    this._move(animate);

    if (typeof this.onstatechange === 'function') {
      this.onstatechange(previousState, this.state);
    }
  }
};

// Calls `changeState` on children passing `activeIndex`.
var update = function (animate) {
  var index = this.activeIndex;

  this.children.forEach(function (child) {
    changeState.call(child, index, animate);
  });

  if (typeof this.onupdate === 'function') {
    this.onupdate();
  }
};

// Typical next/prev function: 
// increases/decreases `activeIndex` and calls `update`.
var move = function (steps, callback) {
  steps = steps || 1;

  var newIndex = this.activeIndex + steps;

  // *Note* An option for choosing "loop" mode would be nice.
  if (newIndex > this.lastIndex || newIndex < 0) {
    return false;
  }

  this.activeIndex = newIndex;
  this.update(true);

  if (typeof callback === 'function') {
    callback(this.children, this.activeIndex);
  }
  
  return true;
};



function Slides ($el) {
  this.state = 'closed'; // 'open' or 'closed'
  this.children = []; // Group instances
  this.activeIndex = 0;
  this.lastIndex = null;

  if ($el) {
    this.initialize($el);
  }
}

Slides.prototype = {
  initialize: function ($el, id) {
    var children = this.children = [];
    this.$el = $el;

    this.$el.children().each(function (index) {
      var $this = $(this);
      children.push(new Group(index, $this));
    });

    this.activeIndex = 0;
    this.lastIndex = this.children.length - 1;

    if (id) {
      this.setActiveIndexById(id);
    }

    return this;
  },


  start: function (index) {
    if (index > -1 && index < this.children.length) {
      this.activeIndex = index;
    }

    this.children.forEach(function (group) {
      group.activeIndex = 0;
    });

    this.update();

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

  move: move,

  moveDeep: function (steps, callback) {
    var item = this.children[this.activeIndex];
    return move.apply(item, arguments);
  },

  shift: function (step) {},

  shiftDeep: function (step) {},

  update: update,

  is: function (state) {
    return this.state === state;
  },

  setActiveIndexById: function (id) {
    if (!id) return;
    var self = this;

    this.children.some(function (group) {
      if (group.id === id) {
        self.activeIndex = group.index;
        return true;
      }
    });
  }
};



function Group (index, $el) {
  this.index = index;
  this.state = '';

  this.children = []; // Item instances
  this.activeIndex = 0;
  this.lastIndex = null;
  this.isLoaded = false;

  if ($el) {
    this.initialize($el);
  }
}

Group.prototype = {
  initialize: function ($el) {
    var children = this.children;
    this.$el = $el;
    
    this.$el.children().each(function (index) {
      var slide = new Item(index, $(this));
      children.push(slide);
    });

    this.id = this.$el.attr('id');
    this.lastIndex = this.children.length - 1;

    this.load(); // TODO: do this at the right time!

    if (typeof this.oninitialize === 'function') {
      this.oninitialize();
    }

    this.update();
  },

  load: function () {
    var self = this;

    this.children.forEach(function (item, index) {
      var $el = item.$el.find('img');

      if (!$el.length) {
        return;
      }

      $el.attr('src', $el.attr('data-src'));
    });

    this.isLoaded = true;
  },

  update: update,

  _move: noop
};



function Item (index, $el) {
  this.index = index;
  this.$el = $el;
  this.state = '';
}

Item.prototype = {
  _move: noop
};



Slides.Group = Group;
Slides.Item = Item;

module.exports = Slides;
