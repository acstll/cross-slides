
import extend from 'xtend'
import assign from 'xtend/mutable'
import EventEmitter from 'eventemitter3'

/*
  Events:
  - 'start' (slides)
  - 'stop' (slides)
  - 'reset'
  - 'run'
  - 'update' (unit)
  - 'change' (unit, options)
*/

const BEFORE = 'before'
const PREVIOUS = 'previous'
const CURRENT = 'current'
const NEXT = 'next'
const AFTER = 'after'

let defaults = {
  loop: false,
  0: {
    loop: false
  }
}

function getConfig (unit) {
  return unit.depth === 0 ? unit.config : (unit.config[unit.depth] || {})
}

function findUnit (unit, depth) {
  if (unit.depth === depth) {
    return unit
  }

  return findUnit(unit.activeChild, depth)
}

const noop = function () {}

// Change a unit's state based on new index and total
function changeState (unit, { index, total }) {
  const config = getConfig(unit)
  const previousState = unit.state

  if (unit.index === index) {
    unit.state = CURRENT
  }

  if (unit.index < index) {
    unit.state = (unit.index === index - 1)
      ? PREVIOUS
      : BEFORE
  }
  if (unit.index > index) {
    unit.state = (unit.index === index + 1)
      ? NEXT
      : AFTER
  }

  // Loop mode corrections.
  if (config.loop === true) {
    // If last item is 'current' and we're first.
    if (unit.index === 0 && (index + 1 === total)) {
      unit.state = NEXT
    }
    // If first item is 'current' and we're last.
    if ((unit.index + 1 === total) && index === 0) {
      unit.state = PREVIOUS
    }
  }

  return previousState
}

// Move active index by n steps
function moveIndex (unit, steps=1) {
  const config = getConfig(unit)
  let newIndex = unit.activeIndex + steps

  if (!config.loop) {
    if (newIndex > unit.lastIndex || newIndex < 0) {
      return false
    }
  } else {
    if (newIndex > unit.lastIndex) {
      newIndex = 0
    }
    if (newIndex < 0) {
      newIndex = unit.lastIndex
    }
  }

  unit.activeIndex = newIndex

  return true
}

function initialize (unit) {
  const depth = unit.depth + 1
  const { config } = unit

  unit.state = null
  unit.children = []
  unit.activeIndex = 0

  unit.childrenToArray(unit.el, unit.depth).forEach(function (el, index) {
    let child = Object.create(Unit).init({ index, el, depth, config })
    unit.children.push(child)
  })

  unit.lastIndex = unit.size ? unit.size - 1 : null

  if (typeof unit.load === 'function') {
    unit.load()
  }

  return unit
}

const Unit = {
  init ({ index, el, depth=0, config }) {
    const self = this

    self.index = index
    self.el = el
    self.depth = depth
    self.config = config

    return initialize(self)
  },

  get activeChild () {
    const self = this
    return self.children[self.activeIndex]
  },

  get size () {
    const self = this
    return self.children.length
  },

  childrenToArray (el={}, depth) {
    return [].slice.call(el.children || [], 0)
  },

  load: noop
}

const createSlides = function (el, alter, config={}) {
  config = extend(defaults, config)
  const rootUnit = Object.create(Unit).init({ index: null, el, config })

  const emitter = new EventEmitter()
  const emit = emitter.emit.bind(emitter)

  if (typeof alter !== 'function') {
    throw new TypeError('An `alter` function as second parameter is mandatory.')
  }

  function update (unit, options={}, recurse) {
    const index = unit.activeIndex
    const total = unit.size

    emit('update', unit)

    unit.children.forEach(function (child) {
      let previousState = changeState(child, { index, total })
      let opts = extend({ previousState, type: 'move' }, options)

      if (previousState !== child.state) {
        alter(child, opts)
        emit('change', child, opts)
      }

      if (recurse !== false) {
        update(child, options)
      }
    })
  }

  function move (steps=1, depth=0, options, callback=noop) {
    const unit = findUnit(rootUnit, depth)

    if (!moveIndex(unit, steps) || unit.size === 0) {
      return false
    }

    update(unit, options, false)
    callback(unit)

    return true
  }

  function run (options) {
    const self = this

    update(rootUnit, options)
    emit('run')

    return self
  }

  function reset (el) {
    rootUnit.el = el
    initialize(rootUnit)
    run()
    emit('reset')
  }

  function start (options={}) {
    const self = this

    rootUnit.state = 'open'
    emit('start', self)
    run()

    return self
  }

  function stop () {
    const self = this

    rootUnit.state = 'closed'
    emit('stop', self)
  }

  return assign(emitter, {
    move,
    run,
    reset,
    start,
    stop,
    is: state => rootUnit.state === state,
    root: rootUnit
  })
}

createSlides.Unit = Unit

module.exports = createSlides
