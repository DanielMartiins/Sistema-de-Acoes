const getConnection = require('../model/dbConnection.js');

async function obterMinutoNegociacaoUsuario(idUsuario) {
    let db = await getConnection();
    let consultaHoraNegociacao = await db.query(
        `
        SELECT MINUTE(ultima_hora_negociacao) as minuto
        FROM usuario
        WHERE id = ?
        `,
        [idUsuario]
    );
    await db.end();
    return consultaHoraNegociacao[0][0].minuto;
}

module.exports = {
    obterMinutoNegociacaoUsuario,
};
