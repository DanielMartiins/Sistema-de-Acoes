const axios = require('axios');

let tickersFechamento = null;
let tickersMercado = {}; // objeto: { ticker: preco }
let minutoObtido = null;

async function inicializarTickersMercado() {
    const url = `https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/0.json`;
    const response = await axios.get(url);
    for (const acao of response.data) {
        tickersMercado[acao.ticker] = acao.preco;
    }
}

async function obterPrecoMercado(ticker, minutoNegociacao) {
    if (!ticker) throw new Error(`ERRO: Ticker indefinido`);
    if (ticker.trim() === '') throw new Error(`ERRO: Ticker vazio.`);
    if (Object.keys(tickersMercado).length === 0) await inicializarTickersMercado();

    if (
        minutoNegociacao === null ||
        minutoNegociacao === undefined ||
        !(minutoNegociacao >= 0 && minutoNegociacao <= 59)
    ) {
        throw new Error(
            `ERRO: O minuto "${minutoNegociacao}" é inválido! Deve ser um inteiro entre 0 e 59`,
        );
    }

    if (minutoObtido !== minutoNegociacao) {
        const url = `https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/${minutoNegociacao}.json`;
        const response = await axios.get(url);

        // Atualiza os preços dos tickers já existentes (ou insere novos)
        for (const acao of response.data) {
            tickersMercado[acao.ticker] = acao.preco;
        }

        minutoObtido = minutoNegociacao;
    }

    // Retorna o preço atual do ticker
    const preco = tickersMercado[ticker];
    if (preco === undefined) {
        throw new Error(`Ticker "${ticker}" não encontrado no minuto ${minutoNegociacao}`);
    }

    return preco;
}

async function obterPrecoFechamento(ticker) {
    if (!ticker) throw new Error(`ERRO: Ticker indefinido.`);
    if (ticker.trim() === '') throw new Error(`ERRO: Ticker vazio.`);

    if (tickersFechamento === null) {
        const url = `https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/tickers.json`;
        let response = await axios.get(url);
        tickersFechamento = response.data;
    }
    const precoAcoes = tickersFechamento;
    const acaoDesejada = precoAcoes.find((acao) => acao.ticker === ticker);

    if (!acaoDesejada) throw new Error(`ERRO: Ticker ${ticker} não encontrado.`);
    return acaoDesejada.fechamento;
}
module.exports = {
    obterPrecoMercado,
    obterPrecoFechamento,
};
