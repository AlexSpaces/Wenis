// Libraries
const fs = require('fs');
const http = require('http');
const axios = require('axios');
const querystring = require('querystring');

// Regular expression pattern to match URLs
const urlPattern = /['"`].\/(.+)|\/(.+?)['"`]|['"`](http:\/\/.+?|https:\/\/.+?)['"`]/g;

// Function to replace URLs with modified URLs
function replaceUrls(text, originalURL) {
    return text.replace(urlPattern, (match, pathMatch, pathMatch2, httpMatch) => {
        if (pathMatch) {
            return `"/Travel?url=${originalURL}/${pathMatch}"`;
        } else if (pathMatch2) {
            return `"/Travel?url=${originalURL}/${pathMatch2}"`;
        } else if (httpMatch) {
            return `"/Travel?url=${httpMatch}"`;
        }
        return match;
    });
}

// Create http server
const server = http.createServer((req, res) => {
    var spliturl = req.url.split('?');
    var qs = querystring.decode(spliturl[1]);
    switch (spliturl[0]) {
        // Default Endpoint
        case '/':
            fs.readFile('./Public/index.html', 'utf8', (error, data) => {
                if (error) {
                    console.log(error);
                    res.writeHead(200, {
                        'Content-Type': 'text/plain'
                    });
                    res.write(`Failed to load html, Please use the endpoint /Travel?url=https://example.com/ until this issue can be resolved.\nError Code: ${error.code}`)
                    res.end();
                }
                if (data) {
                    res.writeHead(200, {
                        'Content-Type': 'text/html'
                    })
                    res.write(data, 'utf8')
                    res.end();
                }
            })
            break;

        // Reverse Proxy Endpoint
        case '/Travel':
            // if (req.headers['ToProxyUrl']) {
            //     var toProxy = req.headers['ToProxyUrl'];
            //     axios.get(toProxy)
            //         .then(response => {
            //             const modifiedHtml = replaceUrls(response.data, toProxy);
            //             res.writeHead(200, {
            //                 'Content-Type': 'text/html'
            //             });
            //             res.write(modifiedHtml);
            //             return res.end();
            //         })
            //         .catch(error => {
            //             console.error(error);
            //             res.writeHead(500);
            //             res.write(`Error proxying the URL.\n${error.code}`);
            //             return res.end();
            //         });
            // };
            if (qs['url']) {
                var toProxy = qs['url'];
                axios.get(toProxy)
                    .then(response => {
                        const modifiedHtml = replaceUrls(response.data, toProxy);
                        res.writeHead(200, {
                            'Content-Type': 'text/html'
                        });
                        res.write(modifiedHtml);
                        return res.end();
                    })
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
server.listen(8080, () => {
    console.log('Server listening on port 8080 :) ');
});
