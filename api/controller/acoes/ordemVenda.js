const express = require('express');
const router = express.Router();
const auth = require('../../auth/auth.js');
const getConnection = require('../../model/dbConnection.js');
const axios = require('axios');
const { obterMinutoNegociacaoUsuario } = require('../../utils/negociacaoUsuario.js');
const { obterPrecoMercado } = require('../../utils/precoMercado.js');

const {
    MODO_OPERACAO_MERCADO,
    MODO_OPERACAO_LIMITADA,
} = require('../../constants/modoOperacao.js');

//Registrar ordem de venda a preço de mercado
router.post('/mercado', async function (req, res) {
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }

    let idUsuario = claims.user_id;
    let ticker = req.body.ticker;
    let quantidade = parseInt(req.body.quantidade);

    if (!ticker || ticker.trim() === '') {
        res.status(400).json({ message: 'Ticker inválido.' });
        return;
    }

    if (!quantidade || quantidade <= 0) {
        res.status(400).json({ message: 'Quantidade inválida.' });
        return;
    }

    if (!(await possuiQuantidadeSuficiente(ticker, quantidade, idUsuario))) {
        res.status(400).json({
            message: 'O usuário não possui a quantidade suficiente para realizar a ordem de venda',
        });
        return;
    }

    try {
        const minutoNegociacao = await obterMinutoNegociacaoUsuario(idUsuario);
        const precoAtual = await obterPrecoMercado(ticker, minutoNegociacao);
        let db = await getConnection();

        const [insercaoOrdemVenda] = await db.query(
            ` 
            CALL registrar_ordem_venda(?, ?, ?, ?, ?);
            `,
            [idUsuario, ticker, MODO_OPERACAO_MERCADO, quantidade, precoAtual]
        );
        const idOrdemVenda = insercaoOrdemVenda[0][0].insertId;

        //Executar a ordem de venda
        await executarOrdemVenda(idUsuario, idOrdemVenda, precoAtual);

        res.json({
            message: 'Ordem registrada e executada com sucesso.',
        });
        await db.end();
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Ocorreu um erro no servidor' });
    }
});

//Registrar ordem de venda limitada a um certo valor
router.post('/limitada', async function (req, res) {
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }

    let idUsuario = claims.user_id;
    let ticker = req.body.ticker;
    let quantidade = parseInt(req.body.quantidade);
    let precoReferencia = parseFloat(req.body.precoReferencia);

    if (!ticker || ticker.trim() === '') {
        res.status(400).json({ message: 'Ticker inválido.' });
        return;
    }

    if (!quantidade || quantidade <= 0) {
        res.status(400).json({ message: 'Quantidade inválida.' });
        return;
    }

    if (!precoReferencia || precoReferencia <= 0) {
        res.status(400).json({ message: 'Preço de venda inválido' });
        return;
    }

    if (!(await possuiQuantidadeSuficiente(ticker, quantidade, idUsuario))) {
        res.status(400).json({
            message: 'O usuário não possui a quantidade suficiente para realizar a ordem de venda',
        });
        return;
    }

    try {
        const minutoNegociacao = await obterMinutoNegociacaoUsuario(idUsuario);
        const precoAtual = await obterPrecoMercado(ticker, minutoNegociacao);
        let db = await getConnection();

        //Registrar a ordem de venda no banco de dados
        const [insercaoOrdemVenda] = await db.query(
            ` 
            CALL registrar_ordem_venda(?, ?, ?, ?, ?);
            `,
            [idUsuario, ticker, MODO_OPERACAO_LIMITADA, quantidade, precoReferencia]
        );

        const idOrdemVenda = insercaoOrdemVenda[0][0].insertId;

        //Se o preço já estiver igual ou acima do desejado, já executa a ordem de venda
        if (await atingiuPrecoDesejadoParaVenda(idUsuario, ticker, precoReferencia)) {
            await executarOrdemVenda(idUsuario, idOrdemVenda, precoAtual);
            res.json({
                message:
                    'Ordem realizada com sucesso. O preço de venda já está igual/acima do desejado e a venda também foi executada.',
            });
        } else res.json({ message: 'Ordem de venda registrada com sucesso.' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Ocorreu um erro no servidor' });
    }
});

async function possuiQuantidadeSuficiente(ticker, quantidadeVenda, idUsuario) {
    let db = await getConnection();
    let consultaQuantidade = await db.query(
        `
        SELECT qtde FROM acao_carteira 
        WHERE fk_usuario_id = ? AND ticker = ? 
        `,
        [idUsuario, ticker]
    );

    if (consultaQuantidade[0].length == 0) return false;

    const quantidadeDisponivelCarteira = consultaQuantidade[0][0].qtde;

    if (quantidadeDisponivelCarteira.length == 0) return false;

    await db.end();
    return quantidadeDisponivelCarteira >= quantidadeVenda;
}

async function executarOrdemVenda(idUsuario, idOrdemVenda, precoExecucao) {
    let db = await getConnection();
    try {
        await db.query(
            `
            CALL executar_ordem_venda(?, ?, ?)
            `,
            [idUsuario, idOrdemVenda, precoExecucao]
        );
    } catch (err) {
        console.log(err);
        throw new Error('Ocorreu um erro no sistema ao executar a venda');
    }
}

async function atingiuPrecoDesejadoParaVenda(idUsuario, ticker, precoReferencia) {
    const minutoNegociacao = await obterMinutoNegociacaoUsuario(idUsuario);
    let response = await axios.get(
        'https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/' +
            minutoNegociacao +
            '.json'
    );

    const precoAcoes = response.data;
    const acaoDesejada = precoAcoes.find((acao) => acao.ticker === ticker);

    if (!acaoDesejada) return false;
    return acaoDesejada.preco >= precoReferencia;
}
module.exports = router;
