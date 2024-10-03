import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const { MONGO_URI } = process.env;

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, { dbName: "root" });
        console.log("Successfully connected to mongodb");
    } catch (err) {
        console.error("MongoDB 연결 실패:", err);
        process.exit(1); // 연결 실패 시 프로세스 종료
    }
};

export default connectDB;
