# genplate [![Build Status](https://travis-ci.org/alanshaw/genplate.svg?branch=master)](https://travis-ci.org/alanshaw/genplate)

Streaming templates where template data is retrieved asynchronously using generators.

**Currently you can only output variables `{{varname}}` - no conditionals/loops**

## Getting started

Install node >= 0.11

Start node using `--harmony` flag.

### Example

Given template.html:

```html
<!doctype html>
<div>
  <h1>{{title}}</h1>
</div>
```

Read, process and pipe to output.html:

```js
var fs = require("fs")
  , genplate = require("genplate")

fs.createReadStream("template.html")
  .pipe(genplate(function (next, cb) {
    // Some async operation to get data for next.key
    setTimeout(function () {
      if (next.key == "title")
        cb(null, "foobar")
    }, 1000)
  }))
  .pipe(fs.createWriteStream("output.html"))
```

## API

**genplate([ getter ])**

### getter

The `getter` function gets values for the template. It has the signature `function (next, cb) {}`.

`next` is an object that has a `key` property. This is the name of the variable / function your code should invoke to retrieve the value. In loops, the next object will also contain an `index` property.

Invoke `cb` when the value has been retrieved. Pass the value as the second argument (error as the first if one occurred).

## Advanced usage
 
### Compile/apply only

genplate exposes the compile/apply through streams as `genplate.compile` and `genplate.apply` so you can compile a template ahead of time and reuse it multiple times with different getter functions.