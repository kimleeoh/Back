import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import session from "express-session";
import cors from "cors";
import { Server } from "socket.io";

// 설정 파일 및 핸들러 가져오기
import redisHandler from "./config/redisHandler.js";
import s3Handler from "./config/s3Handler.js";
import rateLimiter from "./config/rateLimiter.js";
import setupSwagger from "./config/swagger.js"; // Swagger 설정 파일
import setupSocketIO from "./io.js"; // 소켓 설정 파일

// 새로운 라우터 설정 파일 가져오기
import setupRoutes from "./routes/index.js";

dotenv.config();

const {
  MONGO_URI,
  ADMIN_PORT,
  CLIENT_PORT,
  REDIS_URL,
  SESSION_SECRET,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_S3_REGION,
  AWS_S3_BUCKET,
} = process.env;

// 어드민 및 클라이언트 앱 생성
const adminApp = express();
const clientApp = express();

// 세션 미들웨어 설정
const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 2 * 60 * 60 * 1000, // 2시간
  },
});

// Redis와 S3 핸들러 설정
redisHandler.create(REDIS_URL);
s3Handler.create([
  AWS_S3_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET,
]);

// Swagger 설정 적용
setupSwagger(clientApp);

// 어드민 앱 설정
adminApp.set("view engine", "ejs");
adminApp.use("/admin", express.static("src/admin/"));
adminApp.use(sessionMiddleware);
adminApp.use(express.urlencoded({ extended: true }));
adminApp.use(express.json());

// 클라이언트 앱 설정
clientApp.use(express.urlencoded({ extended: true }));
clientApp.use(express.json());
clientApp.use(rateLimiter);
clientApp.use(
  cors({
    origin: "http://localhost:3000", // 접근 권한을 부여하는 도메인
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Redis와 S3 핸들러 연결
s3Handler.connect();
redisHandler.connect();

// MongoDB 연결
mongoose
  .connect(MONGO_URI, { dbName: "root" })
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((e) => console.error(e));

// 라우트 설정
setupRoutes(adminApp, clientApp); // 라우트 설정 파일에서 어드민과 클라이언트 앱에 대한 라우트를 적용

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
