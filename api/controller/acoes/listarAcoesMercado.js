const express = require('express');
const router = express.Router();
const axios = require('axios');
const { verifyToken } = require('../../auth/auth');
const { obterMinutoNegociacaoUsuario } = require('../../utils/negociacaoUsuario');

router.get('/', async function(req, res){
    const claims = verifyToken(req, res);
    if (!claims) {
        res.status(401).json({message: 'Acesso não autorizado.'});
        return;
    }

    const idUsuario = claims.user_id;
    const minutoNegociacao = await obterMinutoNegociacaoUsuario(idUsuario);

    const url = `https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/${minutoNegociacao}.json`;
    await axios.get(url).then((response) => {
        res.json(response.data);
    }).catch((err) => {
        const status = err.response?.status || 502;
        res.status(status).json({message: 'Não foi possível listar as ações do mercado.'})
    });
})

module.exports = router;