const express = require('express');
const router = express.Router();
const auth = require('../../auth/auth.js');
const getConnection = require('../../model/dbConnection.js');
const { obterMinutoNegociacaoUsuario } = require('../../utils/negociacaoUsuario.js');
const { obterPrecoMercado } = require('../../utils/precoMercado.js');

const {
    MODO_OPERACAO_MERCADO,
    MODO_OPERACAO_LIMITADA,
} = require('../../constants/modoOperacao.js');
const { possuiQuantidadeSuficiente, executarOrdemVenda } = require('../../utils/ordensVenda.js');

//Listar ordens de venda realizadas pelo usuario
router.get('/', async function (req, res) {
    const db = await getConnection();
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }

    const idUsuario = claims.user_id;
    const [listaOrdensVenda] = await db.query(
        `
        SELECT
            ticker,
            quantidade,
            DATE_FORMAT(data_hora, '%d-%m-%Y %H:%i:%s') AS dataHoraRegistro,
            preco_referencia AS precoReferencia,
            executada,
            preco_execucao as precoExecucao,
            IF(
                executada = 1,
                DATE_FORMAT(data_hora_execucao, '%d-%m-%Y %H:%i:%s'),
                null
            ) AS dataHoraExecucao
        FROM ordem_venda
        WHERE fk_usuario_id = ?;
        `,
        [idUsuario]
    );

    await db.end();
    res.json(listaOrdensVenda);
});

//Registrar ordem de venda a preço de mercado
router.post('/mercado', async function (req, res) {
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }

    const idUsuario = claims.user_id;
    const ticker = req.body.ticker;
    const quantidade = parseInt(req.body.quantidade);
    const erroEntrada = await validarEntrada(
        idUsuario,
        ticker,
        quantidade,
        MODO_OPERACAO_MERCADO,
        null
    );

    if (erroEntrada) {
        res.status(400).json({ message: erroEntrada });
        return;
    }

    try {
        const minutoNegociacao = await obterMinutoNegociacaoUsuario(idUsuario);
        const precoAtual = await obterPrecoMercado(ticker, minutoNegociacao);

        //Registrar a ordem de venda no banco de dados
        const idOrdemVenda = await registrarOrdemVenda(
            idUsuario,
            ticker,
            MODO_OPERACAO_MERCADO,
            quantidade,
            precoAtual
        );

        //Executar a ordem de venda imediatamente
        await executarOrdemVenda(idUsuario, idOrdemVenda, precoAtual);

        res.json({ message: 'Ordem registrada e executada com sucesso.' });
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

    const idUsuario = claims.user_id;
    const ticker = req.body.ticker;
    const quantidade = parseInt(req.body.quantidade);
    const precoReferencia = parseFloat(req.body.precoReferencia);
    const erroEntrada = await validarEntrada(
        idUsuario,
        ticker,
        quantidade,
        MODO_OPERACAO_LIMITADA,
        precoReferencia
    );

    if (erroEntrada) {
        res.status(400).json({ message: erroEntrada });
        return;
    }

    try {
        const minutoNegociacao = await obterMinutoNegociacaoUsuario(idUsuario);
        const precoAtual = await obterPrecoMercado(ticker, minutoNegociacao);

        //Registrar a ordem de venda no banco de dados
        const idOrdemVenda = await registrarOrdemVenda(
            idUsuario,
            ticker,
            MODO_OPERACAO_LIMITADA,
            quantidade,
            precoReferencia
        );

        //Se o preço já estiver igual ou acima do desejado, já executa a ordem de venda
        if (await atingiuPrecoDesejadoParaVenda(idUsuario, ticker, precoReferencia)) {
            await executarOrdemVenda(idUsuario, idOrdemVenda, precoAtual);
            res.json({
                message:
                    'Ordem realizada com sucesso. O preço de venda já está igual/acima do desejado e, portanto, a venda também foi executada.',
            });
        } else res.json({ message: 'Ordem de venda registrada com sucesso.' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Ocorreu um erro no servidor' });
    }
});

//Validação das entrada recebidas na requisição para realizar registro de venda
async function validarEntrada(idUsuario, ticker, quantidade, modo, precoReferencia) {
    if (!ticker || ticker.trim() === '') return 'Ticker inválido.';

    if (!quantidade || quantidade <= 0) return 'Quantidade inválida.';

    if (modo === MODO_OPERACAO_LIMITADA && (!precoReferencia || precoReferencia <= 0))
        return 'Preço de venda inválido.';

    if (!(await possuiQuantidadeSuficiente(ticker, quantidade, idUsuario)))
        return 'O usuário não possui a quantidade suficiente para realizar a ordem de venda';
    return null;
}

async function registrarOrdemVenda(idUsuario, ticker, modo, quantidade, precoReferencia) {
    const db = await getConnection();

    const [insercaoOrdemVenda] = await db.query(
        `
        CALL registrar_ordem_venda(?, ?, ?, ?, ?);
        `,
        [idUsuario, ticker, modo, quantidade, precoReferencia]
    );

    await db.end();
    const idOrdemVenda = insercaoOrdemVenda[0][0].insertId;
    return idOrdemVenda;
}

async function atingiuPrecoDesejadoParaVenda(idUsuario, ticker, precoReferencia) {
    const minutoNegociacao = await obterMinutoNegociacaoUsuario(idUsuario);
    const precoAcaoDesejada = await obterPrecoMercado(ticker, minutoNegociacao);
    return precoAcaoDesejada >= precoReferencia;
}


module.exports = router;
