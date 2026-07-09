const nodemailer = require('nodemailer');

function sendEmail(host, port, email, pass, html, subject, from, to) {
  return new Promise(async (resolve) => {
    try {
      let transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: port === '465' ? true : false, // true for 465, false for other ports
        auth: {
          user: email, // generated ethereal user
          pass: pass, // generated ethereal password
        },
      });

      let info = await transporter.sendMail({
        from: `${from || 'Email From'} <${email}>`, // sender address
        to: to, // list of receivers
        subject: subject || 'Email', // Subject line
        html: html, // html body
      });

      resolve({ success: true, info });
    } catch (err) {
      resolve({ success: false, err: err.toString() || 'Invalid Email' });
    }
  });
}

module.exports = {
  sendEmail,
};
