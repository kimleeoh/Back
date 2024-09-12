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
// import setupSwagger from "./config/swagger.js"; // Swagger 설정 파일
import { setupSocketIO } from "./io.js"; // 소켓 설정 파일

import adminRoutes from "./routes/adminRoutes.js"; // 기존 관리자용 라우터
import clientRoutes from "./routes/clientRoutes.js"; // 새로운 클라이언트용 라우터

dotenv.config();
const adminApp = express();
const clientApp = express();

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

const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 2 * 60 * 60 * 1000, // 2 시간
  },
});

redisHandler.create(REDIS_URL);
s3Handler.create([
  AWS_S3_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET,
]);

//adminApp.set('views', 'src/admin/views');
adminApp.set("view engine", "ejs");
adminApp.use("/admin", express.static("src/admin/"));
adminApp.use(sessionMiddleware);
adminApp.use(express.urlencoded({ extended: true }));
adminApp.use(express.json());
adminApp.use("/", adminRoutes); // 기존 관리자용 라우터 유지

//clientApp.use('/schemas', express.static('src/schemas'));
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
clientApp.use("/", clientRoutes); // 새로운 클라이언트용 라우터 추가

s3Handler.connect();
redisHandler.connect();

mongoose
  .connect(MONGO_URI, { dbName: "root" })
  .then(() => console.log("Successfully connected to mongodb"))
  .catch((e) => console.error(e));

// adminApp.use("/admin", adminLoginRoute);
// adminApp.use("/", adminHomeRoute);

// clientApp.use("/", loginRoute);
// clientApp.use("/api", dummyRoute);
// clientApp.use("/api", registerRoute);

clientApp.listen(CLIENT_PORT, () => {
  console.log(`Client server listening on port ${CLIENT_PORT}`);
});

const adminServer = adminApp.listen(ADMIN_PORT, () => {
  console.log(`Admin server listening on port ${ADMIN_PORT}`);
});
const io = new Server(adminServer, { path: "/admin/online" });
setupSocketIO(io);

// clientApp 내보내기
export default clientApp;
