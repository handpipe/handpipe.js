# genplate

Streaming templates where template data is retrieved asynchronously using generators.

## Dream code

```js
var fs = require("fs")
  , genplate = require("genplate")

fs.createReadStream("template.html")
  .pipe(genplate(function (next, cb) {
    // Some async operation to get data for next.property
    cb(null, {foo: "bar"})
  }))
  .pipe(fs.createWriteStream("output.html"))
```

## Compiled template

```html
<!doctype html>
<div>
  <h1>{{title}}</h1>
  <ul>
  {{loop}}
    <li>{{tweet}}</li>
  {{/loop}}
  </ul>
</div>
```

```js
module.exports = function (getter) {
  
  function* template () {
    var html = "<!doctype html><div><ul>"
    var _0 = yield {property: "title"}
    html = html + _0
    var _1 = null
    var _counter0 = 0
    while (_1 = yield {property: "tweet", index: _counter0}) {
      html = html + "<li>" + _1 + </li>
      _counter0++
    }
    html = html + "</ul></div>"
    return html
  }
  
  
  var g = template()
  var next = g.next()
  
  function getNext (next, generator) {
    if (next.done) return
  
    getter(next.value, function (er, result) {
      if (er) throw er
      getNext(generator.next(result), generator)
    })
  }
  
  getNext(g.next(), g)

  through2(function (chunk, enc, cb) {
  })
}

```