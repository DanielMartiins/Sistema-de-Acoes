const axios = require('axios');

async function obterPrecoMercado(ticker, minutoNegociacao) {

    if (ticker.trim() === '') {
        throw new Error(`ERRO: Ticker vazio!`)
    }

    if (minutoNegociacao === null 
        || minutoNegociacao === undefined 
        || !(minutoNegociacao >= 0 && minutoNegociacao <= 59)) {
        throw new Error(`ERRO: Minuto inválido! Deve ser um inteiro entre 0 e 59. Valor de minutoNegociação inserido na função: ${minutoNegociacao}`);
    }

    const url = `https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/${minutoNegociacao}.json`;
    let response = await axios.get(url);
    const precoAcoes = response.data;
    const acaoDesejada = precoAcoes.find((acao) => acao.ticker === ticker);

    if (!acaoDesejada) throw new Error(`ERRO: Ticker não encontrado. Ticker inserido na função: ${ticker}`);
    return acaoDesejada.preco;
}

module.exports = {
    obterPrecoMercado,
};
    