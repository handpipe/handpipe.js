const split2 = require("split2")
    , through2 = require("through2")
    , plexer = require("plexer")

module.exports = function () {
  var splitter = split2(/(?:\{\{)|(?:\}\}\}?)/)
    , inJs = false
    , inComment = false
    , first = true
    , tmpVar = 0
    , contexts = []
    , indexes = []

  var ts = through2(function (chunk, enc, cb) {
    chunk = chunk.toString()

    if (first) {
      this.push("(function* (ts) {")
      this.push('var f=/&/g,c=/</g,e=/>/g,b=/\\\'/g,a=/\\"/g,d=/[&<>\\"\\\']/;function esc(g){return d.test(g)?g.replace(f,"&amp;").replace(c,"&lt;").replace(e,"&gt;").replace(b,"&#39;").replace(a,"&quot;"):g};')
      first = false
    }

    if (inJs) {
      // comment
      if (inComment) {
        if (chunk.slice(-2) == "--") {
          inComment = false
        }
      } else if (chunk[0] == "!") {
        // Are we in {{!-- --}} comment?
        if (chunk.slice(1, 3) == "--" && chunk.slice(-2) != "--") {
          inComment = true
        }
      // block
      } else if (chunk[0] == "#") {
        if (chunk.slice(1, 5) == "each") {
          contexts.push(lookupVar(chunk.slice(6).trim(), contexts, indexes, this))
          tmpVar = genVarName()
          this.push("for (var " + tmpVar + " = 0; " + tmpVar + " < " + indexedVar(contexts[contexts.length - 1]) + ".length; " + tmpVar + "++) {")
          indexes.push(tmpVar)
        } else if (chunk.slice(1, 3) == "if") {
          tmpVar = lookupVar(chunk.slice(4).trim(), contexts, indexes, this)
          this.push("if (" + tmpVar + ") {")
        } else {
          return cb(new Error("Unknown block open " + chunk))
        }
      // end block
      } else if (chunk[0] == "/") {
        if (chunk.slice(1, 5) == "each") {
          contexts.pop()
          indexes.pop()
          this.push("}")
        } else if (chunk.slice(1, 3) == "if") {
          this.push("}")
        } else {
          return cb(new Error("Unknown block close " + chunk))
        }
      // alternative
      } else if (chunk.trim() == "else") {
        this.push("} else {")
      } else {
        var escape = true

        if (chunk[0] == "{") {
          chunk = chunk.slice(1)
          escape = false
        }

        tmpVar = lookupVar(chunk.trim(), contexts, indexes, this)
        this.push("ts.push(" + (escape ? "esc(" : "") + tmpVar + "+''" + (escape ? ")" : "") + ");")
      }
    } else {
      chunk = JSON.stringify(chunk)

      if (chunk != '""') {
        this.push("ts.push(" + chunk + ");")
      }
    }

    if (!inComment) {
      inJs = !inJs
    }

    cb()

  }, function (cb) {
    if (!first) {
      this.push("})")
    }

    inJs = false
    inComment = false
    first = true
    tmpVar = null
    contexts = []
    indexes = []

    this.push(null)
    cb()
  })

  splitter.pipe(ts)

  return plexer(splitter, ts)
}

function lookupVar (varName, contexts, indexes, ts) {
  var context = contexts.length ? contexts[contexts.length - 1] : null
    , index = indexes.length ? indexes[indexes.length - 1] : -1
    , sep = /[./]/
    , tmpVar = genVarName()

  if (context != null) {
    ts.push("var " + tmpVar + ";")
    if (varName == "this") {
      ts.push("if (" + indexedVar(context, index) + " != null) {")
      // Is async fetch?
      ts.push("if (typeof " + indexedVar(context, index) + " == 'function') {")
      ts.push(tmpVar + " = yield {key: '" + varName + "', context: " + indexedVar(context, index) + "};")
      ts.push("} else {")
      ts.push(tmpVar + " = " + indexedVar(context, index) + ";")
      ts.push("}")
      ts.push("} else {")
      ts.push(tmpVar + " = yield {key: '" + varName + "', context: " + indexedVar(context, index) + "};")
      ts.push("}")
    } else if (!sep.test(varName)) {
      ts.push("if (" + indexedVar(context, index) + "['" + varName + "'] != null) {")
      // Is async fetch?
      ts.push("if (typeof " + indexedVar(context, index) + "['" + varName + "'] == 'function') {")
      ts.push(tmpVar + " = yield {key: '" + varName + "', context: " + indexedVar(context, index) + "};")
      ts.push("} else {")
      ts.push(tmpVar + " = " + indexedVar(context, index) + "['" + varName + "'];")
      ts.push("}")
      ts.push("} else {")
      ts.push(tmpVar + " = yield {key: '" + varName + "', context: " + indexedVar(context, index) + "};")
      ts.push("}")
    } else {
      // Need to do lookup on variable path
      // TODO: Split on regex
      var path = varName.replace(/\.\./g, "--").split(sep).map(function (p) {
        return p.replace(/--/g, "..")
      })

      var parents

      for (parents = 0; parents < path.length; parents++) {
        if (path[parents] != "..") break
      }

      if (parents > contexts.length) {
        return ts.emit(new Error(varName + " attempted lookup above root context"))
      }

      if (parents == contexts.length) {
        // All the way up to root
        // TODO
        throw new Error("Not implemented")
      } else {

        if (parents > 0) {
          // Some parent context
          context = contexts[contexts.length - 1 - parents]
          index = indexes[indexes.length - 1 - parents]
          path = path.slice(parents)
        }

        var currentVar = indexedVar(context, index)
          , lastVar = null

        ts.push(tmpVar + " = " + currentVar + ";")

        path.forEach(function (p) {
          lastVar = currentVar
          currentVar = tmpVar + "['" + p + "']"
          ts.push("if (" + currentVar + " != null) {")
          ts.push("if (typeof " + currentVar + " == 'function') {")
          ts.push(tmpVar + " = yield {key: '" + p + "', context: " + lastVar + "};")
          ts.push("} else {")
          ts.push(tmpVar + " = " + currentVar + ";")
          ts.push("}")
          ts.push("} else {")
          ts.push(tmpVar + " = yield {key: '" + p + "', context: " + lastVar + "};")
          ts.push("}")
        })
      }
    }
  } else {
    ts.push("var " + tmpVar + " = yield {key: '" + varName + "'};")
  }

  return tmpVar
}

function indexedVar (name, index) {
  return name + (index === undefined ? "" : "[" + index + "]")
}

const genVarName = (function () {
  var id = 0
  return function () {
    return "_" + (++id)
  }
})()