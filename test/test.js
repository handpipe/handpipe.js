var fs = require("fs")
var genplate = require("../")

fs.createReadStream(__dirname + "/fixtures/template.html")
  .pipe(genplate(function (next, cb) {
    if (next.key == "title") {
      setTimeout(function () {
        cb(null, "Foo")
      }, 2000)
    }
  }))
  .pipe(process.stdout)
