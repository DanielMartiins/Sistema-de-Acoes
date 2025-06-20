const axios = require('axios');

async function obterPrecoMercado(ticker, minutoNegociacao) {
    const url = `https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/${minutoNegociacao}.json`;
    let response = await axios.get(url);
    const precoAcoes = response.data;
    const acaoDesejada = precoAcoes.find((acao) => acao.ticker === ticker);

    if (!acaoDesejada) throw new Error('ERRO: Ticker não encontrado');
    return acaoDesejada.preco;
}

module.exports = {
    obterPrecoMercado,
};
    