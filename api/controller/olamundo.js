var express = require('express');
var router = express.Router();

router.get('/', function(req,res) {
    res.send("Olá mundo!");
});

module.exports = router;