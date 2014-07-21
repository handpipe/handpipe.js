# Handpipe.js [![Build Status](https://travis-ci.org/handpipe/handpipe.js.svg?branch=master)](https://travis-ci.org/handpipe/handpipe.js) [![Dependency Status](https://david-dm.org/handpipe/handpipe.js.svg)](https://david-dm.org/handpipe/handpipe.js)

Generator based handlebars style streaming templates.

## Getting started

Install node >= 0.11

Start node using `--harmony` flag.

### Example

Given template.html:

```html
<!doctype html>
<div>
  <h1>{{title}}</h1>
  <p>{{desc}}</p>
</div>
```

Read, process and pipe to output.html:

```js
var fs = require("fs")
  , handpipe = require("handpipe")

fs.createReadStream("template.html")
  .pipe(handpipe({
    title: function (next, cb) {
      // Some async operation to get data for "title"
      setTimeout(function () { cb(null, "foobar") }, 1000)
    },
    desc: "Lorem ipsum dolor sit"
  }))
  .pipe(fs.createWriteStream("output.html"))
```

## API

### handpipe([ data ])

Create a through stream to compile a template and apply a data context to it. Pipe Handlebars in, and HTML/Markdown/whatever out. Shortcut for `handpipe.compile().pipe(handpipe.apply([ data ]))`

#### data

The `data` object gets values for the template. Properties that require async processing are functions with the signature `function (next, cb) {}`.

`next` is an object that has a `key` property. This is the name of the variable / function your code should invoke to retrieve the value. In loops, the next object will also contain an `index` and an `iterable` property.

Invoke `cb` when the value has been retrieved. Pass the value as the second argument (error as the first if one occurred).

### handpipe.compile()

Create a new handpipe compiler. The compiler is a through stream you can pipe templates into and compiled template JS out from.

### handpipe.apply([ data ])

Applies the [`data`](#data) to the compiled template. Returns a through stream that you can pipe compiled template JS into and HTML/Markdown/whatever out from. 

## Template syntax

Template syntax is a subset of handlebars.

### Variable output

Output variables using double curly braces:

`{{varname}}`

handpipe supports simple paths so you can output content below the current context:

`{{foo.bar}}` or `{{foo/bar}}`

Nested paths can also include `../` segments, which evaluate their paths against a parent context.

```html
<h1>Comments</h1>

<div id="comments">
 {{#each comments}}
 <h2><a href="/posts/{{../permalink}}#{{id}}">{{title}}</a></h2>
 <div>{{body}}</div>
 {{/each}}
</div>
```

### Loops

Use the `each` block helper to iterate over arrays:

```html
<ul>
  {{#each sprockets}}
  <li>{{name}} ({{teeth}})</li>
  {{/each}}
</ul>
```

You might populate this template with the following JS:
 
```js
handpipe({
  sprockets: function (next, cb) {
    db.sprockets.find({}).toArray(cb)
  }
})
```

If sprocket objects **do not** have "name" and/or "teeth" properties then the `data` object passed to handpipe will be queried so that a value can be provided. `next.key` will be "name" or "teeth" (depending on which property is currently being evaluated), `next.context` will be the current sprocket object.

### Conditionals

Use the `if` block helper to create conditionally rendered template blocks:

```html
{{#if title}}
  <h1>{{title}}</h1>
{{/if}}
```

With optional alternative:

```html
{{#if title}}
  <h1>{{title}}</h1>
{{else}}
  <h1>Unnamed</h1>
{{/if}}
```

### HTML escaping

handpipe HTML-escapes values returned by a `{{expression}}`. If you don't want handpipe to escape a value, use the "triple-stash", `{{{`.
 
 ```html
 <div class="entry">
   <h1>{{title}}</h1>
   <div class="body">
     {{{body}}}
   </div>
 </div> 
```

### Comments

Use `{{! comment }}` or `{{!-- comment --}}` to create comments that don't appear in output HTML. Any comments that must contain `{{` or `}}` should use the `{{!-- --}}` syntax.

### Context re-binding

Use the `with` block helper to alter the context for a template block:

```html
<div class="entry">
  <h1>{{title}}</h1>

  {{#with author}}
  <h2>By {{firstName}} {{lastName}}</h2>
  {{/with}}
</div>
```

## Example compiled template

Incase you're interested...

```js
(function* (ts) {ts.push("<!doctype html>\n<div>\n  <h1>");var _0 = yield {key: 'title'};ts.push(_0);ts.push("</h1>\n  <ul>\n    ");var _1 = yield {key: 'tweets'};for (var _2 = 0; _2 < _1.length; _2++) {ts.push("\n    <li>\n      ");var _3;if (_1[_2]['text'] !== undefined) {_3 = _1[_2]['text'];} else {_3 = yield {key: 'text', iterable: _1, index: _2};}ts.push(_3);ts.push("\n      ");var _4;if (_1[_2]['hashtags'] !== undefined) {_4 = _1[_2]['hashtags'];} else {_4 = yield {key: 'hashtags', iterable: _1, index: _2};}for (var _5 = 0; _5 < _4.length; _5++) {ts.push("#");var _6;if (_4[_5] !== undefined) {_6 = _4[_5];} else {_6 = yield {key: 'this', iterable: _4, index: _5};}ts.push(_6);ts.push(" ");}ts.push("\n      by ");var _7;if (_1[_2]['author'] !== undefined) {_7 = _1[_2]['author'];} else {_7 = yield {key: 'author', iterable: _1, index: _2};}if (_7) {var _8;if (_1[_2]['author'] !== undefined) {_8 = _1[_2]['author'];} else {_8 = yield {key: 'author', iterable: _1, index: _2};}ts.push(_8);} else {ts.push("Unknown");}ts.push("\n    </li>\n    ");}ts.push("\n  </ul>\n</div>");})
```