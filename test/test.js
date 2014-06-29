var fs = require("fs")
  , test = require("tape")
  , concat = require("concat-stream")
  , through2 = require("through2")
  , genplate = require("../")

var templatesDir = __dirname + "/fixtures/templates"
  , expectationsDir = __dirname + "/fixtures/expectations"

function setupTest (template, data, cb) {
  fs.createReadStream(templatesDir + "/" + template)
    .pipe(genplate(data))
    .pipe(through2(function (chunk, enc, cb) {
      console.log(chunk + "")
      this.push(chunk, enc)
      cb()
    }))
    .pipe(concat({encoding: "string"}, function (actual) {
      fs.readFile(expectationsDir + "/" + template, "utf8", function (er, expected) {
        cb(er, {template: template, actual: actual, expected: expected})
      })
    }))
}

test("variable", function (t) {
  t.plan(2)
  setupTest("variable.html", {title: "Hello World!"}, function (er, data) {
    t.ifError(er, "Error during " + data.template + " setup")
    t.equal(data.actual, data.expected, "Unexpected contents " + data.template)
  })
})

test("variable with whitespace", function (t) {
  t.plan(2)
  setupTest("variable-w-whitespace.html", {title: "Hello World!"}, function (er, data) {
    t.ifError(er, "Error during " + data.template + " setup")
    t.equal(data.actual, data.expected, "Unexpected contents " + data.template)
  })
})

test("async variable", function (t) {
  t.plan(2)
  setupTest("variable-async.html", {
    title: function (next, cb) {
      setTimeout(function () {
        cb(null, "Hello World!")
      }, 100)
    }
  }, function (er, data) {
    t.ifError(er, "Error during " + data.template + " setup")
    t.equal(data.actual, data.expected, "Unexpected contents " + data.template)
  })
})

test("path variable", function (t) {
  t.plan(2)
  setupTest("variable-path.html", {
    doc: {
      chapterOne: {
        title: "Great Expectations"
      },
      chapterTwo: function (next, cb) {
        setTimeout(function () {
          cb(null, {
            title: function (next, cb) {
              setTimeout(function () {
                cb(null, "Turtles")
              }, 138)
            }
          })
        }, 50)
      },
      chapterThree: {
        title: function (next, cb) {
          setTimeout(function () {
            cb(null, "Turtle Head")
          }, 9)
        }
      }
    }
  }, function (er, data) {
    t.ifError(er, "Error during " + data.template + " setup")
    t.equal(data.actual, data.expected, "Unexpected contents " + data.template)
  })
})

test("falsey variable", function (t) {
  t.plan(2)
  setupTest("variable-falsey.html", {
    emptyString: "",
    emptyArray: [],
    nully: null,
    zero: 0,
    undef: undefined
  }, function (er, data) {
    t.ifError(er, "Error during " + data.template + " setup")
    t.equal(data.actual, data.expected, "Unexpected contents " + data.template)
  })
})

test("falsey if", function (t) {
  t.plan(2)
  setupTest("if-falsey.html", {
    emptyString: "",
    nully: null,
    zero: 0,
    undef: undefined
  }, function (er, data) {
    t.ifError(er, "Error during " + data.template + " setup")
    t.equal(data.actual, data.expected, "Unexpected contents " + data.template)
  })
})

test("path if", function (t) {
  t.plan(2)
  setupTest("if-path.html", {
    doc: {
      chapterOne: {
        title: "Great Expectations"
      },
      chapterTwo: function (next, cb) {
        setTimeout(function () {
          cb(null, {
            title: function (next, cb) {
              setTimeout(function () {
                cb(null, "Turtles")
              }, 138)
            }
          })
        }, 50)
      },
      chapterThree: {
        title: function (next, cb) {
          setTimeout(function () {
            cb(null, "Turtle Head")
          }, 9)
        }
      },
      chapterFour: function (next, cb) {
        setTimeout(function () {
          cb(null, {
            title: function (next, cb) {
              setTimeout(function () {
                cb(null, "")
              }, 138)
            }
          })
        }, 50)
      },
      chapterFive: {
        title: function (next, cb) {
          setTimeout(function () {
            cb()
          }, 9)
        }
      }
    }
  }, function (er, data) {
    t.ifError(er, "Error during " + data.template + " setup")
    t.equal(data.actual, data.expected, "Unexpected contents " + data.template)
  })
})

test("if else", function (t) {
  t.plan(2)
  setupTest("if-else.html", {foo: {selected: true}, bar: {selected: false}}, function (er, data) {
    t.ifError(er, "Error during " + data.template + " setup")
    t.equal(data.actual, data.expected, "Unexpected contents " + data.template)
  })
})

test("each", function (t) {
  t.plan(2)
  setupTest("each.html", {
    title: "Tweets",
    tweets: [
      {
        text: "OMG",
        author: {name: "SteveDave69"}
      },
      {
        text: "WTF",
        hashtags: function (next, cb) {
          setTimeout(function () {
            cb(null, ["YOLO", "ROFL"])
          }, 250)
        },
        author: {name: "Paul Bob"}
      },
      {
        text: "BBQ",
        author: function (next, cb) {
          setTimeout(function () {
            cb(null, {
              name: function (next, cb) {
                setTimeout(function () {
                  cb(null, "Pom Bear")
                }, 50)
              }
            })
          }, 250)
        }
      }
    ]
  }, function (er, data) {
    t.ifError(er, "Error during " + data.template + " setup")
    t.equal(data.actual, data.expected, "Unexpected contents " + data.template)
  })
})

test("escape", function (t) {
  t.plan(2)
  setupTest("escape.html", {escape: "<>\"'&", unescape: "<>\"'&"}, function (er, data) {
    t.ifError(er, "Error during " + data.template + " setup")
    t.equal(data.actual, data.expected, "Unexpected contents " + data.template)
  })
})

test("comment", function (t) {
  t.plan(2)
  setupTest("comment.html", null, function (er, data) {
    t.ifError(er, "Error during " + data.template + " setup")
    t.equal(data.actual, data.expected, "Unexpected contents " + data.template)
  })
})