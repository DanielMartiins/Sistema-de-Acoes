const express = require('express');
const router = express.Router();
const getConnection = require('../model/dbConnection.js');
const auth = require('../auth/auth.js');

//Mostrar saldo e listar lancamentos da conta corrente
router.get('/', async function (req, res) {
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }

    const idUsuario = claims.user_id;
    const saldo = await obterSaldoUsuario(idUsuario);
    const lancamentosContaCorrente = await obterLancamentosContaCorrente(idUsuario);
    res.json({saldo: saldo, lancamentos : lancamentosContaCorrente});
});

//Depositar um valor na conta corrente
router.post('/depositar', async function (req, res) {
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }

    const idUsuario = claims.user_id;
    const valor = parseInt(req.body.valor);
    const descricao = req.body.descricao;

    const erro = validarEntrada(valor, descricao);
    if (erro) {
        res.status(400).json({ message: erro });
        return;
    }

    try {
        const db = await getConnection();
        await db.query(
            `
            CALL depositar_conta_corrente(?, ?, ?);
            `,
            [idUsuario, valor, JSON.stringify({ descricao: descricao })]
        );
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
    }
    res.json({ message: 'Depósito realizado com sucesso.' });
});

//Debitar um valor na conta corrente
router.post('/debitar', async function (req, res) {
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }

    const idUsuario = claims.user_id;
    const valor = parseInt(req.body.valor);
    const descricao = req.body.descricao;

    const erro = validarEntrada(valor, descricao);
    if (erro) {
        res.status(400).json({ message: erro });
        return;
    }

    const saldoUsuario = await obterSaldoUsuario(idUsuario);
    if (saldoUsuario < valor) {
        res.status(400).json({ message: 'Usuário não possui saldo suficiente.' });
        return;
    }

    try {
        const db = await getConnection();
        await db.query(
            `
            CALL debitar_conta_corrente(?, ?, ?);
            `,
            [idUsuario, valor, JSON.stringify({ descricao: descricao })]
        );
        res.json({ message: 'Débito realizado com sucesso.' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
    }
});

async function obterLancamentosContaCorrente(idUsuario) {
    const db = await getConnection();
    const [consulta] = await db.query(
        `
        SELECT 
            DATE_FORMAT(data_hora, '%d-%m-%Y %H:%i:%s') as data_hora,
            valor, 
            historico
        FROM lancamento_conta_corrente
        WHERE fk_usuario_id = ?
        ORDER BY data_hora
        `,
        [idUsuario]
    );
    return consulta;
}

function validarEntrada(valor, descricao) {
    if (!valor || valor <= 0)
        return 'ERRO: Valor inválido. Insira um valor positivo diferente de zero.';
    if (!descricao || descricao.trim() === '') return 'ERRO: Descricao vazia.';
    return null;
}

async function obterSaldoUsuario(idUsuario) {
    const db = await getConnection();
    const [consulta] = await db.query(
        `
        SELECT saldo FROM usuario
        WHERE id = ?
        `,
        [idUsuario]
    );

    return consulta[0].saldo;
}

module.exports = router;
