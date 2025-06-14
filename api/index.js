var express = require('express');
var app = express();


var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


var olaMundo = require('./controller/olamundo.js');
app.use('/olamundo', olaMundo);

app.listen(3000);