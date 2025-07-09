const { verifyToken } = require('../auth/auth');
const { MODO_OPERACAO_LIMITADA } = require('../constants/modoOperacao');
const getConnection = require('../model/dbConnection');
const { obterMinutoNegociacaoUsuario } = require('./negociacaoUsuario');
const { obterPrecoMercado } = require('./precoMercado');

// Verificar ordens de compra pendentes e executá-las quando o preço está favorável
async function executarOrdensCompra(req, res) {
    const claims = verifyToken(req, res);
    if (!claims) {
        return res.status(401).json({ message: 'Acesso não autorizado.' });
    }

    const idUsuario = claims.user_id;

    try {
        const ordensCompraPendentes = await obterOrdensCompraPendentes(idUsuario);
        const minutoNegociacao = await obterMinutoNegociacaoUsuario(idUsuario);

        let qtdeOrdensExecutadas = 0;
        let ordensExecutadas = [];

        for (const ordemCompra of ordensCompraPendentes) {
            const precoAtualTicker = await obterPrecoMercado(ordemCompra.ticker, minutoNegociacao);
            console.log(`${precoAtualTicker} <= ${ordemCompra.precoReferencia}?`);
            // Se o preço atual for favorável, executa a ordem
            if (precoAtualTicker <= ordemCompra.precoReferencia) {
                if (!(await possuiSaldoSuficiente(idUsuario, precoAtualTicker))) continue;
                try {
                    await executarOrdemCompra(idUsuario, ordemCompra.id, precoAtualTicker);
                    qtdeOrdensExecutadas++;
                    ordensExecutadas.push({
                        ticker: ordemCompra.ticker,
                        quantidade: ordemCompra.quantidade,
                        precoExecucao: precoAtualTicker,
                    });
                    console.log(`Ordem de compra com id ${ordemCompra.id} executada`);
                } catch (err) {
                    console.log(`Erro ao executar ordem ${ordemCompra.id}: ${err.message}`);
                }
            }
        }

        return {
            quantidadeOrdensExecutadas: qtdeOrdensExecutadas,
            ordensExecutadas: ordensExecutadas,
        };
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Ocorreu uma falha no servidor.' });
    }
}

// Executa uma ordem de compra específica
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
        throw new Error('Ocorreu um erro ao executar a ordem de compra.');
    }
}

// Obter ordens de compra ainda não executadas de um usuário
async function obterOrdensCompraPendentes(idUsuario) {
    const db = await getConnection();
    const [ordensCompraPendentes] = await db.query(
        `
        SELECT id, ticker, quantidade, preco_referencia as precoReferencia
        FROM ordem_compra
        WHERE fk_usuario_id = ? AND executada = 0 AND modo = ? -- apenas limitadas
        `,
        [idUsuario, MODO_OPERACAO_LIMITADA]
    );
    await db.end();
    return ordensCompraPendentes;
}

async function possuiSaldoSuficiente(idUsuario, preco) {
    const db = await getConnection();
    const [consulta] = await db.query(
        `
        SELECT saldo FROM usuario
        WHERE id = ?
        `,
        [idUsuario]
    );
    await db.end();
    return consulta[0].saldo >= preco;
}

module.exports = {
    executarOrdensCompra,
    executarOrdemCompra,
    obterOrdensCompraPendentes,
};
