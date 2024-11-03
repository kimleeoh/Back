import path from "path"; // path 모듈 추가
import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import redisHandler from "./config/redisHandler.js";
import s3Handler from "./config/s3Handler.js";
import rateLimiter from "./functions/rateLimiter.js";
import adminRoutes from "./routes/adminRoutes.js";
import {
    lightRouter,
    heavyRouter,
    loginRouter,
} from "./routes/clientRoutes.js";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { setupSocketIO } from "./io.js";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import limiter from "./functions/rateLimiter.js";

dotenv.config();
const adminApp = express();
const clientApp = express();

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

// 세션 미들웨어 설정
const adminSessionMiddleware = session({
    secret: ADMIN_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 2 * 60 * 60 * 1000, // 2시간
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
        maxAge: 24 * 60 * 60 * 1000, // 24시간
    },
});

// 기타 설정
redisHandler.create(REDIS_URL);
s3Handler.create([
    AWS_S3_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET,
]);

// adminApp 설정
adminApp.set("view engine", "ejs");
adminApp.use("/admin", express.static("src/admin/"));
adminApp.use(adminSessionMiddleware);
adminApp.use(express.urlencoded({ extended: true }));
adminApp.use(express.json());

// clientApp 설정
clientApp.use(express.urlencoded({ extended: true }));
clientApp.use(clientSessionMiddleware);
clientApp.use(cookieParser());
clientApp.use(express.json());
clientApp.use(
    cors({
        origin: [
            "https://13.124.232.124",
            "https://afkiller.com",
            "https://www.afkiller.com",
        ],
        credentials: true,
        optionsSuccessStatus: 200,
    })
);

// 정적 파일 제공을 위한 build 경로 설정
const __dirname = path.resolve();
clientApp.use(express.static(path.join(__dirname, "build")));

clientApp.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Redis와 S3 핸들러 연결
s3Handler.connect(redisHandler.getRedisClient());
redisHandler.connect();

// MongoDB 연결
mongoose
    .connect(MONGO_URI, { dbName: "root" })
    .then(() => console.log("Successfully connected to mongodb"))
    .catch((e) => console.error(e));

// 라우트 설정
adminApp.use("/", adminRoutes);
clientApp.use("/api", limiter.loginRate(), loginRouter);
clientApp.use("/api", limiter.lightRate(), lightRouter);
clientApp.use("/api", limiter.heavyRate(), heavyRouter);
clientApp.get("/", (req, res) => {
    res.send("<h1>서버 실행 중</h1>");
});

// 서버 실행
clientApp.listen(CLIENT_PORT, () => {
    console.log(`Client server listening on port ${CLIENT_PORT}`);
});

const adminServer = adminApp.listen(ADMIN_PORT, () => {
    console.log(`Admin server listening on port ${ADMIN_PORT}`);
});
const io = new Server(adminServer, { path: "/admin/online" });
setupSocketIO(io);
