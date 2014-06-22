# genplate

Streaming templates where template data is retrieved asynchronously using generators.

## Dream code

```js
var fs = require("fs")
  , genplate = require("genplate")

fs.createReadStream("template.html")
  .pipe(genplate(function (property, cb) {
    // Some async operation to get data for the property
    cb(null, {foo: "bar"})
  }))
  .pipe(fs.createWriteStream("output.html"))
```