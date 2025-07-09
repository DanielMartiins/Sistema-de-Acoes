const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'luca.r.g.domingues@edu.unirio.br',
        pass: 'SenhaFalsa'
    }
});

async function enviarEmail(destinatario, assunto, html) {
    await transporter.sendMail({
        from: '"Sistema de Ações" <luca.r.g.domingues@edu.unirio.br>',
        to: destinatario,
        subject: assunto,
        html: html
    });
}

module.exports = { enviarEmail };
