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
      if (chunk[0] == "#") {
        if (chunk.slice(1, 5) == "each") {
          lookupVar(chunk.slice(6).trim(), varId, iterables, indexes, this)
          iterables.push(varId)
          varId++
          this.push("for (var _" + varId + " = 0; _" + varId + " < _" + iterables[iterables.length - 1] + ".length; _" + varId + "++) {")
          indexes.push(varId)
          varId++
        } else if (chunk.slice(1, 3) == "if") {
          lookupVar(chunk.slice(4).trim(), varId, iterables, indexes, this)
          this.push("if (_" + varId + ") {")
          varId++
        } else {
          return cb(new Error("Unknown block open " + chunk))
        }
      } else if (chunk[0] == "/") {
        if (chunk.slice(1, 5) == "each") {
          iterables.pop()
          indexes.pop()
          this.push("}")
        } else if (chunk.slice(1, 3) == "if") {
          this.push("}")
        } else {
          return cb(new Error("Unknown block close " + chunk))
        }
      } else if (chunk.trim() == "else") {
        this.push("} else {")
      } else {
        lookupVar(chunk, varId, iterables, indexes, this)
        this.push("ts.push(_" + varId + ");")
        varId++
      }
    } else {
      chunk = JSON.stringify(chunk)

      if (chunk != '""') {
        this.push("ts.push(" + chunk + ");")
      }
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

// TODO: Lookup in parent scopes
function lookupVar (varName, newVarId, iterables, indexes, ts) {
  var iterable = iterables.length ? iterables[iterables.length - 1] : null
  var index = indexes.length ? indexes[indexes.length - 1] : -1

  if (iterable) {
    ts.push("var _" + newVarId + ";")
    if (varName == "this") {
      ts.push("if (_" + iterable + "[_" + index + "] !== undefined) {")
      ts.push("_" + newVarId + " = _" + iterable + "[_" + index + "];")
    } else {
      ts.push("if (_" + iterable + "[_" + index + "]['" + varName + "'] !== undefined) {")
      ts.push("_" + newVarId + " = _" + iterable + "[_" + index + "]['" + varName + "'];")
    }
    ts.push("} else {")
    ts.push("_" + newVarId + " = yield {key: '" + varName + "', iterable: _" + iterable + ", index: _" + index + "};")
    ts.push("}")
  } else {
    ts.push("var _" + newVarId + " = yield {key: '" + varName + "'};")
  }
}