const express = require('express');
const getConnection = require('../../model/dbConnection');
const { verifyToken } = require('../../auth/auth');
const { obterMinutoNegociacaoUsuario } = require('../../utils/negociacaoUsuario');
const { executarOrdensVenda } = require('../../utils/ordensVenda');
const { executarOrdensCompra } = require('../../utils/ordensCompra');
const router = express.Router();

router.put('/', async function (req, res) {
    const claims = verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado' });
        return;
    }

    const idUsuario = claims.user_id;
    const novoMinuto = parseInt(req.body.novoMinuto);
    const ultimaHoraNegociacao = await obterMinutoNegociacaoUsuario(idUsuario);

    if (!novoMinuto) {
        res.status(400).json({ message: 'Minuto inválido.' });
        return;
    }

    if (novoMinuto <= ultimaHoraNegociacao || novoMinuto > 59) {
        res.status(400).json({
            message: `O minuto deve ser um numero inteiro entre ${
                ultimaHoraNegociacao + 1
            } e 59 (você inseriu ${novoMinuto})`,
        });
        return;
    }

    try {
        //Atualizar hora de negociação
        await atualizaHoraNegociacao(idUsuario, novoMinuto);

        let ordensVendaExecutadas = {
            quantidadeOrdensExecutadas: 0,
            ordensExecutadas: [],
        };
        let ordensCompraExecutadas = {
            quantidadeOrdensExecutadas: 0,
            ordensExecutadas: [],
        };
        let minutoAtual = ultimaHoraNegociacao;

        while (minutoAtual != novoMinuto) {
            //Verificar se há ordens de venda pendentes que estão favoráveis para serem executadas
            console.log('Verificando se é possível executar ordem de venda');
            const vendas = await executarOrdensVenda(req, res);
            if (vendas.quantidadeOrdensExecutadas !== 0) {
                ordensVendaExecutadas.quantidadeOrdensExecutadas +=
                    vendas.quantidadeOrdensExecutadas;
                ordensVendaExecutadas.ordensExecutadas.push(vendas.ordensExecutadas);
            }
            console.log('Retorno:', ordensVendaExecutadas);

            //Verificar se há ordens de compra pendentes que estão favoráveis para serem executadas
            console.log('Verificando se é possível executar ordem de compra');
            const compras = await executarOrdensCompra(req, res);
            if (compras.quantidadeOrdensExecutadas !== 0) {
                ordensCompraExecutadas.quantidadeOrdensExecutadas +=
                    compras.quantidadeOrdensExecutadas;
                ordensCompraExecutadas.ordensExecutadas.push(compras.ordensExecutadas);
            }
            console.log('Retorno:', ordensCompraExecutadas);

            minutoAtual++;
        }
        res.json({
            message: `Hora de negociação atualizada para 14:${novoMinuto
                .toString()
                .padStart(2, '0')} com sucesso.`,
            vendasExecutadas: ordensVendaExecutadas,
            comprasExecutadas: ordensCompraExecutadas,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
    }
});

async function atualizaHoraNegociacao(idUsuario, novoMinuto) {
    const db = await getConnection();
    await db.query(
        `
        UPDATE usuario
        SET ultima_hora_negociacao =
        TIMESTAMP(
            DATE(ultima_hora_negociacao),
            MAKETIME(
                HOUR(ultima_hora_negociacao),
                ?,
                0
            )
        )
        WHERE id = ?;
        `,
        [novoMinuto, idUsuario]
    );
}

module.exports = router;
