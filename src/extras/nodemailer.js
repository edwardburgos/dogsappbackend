const nodemailer = require('nodemailer');
const { google } = require('googleapis')

const oAuth2Client = new google.auth.OAuth2(process.env.GMAIL_API_CLIENT_ID, process.env.GMAIL_API_CLIENT_SECRET, process.env.GMAIL_API_REDIRECT_URI)
oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_API_REFRESH_TOKEN })

async function sendMail(name, addressee, reason, token) {
    try {
        let url = 'http://localhost:3000'

        if (['loginWithoutPassword', 'verifyEmail', 'resetPassword', 'deleteAccountEmail', 'definePassword'].includes(reason) && token) {
            url = `${url}/auto/${reason}/${token.token}?expires=${token.expires}`
        }

        const accessToken = await oAuth2Client.getAccessToken();

        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: 'edwardpbn@gmail.com',
                clientId: process.env.GMAIL_API_CLIENT_ID,
                clientSecret: process.env.GMAIL_API_CLIENT_SECRET,
                refreshToken: process.env.GMAIL_API_REFRESH_TOKEN,
                accessToken
            },
            tls : { rejectUnauthorized: false }
        })

        const mailOptions = {
            from: 'edwardpbn@gmail.com',
            to: addressee,
            subject: reason === 'verifyEmail' ? 'DOGS APP - Verify your email address' : reason === 'loginWithoutPassword' ? 'DOGS APP - Login without password' : reason === 'resetPassword' ? 'DOGS APP - Reset password' : reason === 'deleteAccountEmail' ? 'DOGS APP - Account deletion confirmation' : reason === 'definePassword' ? 'DOGS APP - Define password' : '',
            text: reason === 'verifyEmail' ? `Hi ${name}` +
            'Thank so much for wanting to try the DOGS APP deeply' + 
            'In order to avoid spam, we verify all the email addresses so the following link would help us to verify yours' +
            'Please, click it and wait until your logging is completed and do not worry because it is not dangerous' + 
            `<a href="${url}">Verify your email</a>` +
            'Hope you share your dogs with the community' : reason === 'loginWithoutPassword' ? `Hi ${name}` +
            'Thank so much for wanting to try the DOGS APP deeply' + 
            'The following link allow you to login without password' +
            'Please, click it and wait until your logging is completed and do not worry because it is not dangerous' + 
            `<a href="${url}">Login without password</a>` +
            'Hope you share your dogs with the community' : reason === 'resetPassword' ? `Hi ${name}` +
            'We are so sorry that you forget your password' + 
            'The following link allow you to reset it' +
            'Please, click it to define a new one and do not worry because it is not dangerous at all' + 
            `<a href="${url}">Reset password</a>` +
            'Hope you share your dogs with the community' : reason === 'deleteAccountEmail' ? `Hi ${name}` +
            'We are so sorry that you want to delete your account' + 
            'The following link confirm your decision and delete your account automatically' +
            'Please, click it if you really want to do it and do not worry because it is not dangerous at all' + 
            `<a href="${url}">Delete account</a>` +
            'Thanks for your try the DOGS APP' : reason === 'definePassword' ? `Hi ${name}` +
            'The following link allow you to define a password for your account' +
            'Please, click it to define it and do not worry because it is not dangerous at all' + 
            `<a href="${url}">Define password</a>` +
            'Hope you share your dogs with the community' : '',
            html: reason === 'verifyEmail' ?  `<div style='background-color: #0d6efd; padding: 16px; border-radius: 5px; color: #fff !important;'><h1 style='margin-top: 0;'>Hi ${name}</h1>` +
            '<p>Thank so much for wanting to try the DOGS APP deeply</p>' +
            '<p>In order to avoid spam, we verify all the email addresses so the following link would help us to verify yours</p>' +
            '<p>Please, click it and wait until your logging is completed, and do not worry because it is not dangerous at all</p>' + 
            `<a style='background-color: #fff; color: #0d6efd; padding: 6px 12px; display: inline-block; text-decoration: none; border-radius: 5px' href="${url}">Verify your email</a>` + 
            `<p style='margin-bottom: 0;'>Hope you share your dogs with the community</p></div>` : reason === 'loginWithoutPassword' ? `<div style='background-color: #0d6efd; padding: 16px; border-radius: 5px; color: #fff !important;'><h1 style='margin-top: 0;'>Hi ${name}</h1>` +
            '<p>Thank so much for wanting to try the DOGS APP deeply</p>' +
            '<p>The following link allow you to login without password</p>' +
            '<p>Please, click it and wait until your logging is completed, and do not worry because it is not dangerous at all</p>' + 
            `<a style='background-color: #fff; color: #0d6efd; padding: 6px 12px; display: inline-block; text-decoration: none; border-radius: 5px' href="${url}">Login without password</a>` + 
            `<p style='margin-bottom: 0;'>Hope you share your dogs with the community</p></div>` : reason === 'resetPassword' ? `<div style='background-color: #0d6efd; padding: 16px; border-radius: 5px; color: #fff !important;'><h1 style='margin-top: 0;'>Hi ${name}</h1>` +
            '<p>We are so sorry that you forget your password</p>' +
            '<p>The following link allow you to reset it</p>' +
            '<p>Please, click it to define a new one and do not worry because it is not dangerous at all</p>' + 
            `<a style='background-color: #fff; color: #0d6efd; padding: 6px 12px; display: inline-block; text-decoration: none; border-radius: 5px' href="${url}">Reset password</a>` + 
            `<p style='margin-bottom: 0;'>Hope you share your dogs with the community</p></div>` : reason === 'deleteAccountEmail' ? `<div style='background-color: #0d6efd; padding: 16px; border-radius: 5px; color: #fff !important;'><h1 style='margin-top: 0;'>Hi ${name}</h1>` +
            '<p>We are so sorry that you want to delete your account</p>' +
            '<p>The following link confirm your decision and delete your account automatically</p>' +
            '<p>Please, click it if you really want to do it and do not worry because it is not dangerous at all</p>' + 
            `<a style='background-color: #fff; color: #0d6efd; padding: 6px 12px; display: inline-block; text-decoration: none; border-radius: 5px' href="${url}">Delete account</a>` + 
            `<p style='margin-bottom: 0;'>Thanks for your try the DOGS APP</p></div>` : reason === 'definePassword' ? `<div style='background-color: #0d6efd; padding: 16px; border-radius: 5px; color: #fff !important;'><h1 style='margin-top: 0;'>Hi ${name}</h1>` +
            '<p>The following link allow you to define a password for your account</p>' +
            '<p>Please, click it to define it and do not worry because it is not dangerous at all</p>' + 
            `<a style='background-color: #fff; color: #0d6efd; padding: 6px 12px; display: inline-block; text-decoration: none; border-radius: 5px' href="${url}">Define password</a>` + 
            `<p style='margin-bottom: 0;'>Hope you share your dogs with the community</p></div>` : ''
        }
        const result = await transport.sendMail(mailOptions);
        console.log(result)
        return result;
    } catch (e) {
        console.log(e)
        return 'Sorry, an error ocurred'
    }
}

module.exports.sendMail = sendMail;
