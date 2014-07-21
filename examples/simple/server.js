var http = require("http")
var fs = require("fs")
var hp = require("../../")

var server = http.createServer(function (req, res) {
  res.writeHead(200, {"Content-Type": "text/html"})

  fs.createReadStream(__dirname + "/dist/page.js").pipe(hp.apply({
    posts: function (next, cb) {
      fs.readFile(__dirname + "/posts.json", "utf8", function (er, posts) {
        if (er) return cb(er)
        cb(null, JSON.parse(posts))
      })
    },
    tweets: function (next, cb) {
      fs.readFile(__dirname + "/tweets.json", "utf8", function (er, tweets) {
        if (er) return cb(er)
        cb(null, JSON.parse(tweets))
      })
    }
  })).pipe(res)
})

server.listen(8080)