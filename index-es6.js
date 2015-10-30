
import extend from 'xtend'
import assign from 'xtend/mutable'
import EventEmitter from 'eventemitter3'
import isArray from 'isarray'

/*
  Events:
  - 'start' (slides)
  - 'stop' (slides)
  - 'reset'
  - 'run'
  - 'update' (slide)
  - 'change' (slide, options)
*/

const BEFORE = 'before'
const PREVIOUS = 'previous'
const CURRENT = 'current'
const NEXT = 'next'
const AFTER = 'after'
const OPEN = 'open'

let defaults = {
  loop: false,
  0: {
    loop: false
  }
}

function getConfig (slide) {
  return slide.depth === 0 ? slide.config : (slide.config[slide.depth] || {})
}

function findSlide (slide, depth) {
  if (slide.depth === depth) {
    return slide
  }

  return findSlide(slide.activeChild, depth)
}

const noop = function () {}

// Change a slide's state based on new index and total
function changeState (slide, { index, total }) {
  const config = getConfig(slide)
  const previousState = slide.state

  if (slide.index === index) {
    slide.state = CURRENT
  }

  if (slide.index < index) {
    slide.state = (slide.index === index - 1)
      ? PREVIOUS
      : BEFORE
  }
  if (slide.index > index) {
    slide.state = (slide.index === index + 1)
      ? NEXT
      : AFTER
  }

  // Loop mode corrections.
  if (config.loop === true) {
    // If last item is 'current' and we're first.
    if (slide.index === 0 && (index + 1 === total)) {
      slide.state = NEXT
    }
    // If first item is 'current' and we're last.
    if ((slide.index + 1 === total) && index === 0) {
      slide.state = PREVIOUS
    }
  }

  return previousState
}

// Move active index by n steps
function moveIndex (slide, steps=1) {
  const config = getConfig(slide)
  let newIndex = slide.activeIndex + steps

  if (!config.loop) {
    if (newIndex > slide.lastIndex || newIndex < 0) {
      return false
    }
  } else {
    if (newIndex > slide.lastIndex) {
      newIndex = 0
    }
    if (newIndex < 0) {
      newIndex = slide.lastIndex
    }
  }

  slide.activeIndex = newIndex

  return true
}

function initialize (slide) {
  const depth = slide.depth + 1
  const { config } = slide

  slide.state = null
  slide.children = []
  slide.activeIndex = 0

  slide.childrenToArray(slide.el, slide.depth).forEach(function (el, index) {
    let child = Object.create(Slide).init({ index, el, depth, config })
    slide.children.push(child)
  })

  slide.lastIndex = slide.size ? slide.size - 1 : null

  if (typeof slide.load === 'function') {
    slide.load()
  }

  return slide
}

const Slide = {
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
  const rootSlide = Object.create(Slide).init({ index: null, el, config })

  const emitter = new EventEmitter()
  const emit = emitter.emit.bind(emitter)

  if (typeof el !== 'object' || isArray(el)) {
    throw new TypeError('The `el` param must be a DOM Node or a plain object.')
  }

  if (typeof alter !== 'function') {
    throw new TypeError('An `alter` function as second parameter is mandatory.')
  }

  function update (slide, options={}, recurse) {
    const index = slide.activeIndex
    const total = slide.size

    emit('update', slide)

    slide.children.forEach(function (child) {
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
    const slide = findSlide(rootSlide, depth)

    if (!moveIndex(slide, steps) || slide.size === 0) {
      return false
    }

    update(slide, options, false)
    callback(slide)

    return true
  }

  function moveTo (index, depth=0, options, callback=noop) {
    const slide = findSlide(rootSlide, depth)

    if (!slide || index >= slide.size) {
      return false
    }

    slide.activeIndex = index
    update(slide, options, false)
    callback(slide)

    return true
  }

  function run (options) {
    const self = this

    update(rootSlide, options)
    emit('run')

    return self
  }

  function reset (el) {
    rootSlide.el = el
    initialize(rootSlide)
    run()
    emit('reset')
  }

  function start (options={}) {
    const self = this

    rootSlide.state = OPEN
    emit('start', self)
    run()

    return self
  }

  function stop () {
    const self = this

    rootSlide.state = null
    emit('stop', self)
  }

  return assign(emitter, {
    move,
    moveTo,
    run,
    reset,
    start,
    stop,
    root: rootSlide,
    BEFORE,
    PREVIOUS,
    CURRENT,
    NEXT,
    AFTER,
    OPEN
  })
}

createSlides.Slide = Slide

module.exports = createSlides
