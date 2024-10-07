import mongoose from "mongoose";
import connectDB from "./mongoDBconnect.js"; // MongoDB 연결 가져오기
import { CommonCategory } from "../schemas/category.js"; // CommonCategory 스키마 추가
import {
    QnaDocuments,
    PilgyDocuments,
    TestDocuments,
    HoneyDocuments,
} from "../schemas/docs.js"; // 관련 문서 스키마들

// MongoDB에 연결하고 데이터 삽입하는 함수
const insertTestData = async () => {
    await connectDB(); // MongoDB 연결

    try {
        // 이미 삽입된 문서들의 ObjectId를 가져와 CommonCategory 업데이트
        const honeyIds = await mongoose
            .model("HoneyDocuments")
            .find()
            .limit(10)
            .select("_id")
            .lean();
        const testIds = await mongoose
            .model("TestDocuments")
            .find()
            .limit(10)
            .select("_id")
            .lean();
        const pilgyIds = await mongoose
            .model("PilgyDocuments")
            .find()
            .limit(10)
            .select("_id")
            .lean();

        // ObjectId 배열 추출
        const honeyList = honeyIds.map((doc) => doc._id);
        const testList = testIds.map((doc) => doc._id);
        const pilgyList = pilgyIds.map((doc) => doc._id);

        const testCategoryId = new mongoose.Types.ObjectId(
            "651bcb601f5df96c0e8b4567"
        ); // 프론트엔드 카테고리 ID

        // 2. CommonCategory 업데이트
        await CommonCategory.updateOne(
            { _id: testCategoryId },
            {
                $set: {
                    category_name: "frontend",
                    Rtest_list: testList, // TestDocuments ID 추가
                    Rpilgy_list: pilgyList, // PilgyDocuments ID 추가
                    Rhoney_list: honeyList, // HoneyDocuments ID 추가
                },
            },
            { upsert: true } // 데이터가 없으면 생성, 있으면 업데이트
        );
        console.log("CommonCategory 업데이트 완료");
    } catch (err) {
        console.error("데이터 삽입 중 오류 발생:", err);
    } finally {
        mongoose.connection.close(); // MongoDB 연결 종료
    }
};

// 함수 실행
insertTestData();
