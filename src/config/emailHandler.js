import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const { EMAIL_SERVICE, EMAIL_HOST, EMAIL_USER, EMAIL_PASS } = process.env;

const smtpTransport = nodemailer.createTransport({
    pool: true,
    maxConnections: 1,
    service: EMAIL_SERVICE,
    host: EMAIL_HOST,
    port: 465,
    secure: false,
    requireTLS: true,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

export default smtpTransport;




