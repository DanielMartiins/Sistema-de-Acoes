const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'seu.email@gmail.com',
        pass: 'sua-senha-de-aplicativo'
    }
});

async function enviarEmail(destinatario, assunto, html) {
    await transporter.sendMail({
        from: '"Sistema de Ações" <seu.email@gmail.com>',
        to: destinatario,
        subject: assunto,
        html: html
    });
}

module.exports = { enviarEmail };
