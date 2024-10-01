import mongoose from "mongoose";
import connectDB from "./db.js"; // MongoDB 연결 가져오기
import {
    HoneyDocuments,
    TestDocuments,
    PilgyDocuments,
} from "../schemas/docs.js";

// MongoDB에 연결하고 데이터 삽입하는 함수
const insertTestData = async () => {
    await connectDB(); // MongoDB 연결

    const testData = [];

    // HoneyDocuments, TestDocuments, PilgyDocuments에 테스트 데이터를 생성 및 삽입
    for (let i = 1; i <= 5; i++) {
        const data = {
            _id: new mongoose.Types.ObjectId(),
            Ruser: new mongoose.Types.ObjectId(),
            // now_category: `카테고리${i}`,
            title: `테스트 타이틀 ${i}`,
            content: `테스트 내용 ${i}`,
            preview_img: `https://cdn.pixabay.com/photo/2023/03/04/20/07/coffee-7830087_1280.jpg`,
            likes: Math.floor(Math.random() * 100),
            point: Math.floor(Math.random() * 500),
            Rfile: new mongoose.Types.ObjectId(),
            views: Math.floor(Math.random() * 1000),
            time: new Date(),
            warn: 0,
            warn_why_list: [],
        };

        testData.push(data);
    }

    try {
        await HoneyDocuments.insertMany(testData);
        console.log("HoneyDocuments에 데이터 삽입 완료");

        await TestDocuments.insertMany(testData);
        console.log("TestDocuments에 데이터 삽입 완료");

        await PilgyDocuments.insertMany(testData);
        console.log("PilgyDocuments에 데이터 삽입 완료");
    } catch (err) {
        console.error("데이터 삽입 중 오류 발생:", err);
    } finally {
        mongoose.connection.close(); // MongoDB 연결 종료
    }
};

// 함수 실행
insertTestData();
