var fs = require("fs")
  , hp = require("../../")

var src = __dirname + "/templates"
var dest = __dirname + "/dist"

fs.readdir(src, function (er, files) {
  if (er) throw er
  fs.mkdir(dest, function () {
    files.forEach(function (file) {
      var outPath = dest + "/" + file.replace(".hbs", ".js")
      fs.createReadStream(src + "/" + file).pipe(hp.compile()).pipe(fs.createWriteStream(outPath))
    })
  })
})