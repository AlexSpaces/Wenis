/*
 Made by Jace Dohl for Alex Vargas
 https://t.me/ibrahimsfreethings
*/

// Libraries
const fs = require('fs');
const http = require('http');
const axios = require('axios');
const querystring = require('node:querystring');

// Regular expression pattern to match URLs
const urlPattern = /['"]\/(.+?)['"]|['"](http:\/\/.+?|https:\/\/.+?)['"]/g;

// Function to replace URLs with modified URLs
function replaceUrls(text, originalURL) {
  return text.replace(urlPattern, (match, pathMatch, httpMatch) => {
    if (pathMatch) {
      return `"/proxy?url=${originalURL}${pathMatch}"`;
    } else if (httpMatch) {
      return `"/proxy?url=${httpMatch}"`;
    }
    return match;
  });
}

// Clean up from development
fs.access('index.html', fs.constants.F_OK, (err) => {
  if (!err) {
    fs.rm('index.html', (err) => {
      if (err) {
        console.error("Error deleting index.html:", err);
      }
    });
  }
});

// Create http server
const server = http.createServer((req, res) => {
  var spliturl = req.url.split('?');
  var qs = querystring.decode(spliturl[1]);
  switch (spliturl[0]) {
    // Default Endpoint
    case '/':
      res.writeHead(200, {
        'Content-Type': 'text/plain'
      });
      res.write('Use endpoint \'/proxy?url=https://urltoproxy.com/\' to proxy websites.');
      res.end();
      break;

    // Reverse Proxy Endpoint
    case '/proxy':
      if (qs['url']) {
        var toProxy = qs['url'];
        axios.get(toProxy)
          .then(response => {
            const modifiedHtml = replaceUrls(response.data, toProxy);
            res.writeHead(200, {
              'Content-Type': 'text/html'
            });
            res.write(modifiedHtml);
            fs.writeFile('index.html', modifiedHtml, (err) => {
              if (err) {
                console.error("Error writing index.html:", err);
              }
            });
            res.end();
          })
          .catch(error => {
            console.error(error);
            res.writeHead(500);
            res.write('Error proxying the URL.\n' + error.code);
            res.end();
          });
      } else {
        res.writeHead(400);
        res.write('Missing QueryString Parameters.');
        res.end();
      }
      break;

    // Unknown endpoint
    default:
      res.writeHead(404);
      res.write('Page does not exist.');
      res.end();
      break;
  }
});

// Start listening
server.listen(1337, () => {
  console.log('Server listening on port 1337.');
});