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

//Verificar ordens de venda pendentes e executá-las quando o preço é favorável
router.post('/executar', async function (req, res) {
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }

    const idUsuario = claims.user_id;

    try {
        const ordensVendaPendentes = await obterOrdensVendaPendentes(idUsuario);
        const minutoNegociacao = await obterMinutoNegociacaoUsuario(idUsuario);
        let qtdeOrdensExecutadas = 0;
        let ordensExecutadas = [];
        for (const ordemVenda of ordensVendaPendentes) {
            const possuiTickersSuficiente = await possuiQuantidadeSuficiente(
                ordemVenda.ticker,
                ordemVenda.quantidade,
                idUsuario
            );

            const precoAtualTicker = await obterPrecoMercado(ordemVenda.ticker, minutoNegociacao);

            console.log(`${precoAtualTicker} >= ${ordemVenda.precoReferencia}?  `);
            //Se preço é favorável e ele possui os tickers, executar a ordem de venda
            if (possuiTickersSuficiente && precoAtualTicker >= ordemVenda.precoReferencia) {
                await executarOrdemVenda(idUsuario, ordemVenda.id, precoAtualTicker);
                qtdeOrdensExecutadas++;
                ordensExecutadas.push({
                    ticker: ordemVenda.ticker,
                    quantidade: ordemVenda.quantidade,
                    precoExecucao: precoAtualTicker,
                });
                console.log(`Ordem de venda com id ${ordemVenda.id} executada`);
            }
        }
        res.json({
            quantidadeOrdensExecutadas: qtdeOrdensExecutadas,
            ordensExecutadas: ordensExecutadas,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Ocorreu uma falha no servidor.' });
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

//Verifica se o usuário tem ticker suficiente na carteira
async function possuiQuantidadeSuficiente(ticker, quantidadeVenda, idUsuario) {
    const db = await getConnection();
    const consultaQuantidade = await db.query(
        `
        SELECT qtde FROM acao_carteira 
        WHERE fk_usuario_id = ? AND ticker = ? 
        `,
        [idUsuario, ticker]
    );

    if (consultaQuantidade[0].length === 0) return false;

    const quantidadeDisponivelCarteira = consultaQuantidade[0][0].qtde;

    await db.end();
    return quantidadeDisponivelCarteira >= quantidadeVenda;
}

async function registrarOrdemVenda(idUsuario, ticker, modo, quantidade, precoReferencia) {
    const db = await getConnection();

    const [insercaoOrdemVenda] = await db.query(
        `
        CALL registrar_ordem_venda(?, ?, ?, ?, ?);
        `,
        [idUsuario, ticker, modo, quantidade, precoReferencia]
    );

    const idOrdemVenda = insercaoOrdemVenda[0][0].insertId;
    return idOrdemVenda;
}

async function executarOrdemVenda(idUsuario, idOrdemVenda, precoExecucao) {
    const db = await getConnection();
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
    const precoAcaoDesejada = await obterPrecoMercado(ticker, minutoNegociacao);
    return precoAcaoDesejada >= precoReferencia;
}

async function obterOrdensVendaPendentes(idUsuario) {
    const db = await getConnection();
    const [ordensVendaPendentes] = await db.query(
        `
        SELECT id, ticker, quantidade, preco_referencia as precoReferencia
        FROM ordem_venda
        WHERE fk_usuario_id = ? AND executada = 0
        `,
        [idUsuario]
    );
    return ordensVendaPendentes;
}
module.exports = router;
