import mongoose from "mongoose";
import { getCategoryTipsDocuments } from "../../../functions/documentHelpers.js"; // 모듈에서 함수 가져오기
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { CustomBoardView } from "../../../schemas/userRelated.js";
import { CommonCategory } from "../../../schemas/category.js"; // 카테고리 모델 불러오기

// 필터를 통해 게시판 데이터 로드
const loadBoardPage = async (req, res) => {
    try {
        // Redis에서 사용자 정보를 가져옴
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        const decryptedSessionId = String(req.decryptedSessionId);

        // Redis에서 필요한 유저 정보(_id, Rcustom_brd) 읽기
        const paramList = ["_id", "Rcustom_brd"];
        let userInfo;
        try {
            userInfo = await mainInquiry.read(paramList, decryptedSessionId);
        } catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve user information from Redis",
            });
        }

        // 유저가 설정한 커스텀 보드 가져오기
        let customBoard;
        try {
            if (!userInfo.Rcustom_brd) {
                return res
                    .status(400)
                    .json({ message: "Rcustom_brd not set for the user" });
            }

            customBoard = await CustomBoardView.findOne({
                _id: userInfo.Rcustom_brd,
            })
                .select("Renrolled_list Rbookmark_list Rlistened_list")
                .lean();

            if (!customBoard) {
                return res
                    .status(404)
                    .json({ message: "Custom board not found" });
            }
        } catch (error) {
            return res.status(500).json({ message: "Internal server error" });
        }

        // 1. 각 리스트의 ObjectId 가져오기
        const enrolledIds = customBoard.Renrolled_list;
        const bookmarkIds = customBoard.Rbookmark_list;
        const listenedIds = customBoard.Rlistened_list;

        // 2. ObjectId로 category_name 조회
        const enrolledCategories = await CommonCategory.find({
            _id: { $in: enrolledIds },
        })
            .select("category_name")
            .lean();

        const bookmarkCategories = await CommonCategory.find({
            _id: { $in: bookmarkIds },
        })
            .select("category_name")
            .lean();

        const listenedCategories = await CommonCategory.find({
            _id: { $in: listenedIds },
        })
            .select("category_name")
            .lean();

        // 3. 각 board_type에 따른 데이터 형식 구성 및 원래 순서대로 정렬
        const formatCategories = (categories, ids) =>
            ids.map((id) => {
                const category = categories.find(
                    (category) => String(category._id) === String(id)
                );
                return {
                    id: category._id, // _id를 id로 변환
                    name: category.category_name,
                };
            });

        const response = {
            enroll: formatCategories(enrolledCategories, enrolledIds),
            bookmark: formatCategories(bookmarkCategories, bookmarkIds),
            listened: formatCategories(listenedCategories, listenedIds),
        };

        // 4. 프론트로 데이터 전송
        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching board data:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export { loadBoardPage };
