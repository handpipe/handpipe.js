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
      //console.log(chunk + "")
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
