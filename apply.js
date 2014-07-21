var vm = require("vm")
  , through = require("through2")

module.exports = function (root) {
  root = root || {}

  var gStr = ""

  return through(function (chunk, enc, cb) {
    gStr += chunk.toString()
    cb()
  }, function (cb) {
    //console.log(gStr)
    var g = vm.runInNewContext(gStr)(this)
    gStr = null

    function getNext (next, generator) {
      if (next.done) return cb()

      // TODO: Split on regex
      var path = next.value.key.replace(/\.\./g, "--").split(/[./]/).map(function (p) {
        return p.replace(/--/g, "..")
      })

      valueForPath(path, root, next, function (er, val) {
        if (er) return cb(er)

        // No data
        if (!val) {
          return getNext(generator.next(""), generator)
        }

        // Async operation
        if (typeof val == "function") {
          return val(next.value, function (er, result) {
            if (er) return cb(er)
            getNext(generator.next(result), generator)
          })
        }

        // Literal value
        getNext(generator.next(val), generator)
      })
    }

    getNext(g.next(), g)
  })
}

function valueForPath (path, root, next, cb) {
  if (!root) return cb()

  var val = next.value.context ? next.value.context[path[0]] : root[path[0]]

  if (path.length == 1) {
    if (path[0] == "this") {
      val = next.value.context
    }

    if (!val) return cb(null, "")

    if (typeof val == "function") {
      return val(next.value, function (er, data) {
        if (er) return cb(er)
        cb(null, data)
      })
    }

    return cb(null, val)
  }

  if (!val) return cb(null, "")

  // Turtles all the way down
  if (typeof val == "function") {
    return val(next.value, function (er, data) {
      if (er) return cb(er)
      valueForPath(path.slice(1), root, {value: {context: data}}, cb)
    })
  }

  valueForPath(path.slice(1), root, {value: {context: val}}, cb)
}