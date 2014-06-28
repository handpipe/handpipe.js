# Getting started

1. Run `node --harmony compile` to compile templates
2. Run `node --harmony server` to start the server
3. Visit `http://localhost:8080/`

# What's happening?

`server.js` is serving HTML by streaming the result of the compiled template `page.hbs` and the `posts.json`/`tweets.json` data to the response object.