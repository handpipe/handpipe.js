const plexer = require("plexer")
    , compile = require("./compile")
    , apply = require("./apply")

module.exports = function (getter) {
  var compiler = compile()
  var applier = apply(getter)

  compiler.pipe(applier)

  return plexer(compiler, applier)
}

module.exports.compile = compile
module.exports.apply = apply