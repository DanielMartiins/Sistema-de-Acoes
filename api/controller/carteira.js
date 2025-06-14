var express = require('express');
var router = express.Router();
const getConnection = require('../config/db.js');


/* 
* NÃO ESTÁ COMPLETO! 
* Precisamos implementar a parte de login para que faça a autenticação nesse endpoint. Fiz
desse jeito mais na intenção de já fazer a consulta
* Também preciso mostrar algumas informações que ainda não estou mostrando: Mecanismo de atualização de preços, ganhos e perdas do usuário, etc
*/
router.get('/listaCarteira', async function(req,res) {
    const id = req.query.id;
    let db;
    try {
        db = await getConnection();
        let queryString = "SELECT * FROM acao_carteira WHERE fk_usuario_id = ?"
        let data = [id];

        let result = await db.query(queryString, data);
        await db.end();
        res.json(result);
    } catch (err) {
        res.status(400).json(err);
    }
});

module.exports = router;