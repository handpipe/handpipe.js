# Getting started

1. Run `node --harmony compile` to compile templates
2. Run `node --harmony server` to start the server
3. Visit `http://localhost:8080/tweets` or `http://localhost:8080/posts`

# What's happening?

`server.js` is serving posts/tweets HTML by streaming the result of the compiled templates and the `posts.json`/`tweets.json` data to the response object.