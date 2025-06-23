const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'TesteAcoesUNIRIO@proton.me',
        pass: 'TESTEACOESUNIRIO'
    }
});

async function enviarEmail(destinatario, assunto, html) {
    await transporter.sendMail({
        from: '"Sistema de Ações" <TesteAcoesUNIRIO@proton.me>',
        to: destinatario,
        subject: assunto,
        html: html
    });
}

module.exports = { enviarEmail };
