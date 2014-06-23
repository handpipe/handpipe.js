var fs = require("fs")
var genplate = require("../")

fs.createReadStream(__dirname + "/fixtures/template.html")
  .pipe(genplate({
    title: function (next, cb) {
      setTimeout(function () {
        cb(null, "Foo")
      }, 2000)
    },
    tweets: [
      {text: "Oh HAI!", hashtags: ["OMG", "WTF"], author: "Foo Bar"},
      {text: "OMGWTF!"}
    ],
    author: function (next, cb) {
      cb(null, "Author" + next.index)
    }
  }))
  .pipe(process.stdout)
