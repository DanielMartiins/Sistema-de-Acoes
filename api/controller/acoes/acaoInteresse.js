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

//Adicionar ação na lista de interesse
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

//Remover ação da lista de interesse
router.delete('/remover', async function (req, res) {
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }

    const idUsuario = claims.user_id;
    const ordemAcao = req.body.ordemAcao;
    const qtdeAcoesAdicionadas = await obterQuantidadeAcoesAdicionadas(idUsuario)

    
    if (qtdeAcoesAdicionadas == 0) {
        res.status(400).json({ message: `A lista de ações está vazia.` });
        return;
    }

    if (!ordemAcao || ordemAcao <= 0 || ordemAcao > qtdeAcoesAdicionadas)
        return res.status(400).json({message: `Ordem inválida`})

    try {
        const db = await getConnection();
        //Remover ação da lista de ações de interesse
        await db.query(
            `
            DELETE FROM acao_interesse
            WHERE fk_usuario_id = ? AND ordem = ?
            `,
            [idUsuario, ordemAcao]
        );

        await reordenarAcoesInteresse(idUsuario);

        res.json({
            message: `Ação removida da lista de ações de interesse com sucesso.`,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
    }
});

router.put('/trocarOrdem', async function (req, res) {
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }

    const idUsuario = claims.user_id;
    const ordemAcao1 = parseInt(req.body.ordemAcao1);
    const ordemAcao2 = parseInt(req.body.ordemAcao2);
    const quantidadeAcoesAdicionadas = await obterQuantidadeAcoesAdicionadas(idUsuario);

    if (quantidadeAcoesAdicionadas <= 1) {
        res.status(400).json({ message: 'O usuário possui no máximo uma ação na lista.' });
        return;
    }

    if (
        !ordemAcao1 ||
        !ordemAcao2 ||
        ordemAcao1 <= 0 ||
        ordemAcao1 > quantidadeAcoesAdicionadas ||
        ordemAcao2 <= 0 ||
        ordemAcao2 > quantidadeAcoesAdicionadas ||
        !(ordemAcao1 === ordemAcao2 + 1 || ordemAcao2 === ordemAcao1 + 1)
    ) {
        res.status(400).json({ message: 'Números de ordem inválidos' });
        return;
    }

    try {
        await trocarOrdemAcoes(idUsuario, ordemAcao1, ordemAcao2);
        res.json({ message: 'Ordem das ações trocadas com sucesso' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
    }
});

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

async function reordenarAcoesInteresse(idUsuario) {
    const db = await getConnection();

    await db.query(`SET @nova_ordem = 0;`);

    await db.query(
        `
        UPDATE acao_interesse
        SET ordem = (@nova_ordem := @nova_ordem + 1)
        WHERE fk_usuario_id = ?
        ORDER BY ordem;
        `,
        [idUsuario]
    );
}

async function trocarOrdemAcoes(idUsuario, ordem1, ordem2) {
    const db = await getConnection();
    await db.query(
        `
    CALL trocar_ordem_acoes_interesse(?, ?, ?);
    `,
        [idUsuario, ordem1, ordem2]
    );
}

module.exports = router;
