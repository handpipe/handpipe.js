const split2 = require("split2")
    , through2 = require("through2")
    , plexer = require("plexer")

module.exports = function () {
  var splitter = split2(/(?:{{)|(?:}})/)
    , inJs = false
    , first = true
    , varId = 0
    , iterables = []
    , indexes = []

  var ts = through2(function (chunk, enc, cb) {
    chunk = chunk.toString()

    if (first) {
      this.push("(function* (ts) {")
      first = false
    }

    if (inJs) {
      var iterable = iterables.length ? iterables[iterables.length - 1] : null
      var index = indexes.length ? indexes[indexes.length - 1] : -1

      if (chunk[0] == "#") {
        if (chunk.slice(1, 5) == "each") {
          this.push("var _" + varId + ";")
          if (iterable) {
            if (chunk.slice(6) == "this") {
              this.push("if (_" + iterable + "[_" + index + "] !== undefined) {")
              this.push("_" + varId + " = _" + iterable + "[_" + index + "];")
            } else {
              this.push("if (_" + iterable + "[_" + index + "]['" + chunk.slice(6) + "'] !== undefined) {")
              this.push("_" + varId + " = _" + iterable + "[_" + index + "]['" + chunk.slice(6) + "'];")
            }
            this.push("} else {")
            this.push("_" + varId + " = yield {key: '" + chunk.slice(6) + "', iterable: _" + iterable + ", index: _" + index + "};")
            this.push("}")
          } else {
            this.push("_" + varId + " = yield {key: '" + chunk.slice(6) + "'};")
          }
          iterables.push(varId)
          varId++
          this.push("for (var _" + varId + " = 0; _" + varId + " < _" + iterables[iterables.length - 1] + ".length; _" + varId + "++) {")
          indexes.push(varId)
          varId++
        }
      } else if (chunk[0] == "/") {
        if (chunk.slice(1, 5) == "each") {
          iterables.pop()
          indexes.pop()
          this.push("}")
        }
      } else {
        this.push("var _" + varId + ";")
        if (iterable) {
          if (chunk == "this") {
            this.push("if (_" + iterable + "[_" + index + "] !== undefined) {")
            this.push("_" + varId + " = _" + iterable + "[_" + index + "];")
          } else {
            this.push("if (_" + iterable + "[_" + index + "]['" + chunk + "'] !== undefined) {")
            this.push("_" + varId + " = _" + iterable + "[_" + index + "]['" + chunk + "'];")
          }
          this.push("} else {")
          this.push("_" + varId + " = yield {key: '" + chunk + "', iterable: _" + iterable + ", index: _" + index + "};")
          this.push("}")
        } else {
          this.push("_" + varId + " = yield {key: '" + chunk + "'};")
        }
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