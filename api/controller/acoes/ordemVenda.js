const express = require('express');
const router = express.Router();
const auth = require('../../auth/auth.js');
const getConnection = require('../../model/dbConnection.js');
const { MODO_OPERACAO_MERCADO, MODO_OPERACAO_LIMITADA } = require('../../constants/modoOperacao.js');
router.post('/registrar', async function(req, res) {
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({message: "Acesso não autorizado."})
    }

    let ticker = req.body.ticker;
    let quantidade = req.body.quantidade;
    let modo = req.body.modo;
    

    let db = await getConnection();

});