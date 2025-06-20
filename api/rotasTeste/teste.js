const express = require('express');
const router = express.Router();

const { obterMinutoNegociacaoUsuario } = require('../utils/negociacaoUsuario.js');
const { obterPrecoMercado } = require('../utils/precoMercado.js');

router.get('/obterPrecoMercado', async function (req, res) {
    console.log(await obterPrecoMercado('PETR3', 59));
    res.json('sucesso');
});
module.exports = router;
