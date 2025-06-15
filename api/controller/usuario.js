var express = require('express');
var router = express.Router();

const config = require('../config/config.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getConnection = require('../model/dbConnection.js');

//Criar conta
/*
 * OBS: Ainda precisa fazer toda a verificação para ver se os dados inseridos na requisição são válidos!!!
 * Também precisar fazer o que o prof pediu de mostrar 10 itens aleatórios na lista do usuário recém criado
 * O registro de usuário está funcional
 */
router.post('/criarConta', async function (req, res) {
    var email = req.body.email;
    var senha = req.body.senha;
    var senhaRepetida = req.body.senhaRepetida;
    var senha_hash = await bcrypt.hash(senha, 10);
    var db = await getConnection();
    const resultado = await db.query(
        'SELECT email FROM usuario WHERE email = ?;',
        [email]
    );


    let usuarioEmail = null;
    if (resultado) usuarioEmail = resultado;

    if (usuarioEmail) {
        res.status(400).json({message: "Já existe um usuário registrado com este e-mail."});
        return;
    }

    if (!verificaEmailValido(email)) {
        return res.status(400).json({ message: 'Email inválido.' });
    }

    if (!verificaSenhaValida(senha)) {
        return res.status(400).json({ message: 'Senha inválida. Deve conter ao menos 8 caracteres alfanuméricos.' });
    }

    if (senha !== senhaRepetida) {
        return res.status(400).json({ message: 'As senhas não coincidem.' });
    }

    try {
        var usuario = await db.query(
            `
                INSERT INTO usuario (email, senha_hash, numero_falhas_login, ultima_hora_negociacao) 
                VALUES (?, ?, 0, '14:00:00');
            `,
            [email, senha_hash]
        );
        res.json({ message: 'O usuário foi registrado.' });
        await db.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro no servidor ao criar conta' });
    }
});

//Realizar login
/*
 * OBS: Ainda precisa fazer toda a verificação para ver se os dados inseridos na requisição são válidos!!!
 */
router.post('/login', async function (req, res) {
    var email = req.body.email;
    var senha = req.body.senha;

    
    if (!verificaEmailValido(email)) {
        return res.status(400).json({ message: 'Email inválido.' });
    }

    try {
        var db = await getConnection();

        var usuario = await db.query(
            `SELECT usuario.id, usuario.email, senha_hash, numero_falhas_login 
            FROM usuario 
            WHERE usuario.email = ?;`,
            [email]
        );
        usuario = usuario[0];
        if (!usuario) {
            res.status(400).json('Dados inválidos.');
            return;
        }
        var senhaCorreta = bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaCorreta) {
            await db.query(
                `UPDATE usuario 
                SET numero_falhas_login = numero_falhas_login + 1
                WHERE id = ?;
                `,
                [usuario.id]
            );
            res.status(400).json('Dados inválidos.');
            return;
        } else if (senhaCorreta && usuario.numero_falhas_login > 0) {
            await db.query(
                `UPDATE usuario 
                SET numero_falhas_login = 0
                WHERE id = ?;
                `,
                [usuario.id]
            );
        }

        const token = jwt.sign(
            { user_id: usuario.id, email: usuario.email },
            config.auth.tokenKey,
            { expiresIn: '2h' }
        );
        res.json({ message: 'Login bem sucedido', token });
        await db.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro no servidor ao logar' });
    }
});

//Logout
router.post('/logout', function (req, res) {
    res.status(204).send();
});


//
// Verifica se um e-mail é válido
//
function verificaEmailValido(email) {
    if (!email) {
        return false;
    }
    
    return /^[A-Za-z0-9._%-]+@([A-Za-z0-9-].)+[A-Za-z]{2,4}$/.test(email);
}

function verificaSenhaValida(senha) {
    if (!senha) {
        return false;
    }

    if (senha.length < 8) {
        return false;
    }
    
    return /.*[a-zA-Z].*$/.test(senha) && /.*[0-9].*$/.test(senha);
}
module.exports = router;
