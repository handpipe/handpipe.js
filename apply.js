const vm = require("vm")
    , through2 = require("through2")

module.exports = function (getter) {
  getter = getter || function (next, cb) { cb() }

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

      getter(next.value, function (er, result) {
        if (er) throw er
        getNext(generator.next(result), generator)
      })
    }

    getNext(g.next(), g)
  })
}