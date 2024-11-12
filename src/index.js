import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import redisHandler from "./config/redisHandler.js";
import s3Handler from "./config/s3Handler.js";
import RedisStore from "connect-redis";
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

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

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

// store를 try 블록 외부에 선언
let store;

(async () => {
    try {
        // Redis 연결
        await redisHandler.create(REDIS_URL);
        console.log("Redis handler initialized.");

        const redisClient = redisHandler.getRedisClient();
        if (!redisClient) {
            console.error("Redis client failed to initialize.");
            throw new Error("Failed to connect to Redis");
        }
        console.log("Redis client obtained successfully.");

        // store를 초기화
        store = new RedisStore({ client: redisClient });
        
        // S3 연결
        s3Handler.create([
            AWS_S3_REGION,
            AWS_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY,
            AWS_S3_BUCKET,
        ]);
        s3Handler.connect(redisClient);
        console.log("S3 configuration completed");

        // MongoDB 연결
        await mongoose.connect(MONGO_URI, { dbName: "root" });
        console.log("Successfully connected to MongoDB");

        // 세션 미들웨어 설정
        const adminSessionMiddleware = session({
            store,
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

        // adminApp 설정
        adminApp.set("view engine", "ejs");
        adminApp.use("/admin", express.static("src/admin/"));
        adminApp.use(express.urlencoded({ extended: true }));
        adminApp.use(express.json());
        adminApp.use(adminSessionMiddleware);
        adminApp.use("/", adminRoutes);
        adminApp.use(
            cors({
                origin: ["http://localhost:4501", "http://localhost:4502"],
                credentials: true,
            })
        );
        adminApp.use((req, res, next) => {
            console.log(`Incoming request: ${req.method} ${req.url}`);
            next();
        });
        adminApp.get("/admin/test", (req, res) => {
            console.log("Test route hit");
            res.send("Test route is working");
        });

        // clientApp 설정
        clientApp.use(express.urlencoded({ extended: true }));
        clientApp.use(clientSessionMiddleware);
        clientApp.use(cookieParser());
        clientApp.use(express.json());

        // CORS 설정
        const allowedOrigins =
            process.env.NODE_ENV === "production"
                ? [
                      "https://13.124.232.124",
                      "https://afkiller.com",
                      "https://www.afkiller.com",
                  ]
                : ["http://localhost:3000"];

        clientApp.use(
            cors({
                origin: function (origin, callback) {
                    if (!origin || allowedOrigins.includes(origin)) {
                        callback(null, true);
                    } else {
                        callback(new Error("Not allowed by CORS"));
                    }
                },
                credentials: true,
                optionsSuccessStatus: 200,
            })
        );

        // 라우터 설정
        clientApp.use("/api", limiter.loginRate(), loginRouter);
        clientApp.use("/api", limiter.lightRate(), lightRouter);
        clientApp.use("/api", limiter.heavyRate(), heavyRouter);
        clientApp.use("/api", limiter.categoryRate(), categoryRouter);
        clientApp.get("/", (req, res) => {
            res.send("<h1>서버 실행 중</h1>");
        });

        // 서버 시작
        clientApp.listen(CLIENT_PORT, () => {
            console.log(`Client server listening on port ${CLIENT_PORT}`);
        });

        const adminServer = adminApp.listen(ADMIN_PORT, () => {
            console.log(`Admin server listening on port ${ADMIN_PORT}`);
        });

        // Socket.IO 설정
        const io = new Server(adminServer, { path: "/admin/online" });
        setupSocketIO(io);
    } catch (error) {
        console.error("Error during initialization:", error);
    }
})();
