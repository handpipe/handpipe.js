const split2 = require("split2")
    , through2 = require("through2")
    , plexer = require("plexer")

module.exports = function () {
  var splitter = split2(/(?:{{)|(?:}})/)
    , inJs = false
    , first = true
    , varId = 0

  var ts = through2(function (chunk, enc, cb) {
    chunk = chunk.toString()

    if (first) {
      this.push("(function* (ts) {")
      first = false
    }

    if (inJs) {
      if (chunk[0] == "#") {
        // TODO: Deal with macro
      } else {
        this.push("var _" + varId + " = yield {key: '" + chunk + "'};")
        this.push("ts.push(_" + varId + ");")
        varId++
      }
    } else {
      this.push("ts.push(" + JSON.stringify(chunk) + ");")
    }

    inJs = !inJs

    cb()

  }, function (cb) {
    inJs = false
    first = true
    varId = 0
    this.push("})")
    this.push(null)
    cb()
  })

  splitter.pipe(ts)

  return plexer(splitter, ts)
}