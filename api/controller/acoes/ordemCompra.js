const express = require('express');
const router = express.Router();
const getConnection = require('../../model/dbConnection.js');
const { verifyToken } = require('../../auth/auth.js');
const { obterMinutoNegociacaoUsuario } = require('../../utils/negociacaoUsuario.js');
const { obterPrecoMercado } = require('../../utils/precoMercado.js');

const {
    MODO_OPERACAO_MERCADO,
    MODO_OPERACAO_LIMITADA,
} = require('../../constants/modoOperacao.js');

// Compra a mercado
router.post('/mercado', async (req, res) => {
    const claims = verifyToken(req, res);
    if (!claims) return res.status(401).json({ message: 'Acesso não autorizado.' });

    const idUsuario = claims.user_id;
    const ticker = req.body.ticker;
    const quantidade = parseInt(req.body.quantidade);

    if (!ticker || ticker.trim() === '') return res.status(400).json({ message: 'Ticker inválido.' });
    if (!quantidade || quantidade <= 0) return res.status(400).json({ message: 'Quantidade inválida.' });

    try {
        const minuto = await obterMinutoNegociacaoUsuario(idUsuario);
        const precoAtual = await obterPrecoMercado(ticker, minuto);

        const db = await getConnection();
        const [resultado] = await db.query(
            `CALL registrar_ordem_compra(?, ?, ?, ?, ?)`,
            [idUsuario, ticker, MODO_OPERACAO_MERCADO, quantidade, precoAtual]
        );

        const idOrdemCompra = resultado[0][0].insertId;

        await executarOrdemCompra(idUsuario, idOrdemCompra, precoAtual);
        await db.end();

        res.json({ message: 'Ordem de compra registrada e executada com sucesso.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao registrar ou executar ordem de compra.' });
    }
});

// Compra limitada
router.post('/limitada', async (req, res) => {
    const claims = verifyToken(req, res);
    if (!claims) return res.status(401).json({ message: 'Acesso não autorizado.' });

    const idUsuario = claims.user_id;
    const ticker = req.body.ticker;
    const quantidade = parseInt(req.body.quantidade);
    const precoReferencia = parseFloat(req.body.precoReferencia);

    if (!ticker || ticker.trim() === '') return res.status(400).json({ message: 'Ticker inválido.' });
    if (!quantidade || quantidade <= 0) return res.status(400).json({ message: 'Quantidade inválida.' });
    if (!precoReferencia || precoReferencia <= 0) return res.status(400).json({ message: 'Preço de referência inválido.' });

    try {
        const minuto = await obterMinutoNegociacaoUsuario(idUsuario);
        const precoAtual = await obterPrecoMercado(ticker, minuto);

        const db = await getConnection();
        const [resultado] = await db.query(
            `CALL registrar_ordem_compra(?, ?, ?, ?, ?)`,
            [idUsuario, ticker, MODO_OPERACAO_LIMITADA, quantidade, precoReferencia]
        );

        const idOrdemCompra = resultado[0][0].insertId;

        if (precoAtual <= precoReferencia) {
            await executarOrdemCompra(idUsuario, idOrdemCompra, precoAtual);
            res.json({ message: 'Ordem registrada e executada (preço atual <= referência).' });
        } else {
            res.json({ message: 'Ordem registrada com sucesso.' });
        }

        await db.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao registrar ordem de compra.' });
    }
});

router.get('/', async function (req, res) {
    const payload = verifyToken(req, res);
    if (!payload || !payload.user_id) {
        return res.status(401).json({ mensagem: 'Token inválido ou ausente.' });
    }

    const userId = payload.user_id;

    try {
        const db = await getConnection();

        const resultado = await db.query(
            `
            SELECT id, ticker, quantidade, executada
            FROM ordem_compra
            WHERE fk_usuario_id = ?
            ORDER BY data_hora DESC;
            `,
            [userId]
        );

        await db.end();
        res.json(resultado[0]); // resultado[0] contém as linhas retornadas
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensagem: 'Erro ao listar ordens de compra.' });
    }
});
// Execução da ordem de compra
async function executarOrdemCompra(idUsuario, idOrdemCompra, precoExecucao) {
    let db = await getConnection();
    try {
        await db.query(`CALL executar_ordem_compra(?, ?, ?)`, [
            idUsuario,
            idOrdemCompra,
            precoExecucao,
        ]);
        await db.end();
    } catch (err) {
        console.error(err);
        throw new Error('Erro ao executar ordem de compra.');
    }
}


module.exports = router;
