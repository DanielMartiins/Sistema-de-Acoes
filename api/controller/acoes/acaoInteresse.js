const express = require('express');
const router = express.Router();
const auth = require('../../auth/auth.js');
const getConnection = require('../../model/dbConnection.js');
const { obterPrecoMercado, obterPrecoFechamento } = require('../../utils/precoMercado.js');
const { obterMinutoNegociacaoUsuario } = require('../../utils/negociacaoUsuario.js');
const axios = require('axios');

//Listar ações de interesse
router.get('/', async function (req, res) {
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }

    const idUsuario = claims.user_id;
    try {
        const db = await getConnection();
        const [consulta] = await db.query(
            `
            SELECT ticker, ordem 
            FROM acao_interesse
            WHERE fk_usuario_id = ?
            ORDER BY ordem;
            `,
            [idUsuario]
        );

        const minutoNegociacao = await obterMinutoNegociacaoUsuario(idUsuario);

        /*
            Promise.all é usado para fazer as requisições em paralelo ao invés de sequencialmente.
            Como tem cerca de 84 tickers, isso fez uma diferença legal na velocidade de consulta
        no caso em que a conta tem todos os tickers adicionados
        */
        const acoesInteresse = await Promise.all(
            consulta.map((acao) => montarAcaoInteresse(acao, minutoNegociacao))
        );
        res.json(acoesInteresse);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Houve um erro no servidor' });
    }
});

router.post('/adicionar', async function (req, res) {
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }

    const ticker = req.body.ticker;
    const idUsuario = claims.user_id;

    if (!ticker || ticker.trim() === '') {
        res.status(400).json({ message: 'Ticker inválido' });
        return;
    }

    if (!(await acaoExiste(ticker))) {
        res.status(400).json({ message: `O ticker ${ticker} não existe.` });
        return;
    }

    if (await verificaTickerJaAdicionado(idUsuario, ticker)) {
        res.status(400).json({ message: `Ticker ${ticker} já adicionado anteriormente.` });
        return;
    }

    try {
        const db = await getConnection();
        await db.query(
            `
            INSERT INTO acao_interesse(ticker, fk_usuario_id, ordem)
            VALUES (?, ?, ?);
            `,
            [ticker, idUsuario, (await obterQuantidadeAcoesAdicionadas(idUsuario)) + 1]
        );
        res.json({ message: `Ticker ${ticker} adicionado com sucesso` });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Ocorreu uma falha no servidor.' });
    }
});

router.delete('/remover', async function (req, res) {});

router.put('/subir', async function (req, res) {});

router.put('/descer', async function (req, res) {});

async function montarAcaoInteresse(acao, minutoNegociacao) {
    let precoMercado = await obterPrecoMercado(acao.ticker, minutoNegociacao);
    precoMercado = parseFloat(precoMercado.toFixed(4));

    let precoFechamento = await obterPrecoFechamento(acao.ticker);
    precoFechamento = parseFloat(precoFechamento.toFixed(4));

    const variacaoNominal = precoMercado - precoFechamento;
    const variacaoPercentual = ((precoMercado - precoFechamento) / precoFechamento) * 100;

    console.log({
        ticker: acao.ticker,
        precoFechamento: precoFechamento,
        precoAtual: precoMercado,
        minutoNegociacao: minutoNegociacao,
    });

    return {
        ordem: acao.ordem,
        ticker: acao.ticker,
        preco: precoMercado,
        variacaoNominal: parseFloat(variacaoNominal.toFixed(4)),
        variacaoPercentual: parseFloat(variacaoPercentual.toFixed(4)),
    };
}

async function verificaTickerJaAdicionado(idUsuario, ticker) {
    const db = await getConnection();
    const [consulta] = await db.query(
        `
        SELECT ticker FROM acao_interesse
        WHERE fk_usuario_id = ? AND ticker = ?
        `,
        [idUsuario, ticker]
    );
    return consulta.length > 0;
}

async function obterQuantidadeAcoesAdicionadas(idUsuario) {
    const db = await getConnection();
    const [consulta] = await db.query(
        `
        SELECT count(*) as quantidade
        FROM acao_interesse
        WHERE fk_usuario_id = ?
        `,
        [idUsuario]
    );
    return consulta[0].quantidade;
}

async function acaoExiste(ticker) {
    const url = `https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/0.json`;
    let response = await axios.get(url);
    const acoes = response.data;
    const acaoDesejada = acoes.find((acao) => acao.ticker === ticker);

    console.log(acaoDesejada);
    if (!acaoDesejada) return false;
    return true;
}

module.exports = router;
