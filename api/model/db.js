const mysql = require("promise-mysql");

async function getConnection() {
    return await mysql.createConnection({
        host: 'localhost',
        port: '3306',
        user: 'root',
        password: 'admin',
        database: 'sistema_acoes'
    });
}

module.exports = getConnection;