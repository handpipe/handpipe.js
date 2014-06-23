const plexer = require("plexer")
    , compile = require("./compile")
    , apply = require("./apply")

module.exports = function (data) {
  var compiler = compile()
  var applier = apply(data)

  compiler.pipe(applier)

  return plexer(compiler, applier)
}

module.exports.compile = compile
module.exports.apply = apply