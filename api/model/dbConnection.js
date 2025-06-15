const mysql = require("promise-mysql");
const config = require("../config/config.js");
async function getConnection() {
    const dbConfig = config.database;
    return await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.databaseName
    });
}

module.exports = getConnection;