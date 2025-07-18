var express = require('express');
var router = express.Router();

const config = require('../config/config.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getConnection = require('../model/dbConnection.js');
const crypto = require('crypto');
const { verifyToken } = require('../auth/auth.js');
const { enviarEmail } = require('../utils/mailer.js');
const axios = require('axios');
/* //Criar conta
 * Agora as 10 ações estão sendo geradas corretamente
 *
 */
router.post('/criarConta', async function (req, res) {
    var email = req.body.email;
    var senha = req.body.senha;
    var senhaRepetida = req.body.senhaRepetida;
    var senha_hash = await bcrypt.hash(senha, 10);
    var db = await getConnection();

    var usuarioEmail = await db.query('SELECT email FROM usuario WHERE email = ?;', [email]);
    if (usuarioEmail[0].length > 0) {
        res.status(400).json({ message: 'Já existe um usuário registrado com este e-mail.' });
        return;
    }

    if (!verificaEmailValido(email)) {
        return res.status(400).json({ message: 'Email inválido.' });
    }

    if (!verificaSenhaValida(senha)) {
        return res
            .status(400)
            .json({ message: 'Senha inválida. Deve conter ao menos 8 caracteres alfanuméricos.' });
    }

    if (senha !== senhaRepetida) {
        return res.status(400).json({ message: 'As senhas não coincidem.' });
    }

    try {
        var [usuario] = await db.query(
            `
                INSERT INTO usuario (email, senha_hash, saldo, numero_falhas_login, ultima_hora_negociacao)
                VALUES (?, ?, 0, 0, CONCAT(DATE(NOW()), ' 14:00:00'));
            `,
            [email, senha_hash],
        );
        await gerarAçõesInteresse(usuario.insertId);
        res.json({ message: 'O usuário foi registrado.' });
        await db.end();
    } catch (err) {
        await db.end();
        console.error(err);
        res.status(500).json({ message: 'Erro no servidor ao criar conta' });
    }
});

//Realizar login
router.post('/login', async function (req, res) {
    var email = req.body.email;
    var senha = req.body.senha;

    if (!verificaEmailValido(email)) {
        return res.status(400).json({ message: 'Formato de email inválido.' });
    }

    try {
        var db = await getConnection();

        var usuario = await db.query(
            `SELECT usuario.id, usuario.email, senha_hash, numero_falhas_login
            FROM usuario
            WHERE usuario.email = ?;`,
            [email],
        );
        usuario = usuario[0][0];
        if (!usuario) {
            res.status(400).json({message: 'Email ou senha incorretos.'});
            return;
        }
        var senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaCorreta) {
            await db.query(
                `UPDATE usuario
                SET numero_falhas_login = numero_falhas_login + 1
                WHERE id = ?;
                `,
                [usuario.id],
            );
            res.status(400).json({ message: 'Email ou senha incorretos.'});
            return;
        } else if (senhaCorreta && usuario.numero_falhas_login > 0) {
            await db.query(
                `UPDATE usuario
                SET numero_falhas_login = 0
                WHERE id = ?;
                `,
                [usuario.id],
            );
        }

        const token = jwt.sign(
            { user_id: usuario.id, email: usuario.email },
            config.auth.tokenKey,
            { expiresIn: '2h' },
        );
        await db.end();
        res.json({ message: 'Login bem sucedido', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro no servidor ao logar' });
    }
});

//Logout
router.post('/logout', function (req, res) {
    res.status(204).send();
});
//Recuperação/Redefinição de senha (A página acessada após interagir com o link enviado por email)
router.post('/senha/recuperar', async function (req, res) {
    const email = req.query.email;
    const token = req.query.token;
    const novaSenha = req.body.novaSenha;
    console.log(email);
    // Validação básica dos dados
    if (!verificaEmailValido(email)) {
        return res.status(400).json({ message: 'Email inválido.' });
    }

    if (!verificaSenhaValida(novaSenha)) {
        return res.status(400).json({
            message: 'Senha inválida. Deve conter ao menos 8 caracteres, letras e números.',
        });
    }

    try {
        const db = await getConnection();

        // Verifica se o token existe e ainda está válido
        const [resultado] = await db.query(
            `
            SELECT id, data_token_rec_senha
            FROM usuario
            WHERE email = ? AND token_rec_senha = ?;
            `,
            [email, token],
        );

        const usuario = resultado[0];

        if (!usuario) {
            await db.end();
            return res.status(400).json({ message: 'Token ou email inválido.' });
        }

        // Verifica validade temporal do token (ex: 1h de validade)
        const agora = new Date();
        const dataToken = new Date(usuario.data_token_rec_senha);
        const umaHora = 60 * 60 * 1000;

        if (agora - dataToken > umaHora) {
            await db.end();
            return res.status(400).json({ message: 'Token expirado.' });
        }

        // Atualiza a senha
        const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
        console.log(usuario.id);
        await db.query(
            `
            UPDATE usuario
            SET senha_hash = ?, token_rec_senha = NULL, data_token_rec_senha = NULL
            WHERE id = ?;
            `,
            [novaSenhaHash, usuario.id],
        );

        await db.end();
        res.json({ message: 'Senha atualizada com sucesso.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro no servidor ao recuperar senha.' });
    }
});
//Token de Nova senha

router.post('/senha/token', async function (req, res) {
    const email = req.body.email;

    if (!verificaEmailValido(email)) {
        return res.status(400).json({ message: 'Email inválido.' });
    }

    try {
        const db = await getConnection();

        const resultado = await db.query(`SELECT id FROM usuario WHERE email = ?;`, [email]);

        const usuario = resultado[0][0];
        if (!usuario) {
            await db.end();
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const token = crypto.randomBytes(16).toString('hex');
        const agora = new Date();

        await db.query(
            `UPDATE usuario
             SET token_rec_senha = ?, data_token_rec_senha = ?
             WHERE id = ?;`,
            [token, agora, usuario.id],
        );

        await db.end();

        // Geração do link de recuperação
        const linkRecuperacao = `http://localhost:3000/usuario/senha/recuperar?email=${encodeURIComponent(
            email,
        )}&token=${token}`;

        // Conteúdo do e-mail (HTML ou texto)
        const htmlEmail = `
            <p>Você solicitou a redefinição de sua senha.</p>
            <p>Clique no link abaixo para criar uma nova senha:</p>
            <a href="${linkRecuperacao}">Redefinir senha</a>
            <p>Se você não solicitou, ignore este e-mail.</p>
        `;

        await enviarEmail(email, 'Recuperação de senha - Sistema de Ações', htmlEmail);

        res.json({ message: 'Link de recuperação enviado para o e-mail.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro no servidor ao gerar token.' });
    }
});

//Mudança de senha (quando Logado)
router.put('/senha', async function (req, res) {
    var senhaAtual = req.body.senhaAtual;
    var novaSenha = req.body.novaSenha;

    // Verifica e decodifica o token
    const claims = verifyToken(req, res);
    if (!claims || !claims.user_id) {
        return res.status(401).json({ message: 'Token inválido ou ausente.' });
    }

    const userId = claims.user_id;

    // Valida a nova senha
    if (!verificaSenhaValida(novaSenha)) {
        return res.status(400).json({
            message: 'Nova senha inválida. Deve conter ao menos 8 caracteres, letras e números.',
        });
    }

    try {
        const db = await getConnection();

        const resultado = await db.query(`SELECT senha_hash FROM usuario WHERE id = ? LIMIT 1;`, [
            userId,
        ]);

        const usuario = resultado[0][0];
        if (!usuario) {
            await db.end();
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const senhaConfere = await bcrypt.compare(senhaAtual, usuario.senha_hash);
        if (!senhaConfere) {
            await db.end();
            return res.status(400).json({ message: 'Senha atual incorreta.' });
        }

        const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

        await db.query(`UPDATE usuario SET senha_hash = ? WHERE id = ?;`, [novaSenhaHash, userId]);

        await db.end();
        res.json({ message: 'Senha alterada.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro no servidor ao trocar senha.' });
    }
});
//
// Verifica se um e-mail é válido
//
function verificaEmailValido(email) {
    if (!email) {
        return false;
    }

    return /^[A-Za-z0-9._%-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,4}$/.test(email);
}

//
// Verifica se a senha é válida
//
function verificaSenhaValida(senha) {
    if (!senha) {
        return false;
    }

    if (senha.length < 8) {
        return false;
    }

    return /.*[a-zA-Z].*$/.test(senha) && /.*[0-9].*$/.test(senha);
}

//Gerar as 10 ações para o usuário recém-criado
async function gerarAçõesInteresse(idUsuario) {
    let acoes;

    const url = `https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/0.json`;
    await axios
        .get(url)
        .then((response) => {
            acoes = response.data;
        })
        .catch((err) => {
            console.log(err);
            throw new Error('ERRO: Não foi possivel pegar as ações do mercado');
        });

    const limite = acoes.length;
    let qtdTickersAdicionados = 0;
    let ordem = 1;
    const db = await getConnection();
    while (qtdTickersAdicionados != 10) {
        const aleatorio = Math.floor(Math.random() * limite);
        const [buscaTicker] = await db.query(
            `
            SELECT ticker FROM acao_interesse
            WHERE ticker = ? AND fk_usuario_id = ?
            `,
            [acoes[aleatorio].ticker, idUsuario],
        );

        if (buscaTicker.length !== 0) continue;
        else {
            await db.query(
                `
                INSERT INTO acao_interesse(ticker, ordem, fk_usuario_id)
                VALUES(?, ?, ?)
                `,
                [acoes[aleatorio].ticker, ordem, idUsuario],
            );
            qtdTickersAdicionados++;
            ordem++;
        }
    }
    await db.end();
}
module.exports = router;
