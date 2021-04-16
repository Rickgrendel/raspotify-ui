const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');
const request = require('request');

const host = '127.0.0.1';
const port = 3000;
const root = path.resolve(__dirname, '../frontend');

let server;

const app = express();

const wss = new WebSocket.Server({ port: 8080});
let socket;

let token;
let tokenActive = false;
let trackID = '';
let loaded = false;
let prevTime = 0;

const client_id = 'ae2ec5dfe06a4f8caee8245936f31536';
const client_secret = '4bd51009aa424f779958d8065f98937b';

const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
        grant_type: 'client_credentials'
    },
    json: true
};

wss.on('connection', ws => {
    try {
        connectedToSocket(ws);
    }catch (e) {
        console.error(e);
    }
});

app.use(((req, res, next) => {
    console.log(req.url);
    next();
}));

app.use(express.static(root));
server = app.listen(port, host, serverStarted);

function serverStarted () {
    console.log('server started');
}

async function auth() {
    return new Promise((resolve, reject) => {
        request.post(authOptions, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                token = body.access_token;
                tokenActive = true;

                resolve(true);
            }else{
                console.error(body);
                reject(false);
            }
        });
    });
}

async function connectedToSocket (ws) {
    await auth();

    fs.readFile("backend/test.txt", (err, data) => {
        if (err) return console.error(err);
        if (trackID !== data.toString()) {
            console.log(token);

            request.get({
                url: 'https://api.spotify.com/v1/tracks/' + data.toString(),
                headers: {
                    'Authorization': 'Bearer ' + token
                },

                json: true
            }, (error, response, body) => {
                if(!error && response.statusCode === 200) {
                    const wsResponse = {
                        code: 'RASPOTIFY_LOADED',
                        songInfo: {
                            albumURLs: body.album.images,
                            albumName: body.album.name,
                            songName: body.name,
                            artists: body.artists,
                            uri: body.uri
                        }
                    }

                    ws.send(JSON.stringify(wsResponse));
                    setInterval(scan, 200)
                    socket = ws
                }else{
                    console.error(body);

                    tokenActive = false;
                    auth();
                }
            });

            trackID = data.toString();
        }
    });
}

function scan () {
    fs.readFile("backend/test.txt", (err, data) => {
        if (err) return console.error(err);
        if (trackID !== data.toString()) {

            request.get({
                url: 'https://api.spotify.com/v1/tracks/' + data.toString(),
                headers: {
                    'Authorization': 'Bearer ' + token
                },

                json: true
            }, (error, response, body) => {
                if(!error && response.statusCode === 200) {
                    const wsResponse = {
                        code: 'RASPOTIFY_NEW_SONG',
                        songInfo: {
                            albumURLs: body.album.images,
                            albumName: body.album.name,
                            songName: body.name,
                            artistName: body.artists,
                            uri: body.uri
                        }
                    }

                    socket.send(JSON.stringify(wsResponse));
                }else{
                    console.error(body);

                    tokenActive = false;
                    auth();
                }
            });

            trackID = data.toString();
        }
    });
}
