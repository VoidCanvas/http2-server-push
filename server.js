'use strict'

const fs = require('fs');
const path = require('path');
const http2 = require('http2');
const utils = require('./utils');

const { HTTP2_HEADER_PATH } = http2.constants;
const PORT = process.env.PORT || 3000;

// The files are pushed to stream here
function push(stream, path) {
  const file = utils.getFile(path);
  if (!file) {
    return;
  }
  stream.pushStream({ [HTTP2_HEADER_PATH]: path }, (pushStream) => {
    pushStream.respondWithFD(file.content, file.headers)
  });
}

// Request handler
function onRequest(req, res) {
  const reqPath = req.path === '/' ? '/index.html' : req.path;
  const file = utils.getFile(reqPath);

  // 404 - File not found
  if (!file) {
    res.statusCode = 404;
    res.end();
    return;
  }

  // Push with index.html
  if (reqPath === '/index.html') {
    push(res.stream, '/assets/main.js');
    push(res.stream, '/assets/style.css');
  } else {
    console.log("requiring non index.html")
  }

  // Serve file
  res.stream.respondWithFD(file.content, file.headers);
}

// creating an http2 server
const server = http2.createSecureServer({
  cert: fs.readFileSync(path.join(__dirname, '/certificate.crt')),
  key: fs.readFileSync(path.join(__dirname, '/privateKey.key'))
}, onRequest);

// start listening
server.listen(PORT, (err) => {
  if (err) {
    console.error(err);
    return -1;
  }
  console.log(`Server listening to port ${PORT}`);
});
