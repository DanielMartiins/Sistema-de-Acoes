var express = require('express');
var router = express.Router();
const getConnection = require('../model/dbConnection.js');
const auth = require('../auth/auth.js');
const axios = require('axios');

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

    try {
        let id = claims.user_id;
        let db = await getConnection();

        //Pegar ações da carteira, na tabela acao_carteira do banco de dados
        let query_acao_carteira = await db.query(
            `
            SELECT ticker, qtde, preco_compra, qtde_vendida, preco_venda
            FROM acao_carteira
            WHERE fk_usuario_id = ?
            `,
            id
        );

        //await calcularPerdaOuGanho(query_acao_carteira, id);

        await db.end();
        res.json(query_acao_carteira[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ocorreu um erro no servidor' });
    }
});

//Mecanismo para calcular ganhos do usuário, deixarei de lado por enquanto e farei os outros endpoints
async function calcularPerdaOuGanho(acoes_carteira, usuario_id) {
    let db = await getConnection();
    console.log('Conectou\n');

    let minuto_negociacao = await db.query(
        `
        SELECT MINUTE(ultima_hora_negociacao) as minuto FROM usuario WHERE usuario.id = ?;
        `,
        [usuario_id]
    );
    minuto_negociacao = minuto_negociacao[0].minuto;

    let preco_atual_acoes;
    await axios
        .get(
            'https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/' +
                minuto_negociacao +
                '.json'
        )
        .then((response) => {
            preco_atual_acoes = response.data;
            console.log('Preco atual das ações recuperado');
        })
        .catch((error) => {
            console.error(error);
            return;
        });

    //console.log(preco_atual_acoes);
    if (!preco_atual_acoes)
        throw new Error('Não foi possivel retornar as perdas e os ganhos do usuário');

    const tickersCarteira = new Set(acoes_carteira.map((acao) => acao.ticker));
    preco_atual_acoes = preco_atual_acoes.filter((acao) => tickersCarteira.has(acao.ticker));

    acoes_carteira.forEach(acao => {
        let qtdeVendida = acao.qtde_vendida;
        let precoAtual = preco_atual_acoes.find(p => p.ticker === acao) 
        acao.ganho = acao.preco_venda
    })

    console.log(preco_atual_acoes);
    console.log(acoes_carteira);
}

module.exports = router;
