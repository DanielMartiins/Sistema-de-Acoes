const express = require('express');
const router = express.Router();
const getConnection = require('../model/dbConnection.js');
const { obterMinutoNegociacaoUsuario } = require('../utils/negociacaoUsuario.js');
const { obterPrecoMercado, obterPrecoFechamento } = require('../utils/precoMercado.js');

router.get('/obterPrecoMercado', async function (req, res) {
    const ticker = req.query.ticker;
    const minuto = req.query.minuto;

    const resultado = await obterPrecoMercado(ticker, minuto);
    res.json(`Preço do ticker ${ticker}: ${resultado}`);
});

router.get('/obterPrecoFechamento', async function (req, res) {
    const ticker = req.query.ticker;

    const resultado = await obterPrecoFechamento(ticker);
    res.json(`Preço de fechamento do ticker ${ticker}: ${resultado}`);
});

router.get('/ordensVendaPendentes/:id', async function (req, res) {

    const idUsuario = req.params.id;
    const resultado = await ordensVendaPendentes(idUsuario);
    console.log(resultado);
    res.json(resultado);
});

async function ordensVendaPendentes(idUsuario) {
    const db = await getConnection();
    const [ordensVendaPendentes] = await db.query(`
        SELECT id, ticker, quantidade, preco_referencia
        FROM ordem_venda
        WHERE fk_usuario_id = ? AND executada = 0
        `, [idUsuario]);
    return ordensVendaPendentes;
}

router.get
module.exports = router;
