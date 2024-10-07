import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ES 모듈에서 __dirname을 대체하는 방법
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 명시적으로 .env 파일의 경로를 설정
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const { MONGO_URI } = process.env;

// MONGO_URI 값을 로그로 출력하여 확인
console.log("MONGO_URI 값:", process.env.MONGO_URI);


const connectDB = async () => {
    if (!MONGO_URI) {
        console.error("MongoDB URI가 설정되지 않았습니다!");
        process.exit(1); // URI가 없을 때 강제 종료
    }
    try {
        await mongoose.connect(MONGO_URI, { dbName: "root" });
        console.log("Successfully connected to mongodb");
    } catch (err) {
        console.error("MongoDB 연결 실패:", err);
        process.exit(1); // 연결 실패 시 강제 종료
    }
};

export default connectDB;
