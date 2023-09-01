// Libraries
const fs            = require('fs');
const http          = require('http');
const axios         = require('axios');
const querystring   = require('querystring');

// Regular expression pattern to match URLs
const urlPattern    = /['"`](.\/.+?|\/.+?)['"`]|['"`](http:\/\/.+?|https:\/\/.+?)['"`]/g;

// Function to replace URLs with modified URLs
function replaceUrls(text, originalURL) {
    return text.replace(urlPattern, (match, pathMatch, httpMatch) => {
        console.log(`====\nMatch: ${match}\nPath Match: ${pathMatch}\nREPLACEMENT: \"/Travel?url=${originalURL}/${pathMatch}\"\nHttp Match: ${httpMatch}\nREPLACEMENT: \"/Travel?url=${httpMatch}\"\n====\n\n`);
        if (pathMatch) {
            if (originalURL.slice(-1) == '/') {
                originalURL = originalURL.slice(0, -1);
            };
            if (pathMatch.slice(0, 1) == '/') {
                pathMatch = pathMatch.slice(1, -1);
            };

            if (originalURL.slice(-1) ~= '/' && pathMatch.slice(0, 1) ~= '/') {
                originalURL = originalURL + '/'
            };
            return `"/Travel?url=${originalURL}${pathMatch}"`;
        } else if (httpMatch) {
            return `"/Travel?url=${httpMatch}"`;
        };
        return match;
    });
};

// Create http server
const server = http.createServer((req, res) => {
    var spliturl    = req.url.split('?');
    var qs          = querystring.decode(spliturl[1]);
    switch (spliturl[0]) {
        // Default Endpoint
        case '/':
            fs.readFile('./Public/index.html', 'utf8', (error, data) => {
                if (data) {
                    res.writeHead(200, {
                        'Content-Type': 'text/html';
                    });
                    res.write(data, 'utf8');
                    return res.end();
                } else if (error) {
                    console.error(error);
                    res.writeHead(200, {
                        'Content-Type': 'text/plain';
                    });
                    res.write(`Failed to load html, Please use the endpoint /Travel?url=https://example.com/ until this issue can be resolved.\nError Code: ${error.code}`);
                    return res.end();
                };
            });
            break;

        // Reverse Proxy Endpoint
        case '/Travel':
            if (qs['url']) {
                var toProxy = qs['url'];
                axios.get(toProxy)
                    .then(response => {
                        console.log(`Loading site ${toProxy}`);
                        const modifiedHtml = replaceUrls(response.data, toProxy);
                        res.writeHead(200, {
                            'Content-Type': 'text/html';
                        });
                        res.write(modifiedHtml);
                        return res.end();
                    });
                    .catch(error => {
                        console.error(error);
                        res.writeHead(500);
                        res.write(`Error proxying the URL.\n${error.code}`);
                        return res.end();
                    });
            } else {
                res.writeHead(400);
                res.write('Missing Query String Parameters.');
                return res.end();
            };
            break;

        case '/Devlog':
            res.writeHead(200, {
                'Content-Type': 'text/plain';
            });
            process.stdout.on("data", data => {
                data = data.toString();
                res.write(data + "\n");
            });
            process.stderr.on("data", data => {
                data = data.toString();
                res.write(data + "\n");
            });
            return res.end();

        // Unknown endpoint
        default:
            res.writeHead(404);
            res.write('Page does not exist.');
            res.end();
            break;
    };
});

// Start listening
server.listen(8080, () => {
    console.log('Server listening on port 8080 :) ');
});