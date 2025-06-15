var express = require('express');
var router = express.Router();

const config = require('../config/config.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getConnection = require('../model/dbConnection.js');

//Criar conta
router.post('/conta', async function(req, res){
    var email = req.body.email;
    var senha = req.body.senha;
    var senhaRepetida = req.body.senhaRepetida;
    var senha_hash = await bcrypt.hash(senha, 10);

    /*
    * OBS: Ainda precisa fazer toda a verificação para ver se os dados inseridos na requisição são válidos!!! 
    * Também precisar fazer o que o prof pediu de mostrar 10 itens aleatórios na lista do usuário recém criado
    * O registro de usuário está funcional
    */

    try {
        var db = await getConnection();    
        var usuario = await db.query(`
                INSERT INTO usuario (email, senha_hash, numero_falhas_login, ultima_hora_negociacao) 
                VALUES (?, ?, 0, '14:00:00');
            `, [email, senha_hash]);
        res.json({message: 'O usuário foi registrado.'});
        await db.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Erro no servidor ao criar conta'});
    }
    
});

module.exports = router;