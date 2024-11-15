import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const { EMAIL_SERVICE, EMAIL_HOST, EMAIL_USER, EMAIL_PASS } = process.env;

const smtpTransport = nodemailer.createTransport({
    pool: true,
    //maxConnections: 1,
    service: EMAIL_SERVICE,
    host: EMAIL_HOST,
    port: 465,
    secure: true,
    requireTLS: true,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
    connectionTimeout: 10000, // 연결 타임아웃
    socketTimeout: 10000, // 소켓 타임아웃
});

export default smtpTransport;
