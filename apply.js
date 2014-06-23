const vm = require("vm")
    , through2 = require("through2")

module.exports = function (data) {
  data = data || {}

  var gStr = ""

  return through2(function (chunk, enc, cb) {
    gStr += chunk.toString()
    cb()
  }, function (cb) {
    console.log(gStr)
    var g = vm.runInNewContext(gStr)(this)
    gStr = null

    function getNext (next, generator) {
      if (next.done) return cb()

      var key = next.value.key

      // No data
      if (!data[key]) {
        return getNext(generator.next(""), generator)
      }

      // Async operation
      if (data[key] instanceof Function) {
        return data[key](next.value, function (er, result) {
          if (er) return cb(er)
          getNext(generator.next(result), generator)
        })
      }

      // Literal value
      getNext(generator.next(data[key]), generator)
    }

    getNext(g.next(), g)
  })
}