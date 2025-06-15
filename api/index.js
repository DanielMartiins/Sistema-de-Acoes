var express = require('express')
var app = express()

var bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

var olaMundo = require('./controller/olamundo.js')
app.use('/olamundo', olaMundo)

var carteira = require('./controller/carteira.js')
app.use('/carteira', carteira)

var usuario = require('./controller/usuario.js')
app.use('/usuario', usuario)

app.listen(3000)
