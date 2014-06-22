# genplate

Streaming templates where template data is retrieved asynchronously using generators.

## Dream code

```js
var fs = require("fs")

fs.createReadStream("template.html")
  .pipe(genplate(function (property, cb) {
    // Some async operation to get data for the property
  }))
  .pipe(fs.createWriteStream("output.html"))
```