var fs = require("fs")
var genplate = require("../")

var tweets = [{text: "Oh HAI!", hashtags: ["OMG", "WTF"]}]

fs.createReadStream(__dirname + "/fixtures/template.html")
  .pipe(genplate(function (next, cb) {
    if (next.key == "title") {
      setTimeout(function () {
        cb(null, "Foo")
      }, 2000)
    }

    if (next.key == "tweets") {
      return cb(null, tweets)
    }
  }))
  .pipe(process.stdout)
