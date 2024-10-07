import mongoose from "mongoose";
import connectDB from "./mongoDBconnect.js"; // MongoDB 연결 가져오기
import { Score } from "../schemas/userRelated.js"; // Score 스키마
import {
    QnaDocuments,
    PilgyDocuments,
    TestDocuments,
    HoneyDocuments,
} from "../schemas/docs.js"; // 관련 문서 스키마들
import { CommonCategory } from "../schemas/category.js"; // CommonCategory 스키마

// 사용자 성적 데이터 삽입 및 여러 리스트 자동 연결
const insertUserScoreWithLists = async () => {
    await connectDB(); // MongoDB 연결

    try {
        const userId = new mongoose.Types.ObjectId(); // 사용자 ID 생성 (테스트용)

        // 1. 필터에 맞는 과목 ID 자동으로 찾기 (예: 'frontend')
        const subject = "frontend";
        const category = await CommonCategory.findOne({
            category_name: subject,
        })
            .select("_id Rtest_list Rpilgy_list Rhoney_list") // 과목과 관련된 리스트들 가져오기
            .lean();

        if (!category) {
            throw new Error(`해당 과목 (${subject})을 찾을 수 없습니다.`);
        }

        // 2. 사용자 성적 데이터 삽입
        const scoreData = {
            _id: new mongoose.Types.ObjectId(),
            Ruser: userId,
            semester_list: {
                Rcategory_list: [category._id], // 과목 ID 자동 삽입
                subject_list: ["프론트엔드 개발"], // 과목명
                credit_list: [3], // 학점
                grade_list: [4.0], // 성적
                ismajor_list: [true], // 전공 여부
                is_show_list: [true], // 성적 공개 여부
                Rqna_list: [], // QnA 리스트
                Rtest_list: [], // Test 리스트
                Rpilgy_list: [], // Pilgy 리스트
                Rhoney_list: [], // Honey 리스트
            },
        };

        await Score.create(scoreData);
        console.log("사용자 성적 데이터 삽입 완료");

        // 3. QnA, Test, Pilgy, Honey 리스트와 연결
        const qnaList = await QnaDocuments.find({
            _id: { $in: category.Rtest_list },
        })
            .select("_id")
            .lean();
        const testList = await TestDocuments.find({
            _id: { $in: category.Rtest_list },
        })
            .select("_id")
            .lean();
        const pilgyList = await PilgyDocuments.find({
            _id: { $in: category.Rpilgy_list },
        })
            .select("_id")
            .lean();
        const honeyList = await HoneyDocuments.find({
            _id: { $in: category.Rhoney_list },
        })
            .select("_id")
            .lean();

        // 각 리스트 ID 배열로 변환
        const qnaIds = qnaList.map((doc) => doc._id);
        const testIds = testList.map((doc) => doc._id);
        const pilgyIds = pilgyList.map((doc) => doc._id);
        const honeyIds = honeyList.map((doc) => doc._id);

        // 4. Score의 각 리스트 업데이트
        await Score.updateOne(
            { Ruser: userId },
            {
                $set: {
                    "semester_list.Rqna_list": qnaIds,
                    "semester_list.Rtest_list": testIds,
                    "semester_list.Rpilgy_list": pilgyIds,
                    "semester_list.Rhoney_list": honeyIds,
                },
            }
        );
        console.log("사용자 QnA, Test, Pilgy, Honey 리스트 업데이트 완료");
    } catch (err) {
        console.error("데이터 및 리스트 연결 중 오류 발생:", err);
    } finally {
        mongoose.connection.close(); // MongoDB 연결 종료
    }
};

// 함수 실행
insertUserScoreWithLists();
