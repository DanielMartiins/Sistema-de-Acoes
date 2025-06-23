const { verifyToken } = require("../auth/auth");
const getConnection = require("../model/dbConnection");
const { obterMinutoNegociacaoUsuario } = require("./negociacaoUsuario");
const { obterPrecoMercado } = require("./precoMercado");

//Verificar ordens de venda pendentes e executá-las quando o preço é favorável
async function executarOrdensVenda(req, res) {

    const claims = verifyToken(req, res);
    if (!claims) {
        res.status(401).json({ message: 'Acesso não autorizado.' });
        return;
    }

    const idUsuario = claims.user_id;

    try {
        
        const ordensVendaPendentes = await obterOrdensVendaPendentes(idUsuario);
        const minutoNegociacao = await obterMinutoNegociacaoUsuario(idUsuario);
        let qtdeOrdensExecutadas = 0;
        let ordensExecutadas = [];
        for (const ordemVenda of ordensVendaPendentes) {
            const possuiTickersSuficiente = await possuiQuantidadeSuficiente(
                ordemVenda.ticker,
                ordemVenda.quantidade,
                idUsuario
            );

            const precoAtualTicker = await obterPrecoMercado(ordemVenda.ticker, minutoNegociacao);

            console.log(`${precoAtualTicker} >= ${ordemVenda.precoReferencia}?  `);
            //Se preço é favorável e ele possui os tickers, executar a ordem de venda
            if (possuiTickersSuficiente && precoAtualTicker >= ordemVenda.precoReferencia) {
                await executarOrdemVenda(idUsuario, ordemVenda.id, precoAtualTicker);
                qtdeOrdensExecutadas++;
                ordensExecutadas.push({
                    ticker: ordemVenda.ticker,
                    quantidade: ordemVenda.quantidade,
                    precoExecucao: precoAtualTicker,
                });
                console.log(`Ordem de venda com id ${ordemVenda.id} executada`);
            }
        }
        return {
            quantidadeOrdensExecutadas: qtdeOrdensExecutadas,
            ordensExecutadas: ordensExecutadas,
        };
    } catch (err) {
        console.log(err);
        return null;
    }
}

//Executar uma ordem de venda específica
async function executarOrdemVenda(idUsuario, idOrdemVenda, precoExecucao) {
    const db = await getConnection();
    try {
        await db.query(
            `
            CALL executar_ordem_venda(?, ?, ?)
            `,
            [idUsuario, idOrdemVenda, precoExecucao]
        );
    } catch (err) {
        console.log(err);
        throw new Error('Ocorreu um erro no sistema ao executar a venda');
    }
}

//Verifica se o usuário tem ticker suficiente na carteira
async function possuiQuantidadeSuficiente(ticker, quantidadeVenda, idUsuario) {
    const db = await getConnection();
    const consultaQuantidade = await db.query(
        `
        SELECT qtde FROM acao_carteira 
        WHERE fk_usuario_id = ? AND ticker = ? 
        `,
        [idUsuario, ticker]
    );

    if (consultaQuantidade[0].length === 0) return false;

    const quantidadeDisponivelCarteira = consultaQuantidade[0][0].qtde;

    await db.end();
    return quantidadeDisponivelCarteira >= quantidadeVenda;
}

//Obter ordens de venda ainda não executadas de um usuário
async function obterOrdensVendaPendentes(idUsuario) {
    const db = await getConnection();
    const [ordensVendaPendentes] = await db.query(
        `
        SELECT id, ticker, quantidade, preco_referencia as precoReferencia
        FROM ordem_venda
        WHERE fk_usuario_id = ? AND executada = 0
        `,
        [idUsuario]
    );
    return ordensVendaPendentes;
}
module.exports = {executarOrdensVenda, executarOrdemVenda, possuiQuantidadeSuficiente, obterOrdensVendaPendentes}