const axios = require('axios');

async function obterPrecoMercado(ticker, minutoNegociacao) {
    if (!ticker) throw new Error(`ERRO: Ticker indefinido`);
    if (ticker.trim() === '') throw new Error(`ERRO: Ticker vazio.`);

    if (
        minutoNegociacao === null ||
        minutoNegociacao === undefined ||
        !(minutoNegociacao >= 0 && minutoNegociacao <= 59)
    ) {
        throw new Error(
            `ERRO: O minuto "${minutoNegociacao}" é inválido! Deve ser um inteiro entre 0 e 59`
        );
    }

    const url = `https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/${minutoNegociacao}.json`;
    let response = await axios.get(url);
    const precoAcoes = response.data;
    const acaoDesejada = precoAcoes.find((acao) => acao.ticker === ticker);

    if (!acaoDesejada) throw new Error(`ERRO: Ticker ${ticker} não encontrado.`);
    return acaoDesejada.preco;
}

async function obterPrecoFechamento(ticker) {
    if (!ticker) throw new Error(`ERRO: Ticker indefinido.`);
    if (ticker.trim() === '') throw new Error(`ERRO: Ticker vazio.`);

    const url = `https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/tickers.json`;
    let response = await axios.get(url);
    const precoAcoes = response.data;
    const acaoDesejada = precoAcoes.find((acao) => acao.ticker === ticker);

    if (!acaoDesejada) throw new Error(`ERRO: Ticker ${ticker} não encontrado.`);
    return acaoDesejada.fechamento;
}
module.exports = {
    obterPrecoMercado,
    obterPrecoFechamento,
};
