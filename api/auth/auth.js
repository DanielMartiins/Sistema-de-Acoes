/* eslint-disable no-unused-vars */
const jwt = require('jsonwebtoken');
const config = require('../config/config.js');

const verifyToken = function (req, res) {
    if (!req.headers) return null;

    if (!req.headers.authorization) return null;

    var authorization = req.headers.authorization.split(' '); //Para separar "Bearer <token>"

    if (authorization.length != 2) return null;

    try {
        var token = authorization[1];
        return jwt.verify(token, config.auth.tokenKey);
    } catch (err) {
        return null;
    }
};

module.exports = { verifyToken };
