var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var olaMundo = require('./controller/olamundo.js');
app.use('/olamundo', olaMundo);

var carteira = require('./controller/carteira.js');
app.use('/carteira', carteira);

var usuario = require('./controller/usuario.js');
app.use('/usuario', usuario);

var ordemVenda = require('./controller/acoes/ordemVenda.js');
app.use('/acoes/ordemVenda', ordemVenda);

var ordemCompra = require('./controller/acoes/ordemCompra.js');
app.use('/acoes/ordemCompra', ordemCompra);

var acaoInteresse = require('./controller/acoes/acaoInteresse.js');
app.use('/acoes/acaoInteresse', acaoInteresse);

var atualizaHoraNegociacao = require('./controller/acoes/atualizaHoraNegociacao.js');
app.use('/acoes/atualizaHoraNegociacao', atualizaHoraNegociacao);

var teste = require('./rotasTeste/teste.js');
app.use('/testes', teste);

var contaCorrente = require('./controller/contaCorrente.js');
app.use('/contaCorrente', contaCorrente);

var listarAcoesMercado = require('./controller/acoes/listarAcoesMercado.js');
app.use('/acoes/listarAcoesMercado', listarAcoesMercado);

app.listen(3000);
