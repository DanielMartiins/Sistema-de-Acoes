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

    let db;
    try {
        const minuto = await obterMinutoNegociacaoUsuario(idUsuario);
        const precoAtual = await obterPrecoMercado(ticker, minuto);
        const possuiSaldo = await possuiSaldoSuficiente(idUsuario, precoAtual);
        if (!possuiSaldo)
            return res.status(400).json({message: "A conta não possui saldo suficiente."});

        db = await getConnection();
        const [resultado] = await db.query(
            `CALL registrar_ordem_compra(?, ?, ?, ?, ?)`,
            [idUsuario, ticker, MODO_OPERACAO_MERCADO, quantidade, precoAtual]
        );

        const idOrdemCompra = resultado[0][0].insertId;
        await db.end();

        await executarOrdemCompra(idUsuario, idOrdemCompra, precoAtual);

        res.json({ message: 'Ordem de compra registrada e executada com sucesso.' });

    } catch (err) {
        if (db) await db.end();
        console.error(err);

        return res.status(400).json({ message: err.message });
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

    let db;

    try {
        const minuto = await obterMinutoNegociacaoUsuario(idUsuario);
        const precoAtual = await obterPrecoMercado(ticker, minuto);

        db = await getConnection();
        const [resultado] = await db.query(
            `CALL registrar_ordem_compra(?, ?, ?, ?, ?)`,
            [idUsuario, ticker, MODO_OPERACAO_LIMITADA, quantidade, precoReferencia]
        );

        const idOrdemCompra = resultado[0][0].insertId;
        await db.end();
        
        if (precoAtual <= precoReferencia) {
            const possuiSaldo = await possuiSaldoSuficiente(idUsuario, precoReferencia);
            console.log(possuiSaldo);
            if (possuiSaldo) {
                await executarOrdemCompra(idUsuario, idOrdemCompra, precoAtual);
                return res.json({ message: 'Ordem registrada e executada (preço atual <= referência).' });
            }
            else return res.json({message: `Ordem registrada. O preço já está igual ou abaixo de ${precoReferencia} (custando ${precoAtual}) porém a conta não possui saldo suficiente. `})
        }

        res.json({ message: 'Ordem registrada com sucesso.' });

    } catch (err) {
        if (db) await db.end();
        console.error(err);

        return res.status(400).json({ message: err.message });
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
    const db = await getConnection();
    try {
        await db.query(`CALL executar_ordem_compra(?, ?, ?)`, [
            idUsuario,
            idOrdemCompra,
            precoExecucao,
        ]);
        await db.end();
    } catch (err) {
        await db.end();
        console.error(err);

        // Verifica se é erro de SQLSTATE 45000
        if (err.sqlState === '45000') {
            throw new Error(err.message); // mensagem da SIGNAL do MySQL
        }

        throw new Error('Erro inesperado ao executar ordem de compra.');
    }
}

async function possuiSaldoSuficiente(idUsuario, preco) {
    const db = await getConnection();
    const [consulta] = await db.query(
        `
        SELECT saldo FROM usuario
        WHERE id = ?
        `, [idUsuario]
    )

    return consulta[0].saldo >= preco;
}

module.exports = router;
