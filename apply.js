const vm = require("vm")
    , through2 = require("through2")

module.exports = function (data) {
  data = data || {}

  var gStr = ""

  return through2(function (chunk, enc, cb) {
    gStr += chunk.toString()
    cb()
  }, function (cb) {
    //console.log(gStr)
    var g = vm.runInNewContext(gStr)(this)
    gStr = null

    function getNext (next, generator) {
      if (next.done) return cb()

      valueForPath(next.value.key.split(/[./]/), data, next, function (er, val) {
        if (er) return cb(er)

        // No data
        if (!val) {
          return getNext(generator.next(""), generator)
        }

        // Async operation
        if (val instanceof Function) {
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

function valueForPath (path, data, next, cb) {
  if (!data) return cb()
  
  var val = data[path[0]]

  if (path.length == 1) {
    if (path[0] == "this") {
      val = next.value.iterable ? next.value.iterable : data

      if (!val) return cb(null, "")

      if (val instanceof Function) {
        return val(next.value, function (er, data) {
          if (er) return cb(er)
          cb(null, data[next.value.index])
        })
      }
    }

    return cb(null, val)
  }

  if (!val) return cb(null, "")

  // Turtles all the way down
  if (val instanceof Function) {
    return val(next.value, function (er, data) {
      if (er) return cb(er)
      valueForPath(path.slice(1), data, next, cb)
    })
  }

  valueForPath(path.slice(1), val, next, cb)
}