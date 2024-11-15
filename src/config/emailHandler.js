import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const { EMAIL_SERVICE, EMAIL_HOST, EMAIL_USER, EMAIL_PASS } = process.env;

const smtpTransport = nodemailer.createTransport({
    pool: true,
    service: process.env.EMAIL_SERVICE,
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    }
});

export default smtpTransport;