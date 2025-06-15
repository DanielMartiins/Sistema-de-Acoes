var express = require('express');
var router = express.Router();
const getConnection = require('../model/dbConnection.js');
const auth = require('../auth/auth.js');

/* Endpoint para listar a carteira
 * NÃO ESTÁ COMPLETO!
 * Preciso mostrar algumas informações que ainda não estou mostrando: Mecanismo de atualização de preços, ganhos e perdas do usuário, etc
 */
router.get('/', async function (req, res) {
    const claims = auth.verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }
    let id = claims.user_id;
    let db;
    try {
        db = await getConnection();
        let queryString =
            'SELECT ticker, qtde, preco_compra, qtde_vendida, preco_venda FROM acao_carteira WHERE fk_usuario_id = ?';
        let data = [id];

        let result = await db.query(queryString, data);
        await db.end();
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ocorreu um erro no servidor' });
    }
});

module.exports = router;
