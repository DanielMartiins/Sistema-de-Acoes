var express = require('express');
var router = express.Router();
const getConnection = require('../model/dbConnection.js');
const auth = require('../auth/auth.js');
const axios = require('axios');
const { obterMinutoNegociacaoUsuario } = require('../utils/negociacaoUsuario.js');
const { obterPrecoMercado } = require('../utils/precoMercado.js');

//Listar carteira
router.get('/', async function (req, res) {
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }

    try {
        let idUsuario = claims.user_id;
        let db = await getConnection();

        //Pegar ações da carteira, na tabela acao_carteira do banco de dados
        const [consulta] = await db.query(
            `
            SELECT 
                ticker, 
                preco_compra as precoCompra, 
                preco_venda as precoVenda,
                qtde, 
                qtde_vendida as qtdeVendida
            FROM acao_carteira
            WHERE fk_usuario_id = ?
            `,
            [idUsuario]
        ); 

        const minutoNegociacao = await obterMinutoNegociacaoUsuario(idUsuario);
        const acoesCarteira = await Promise.all(
            consulta.map((acaoCarteira) =>
                montarResultadoFinanceiro(acaoCarteira, minutoNegociacao)
            )
        );
        res.json(acoesCarteira);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ocorreu um erro no servidor' });
    }
});

//Calcular ganho/perda para uma ação da carteira
async function montarResultadoFinanceiro(acaoCarteira, minutoNegociacao) {
    const precoAtualTicker = await obterPrecoMercado(acaoCarteira.ticker, minutoNegociacao);
    const resultadoFinanceiro = acaoCarteira.qtde * (precoAtualTicker - acaoCarteira.precoCompra);
    return {
        ticker: acaoCarteira.ticker,
        precoMedioCompra: acaoCarteira.precoCompra,
        precoMedioVenda: acaoCarteira.precoVenda,
        qtde: acaoCarteira.qtde,
        qtdeVendida: acaoCarteira.qtdeVendida,
        resultado: parseFloat(resultadoFinanceiro.toFixed(4)),
    };
}


module.exports = router;
