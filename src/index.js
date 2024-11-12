import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import redisHandler from "./config/redisHandler.js";
import s3Handler from "./config/s3Handler.js";
import connectRedis from "connect-redis"; // connect-redis의 함수 호출을 위해 수정
import adminRoutes from "./routes/adminRoutes.js";
import {
    lightRouter,
    heavyRouter,
    loginRouter,
    categoryRouter,
} from "./routes/clientRoutes.js";

import { Server } from "socket.io";
import { setupSocketIO } from "./io.js";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import limiter from "./functions/rateLimiter.js";

dotenv.config();
const adminApp = express();
const clientApp = express();

// RedisStore 생성
const RedisStore = connectRedis(session); // RedisStore 생성 방식 변경

const {
    MONGO_URI,
    ADMIN_PORT,
    CLIENT_PORT,
    REDIS_URL,
    ADMIN_SESSION_SECRET,
    CLIENT_SESSION_SECRET,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_S3_REGION,
    AWS_S3_BUCKET,
} = process.env;

const adminSessionMiddleware = session({
    store: new RedisStore({ client: redisHandler.getRedisClient() }), // RedisStore 사용
    secret: ADMIN_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 2 * 60 * 60 * 1000, // 2 시간
    },
});

const clientSessionMiddleware = session({
    secret: CLIENT_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 시간
    },
});

redisHandler.create(REDIS_URL);
s3Handler.create([
    AWS_S3_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET,
]);

// CORS 설정 및 기타 미들웨어 설정은 그대로 유지

clientApp.listen(CLIENT_PORT, () => {
    console.log(`Client server listening on port ${CLIENT_PORT}`);
});

const adminServer = adminApp.listen(ADMIN_PORT, () => {
    console.log(`Admin server listening on port ${ADMIN_PORT}`);
});
const io = new Server(adminServer, { path: "/admin/online" });
setupSocketIO(io);
