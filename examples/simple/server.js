var http = require("http")
var fs = require("fs")
var genplate = require("../../")

function posts (req, res) {
  fs.createReadStream(__dirname + "/dist/posts.js").pipe(genplate.apply({
    posts: function (next, cb) {
      fs.readFile(__dirname + "/posts.json", "utf8", function (er, posts) {
        if (er) return cb(er)
        cb(null, JSON.parse(posts))
      })
    }
  })).pipe(res)
}

function tweets (req, res) {
  fs.createReadStream(__dirname + "/dist/tweets.js").pipe(genplate.apply({
    tweets: function (next, cb) {
      fs.readFile(__dirname + "/tweets.json", "utf8", function (er, tweets) {
        if (er) return cb(er)
        cb(null, JSON.parse(tweets))
      })
    }
  })).pipe(res)
}

var server = http.createServer(function (req, res) {
  res.writeHead(200, {"Content-Type": "text/html"})
  switch (req.url) {
    case "/posts": posts(req, res); break
    case "/tweets": tweets(req, res); break
  }
})

server.listen(8080)