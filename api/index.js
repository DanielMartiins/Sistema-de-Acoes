var express = require('express');
var app = express();


app.get('/', function(req,res) {
    res.send("Está rodando!");
});

app.listen(3000);