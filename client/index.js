'use strict';

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const fs = require('fs');

app.get('/', (req, res) => res.json('Hello World!'));

app.get('/index.html', (req, res) => res.sendFile(`${__dirname}/index.html`));
app.use(express.static('../src'));

http.listen(9000, function(){
    console.log(`listening on *:9000`);
});

