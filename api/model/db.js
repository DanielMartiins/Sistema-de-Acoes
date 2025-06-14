const mysql = require("promise-mysql");
const config = require("../config/config.js");
async function getConnection() {
    return await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.databaseName
    });
}

module.exports = getConnection;