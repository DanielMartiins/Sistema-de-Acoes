const express = require('express');
const router = express.Router();
const getConnection = require('../model/dbConnection.js');
const { verifyToken } = require('../auth/jwtAuth.js');

router.post('/ordens/compra', async function (req, res) {
    const payload = verifyToken(req, res);
    if (!payload || !payload.user_id) {
        return res.status(401).json({ mensagem: 'Token inválido ou ausente.' });
    }

    const userId = payload.user_id;
    const { ticker, quantidade, modo, preco_referencia } = req.body;

    // Validação de dados
    if (!ticker || typeof ticker !== 'string' || ticker.length > 50) {
        return res.status(400).json({ mensagem: 'Ticker inválido.' });
    }

    if (!quantidade || typeof quantidade !== 'number' || quantidade <= 0) {
        return res.status(400).json({ mensagem: 'Quantidade inválida.' });
    }

    if (!['limite', 'mercado'].includes(modo)) {
        return res.status(400).json({ mensagem: 'Modo deve ser "limite" ou "mercado".' });
    }

    const modoInt = modo === 'limite' ? 1 : 0;

    if (modoInt === 1 && (typeof preco_referencia !== 'number' || preco_referencia <= 0)) {
        return res.status(400).json({ mensagem: 'Preço de referência inválido para modo limite.' });
    }

    try {
        const db = await getConnection();

        const agora = new Date();

        await db.query(
            `
            INSERT INTO ordem_compra 
                (fk_usuario_id, data_hora, ticker, quantidade, modo, preco_referencia, executada, preco_execucao, data_hora_execucao)
            VALUES (?, ?, ?, ?, ?, ?, false, NULL, NULL);
            `,
            [
                userId,
                agora,
                ticker,
                quantidade,
                modoInt,
                modoInt === 1 ? preco_referencia : null
            ]
        );

        await db.end();

        res.status(201).json({ mensagem: 'Ordem de compra registrada com sucesso.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ mensagem: 'Erro ao registrar ordem de compra.' });
    }
});

router.put('/ordens/compra/:id/executar', async function (req, res) {
    const payload = verifyToken(req, res);
    if (!payload || !payload.user_id) {
        return res.status(401).json({ mensagem: 'Token inválido ou ausente.' });
    }

    const userId = payload.user_id;
    const ordemId = parseInt(req.params.id);
    const { preco_execucao } = req.body;

    if (!ordemId || ordemId <= 0) {
        return res.status(400).json({ mensagem: 'ID de ordem inválido.' });
    }

    if (!preco_execucao || typeof preco_execucao !== 'number' || preco_execucao <= 0) {
        return res.status(400).json({ mensagem: 'Preço de execução inválido.' });
    }

    try {
        const db = await getConnection();

        // Verifica se a ordem existe, pertence ao usuário, e ainda não foi executada
        const resultado = await db.query(
            `SELECT * FROM ordem_compra WHERE id = ? AND fk_usuario_id = ?;`,
            [ordemId, userId]
        );

        const ordem = resultado[0][0];
        if (!ordem) {
            await db.end();
            return res.status(404).json({ mensagem: 'Ordem não encontrada.' });
        }

        if (ordem.executada) {
            await db.end();
            return res.status(400).json({ mensagem: 'Ordem já executada.' });
        }

        const agora = new Date();

        await db.query(
            `
            UPDATE ordem_compra
            SET executada = true,
                preco_execucao = ?,
                data_hora_execucao = ?
            WHERE id = ?;
            `,
            [preco_execucao, agora, ordemId]
        );

        await db.end();
        res.json({ mensagem: 'Ordem de compra executada com sucesso.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ mensagem: 'Erro ao executar ordem de compra.' });
    }
});

router.get('/ordens/compra', async function (req, res) {
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
module.exports = router;
