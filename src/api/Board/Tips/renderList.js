import mongoose from "mongoose";
import { CommonCategory } from "../../../schemas/category.js";
import { getCategoryTipsDocuments } from  "../../../functions/documnentHelpers.js" // 모듈에서 함수 가져오기
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { CustomBoardView } from "../../../schemas/userRelated.js";

// 필터를 통해 게시판 데이터 로드
const loadBoardWithFilter = async (req, res) => {
    try {
        let { filters } = req.body;

        // 필터 값이 없으면 기본적으로 3개의 필터 적용 (test, pilgy, honey)
        if (!filters || filters.length === 0) {
            filters = ["test", "pilgy", "honey"];
        }

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

        // 중복 제거하여 유니크한 과목 ID 리스트 생성
        const allSubjectIds = [
            ...customBoard.Renrolled_list,
            ...customBoard.Rbookmark_list,
            ...customBoard.Rlistened_list,
        ];
        const uniqueSubjectIds = [...new Set(allSubjectIds)];

        if (!uniqueSubjectIds || uniqueSubjectIds.length === 0) {
            return res
                .status(200)
                .json({ message: "uniqueSubjectIds is null or empty" });
        }

        // 필터에 따른 조회 필드 설정
        let selectFields = "category_name"; // 기본적으로 category_name 필드를 가져옴
        if (filters.includes("test")) selectFields += " Rtest_list";
        if (filters.includes("pilgy")) selectFields += " Rpilgy_list";
        if (filters.includes("honey")) selectFields += " Rhoney_list";

        // 카테고리 정보를 가져옴 (필터에 따라 필드 결정)
        const categories = await CommonCategory.find({
            _id: { $in: uniqueSubjectIds },
        })
            .select(selectFields)
            .lean();

        if (!categories || categories.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        let documents = [];

        // 필터 값에 따른 카테고리 처리 및 category_name, category_type 추가
        for (const filter of filters) {
            for (const category of categories) {
                // 필터 개수에 따른 문서 개수 제한 (기본 12개)
                const limit =
                    filters.length === 1 ? 12 : filters.length === 2 ? 6 : 4;

                // 카테고리별로 문서를 가져오고, category_name 및 category_type 추가
                const docs = await getCategoryTipsDocuments(
                    filter,
                    category,
                    limit
                );

                docs.forEach((doc) => {
                    doc.category_name = category.category_name;
                    doc.category_type = filter;
                });

                documents.push(...docs);
            }
        }

        // 결과를 클라이언트로 반환
        res.json(documents);
    } catch (error) {
        console.error("Error fetching board data:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export { loadBoardWithFilter };
