import mongoose from "mongoose";
import { CommonCategory } from "../../../schemas/category.js";
import { getCategoryTipsDocuments } from  "../../../functions/documentHelpers.js" // 모듈에서 함수 가져오기
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { CustomBoardView } from "../../../schemas/userRelated.js";

// 필터를 통해 게시판 데이터 로드
const loadBoardWithFilter = async (req, res) => {
    try {
        let { filters, lastDocTime } = req.body;  // 마지막 문서의 time을 함께 받음

        if (!filters || filters.length === 0) {
            filters = ["test", "pilgy", "honey"];
        }

        const decryptedSessionId = String(req.decryptedSessionId);

        const paramList = ["_id", "Rcustom_brd"];
        let userInfo;
        try {
            userInfo = await mainInquiry.read(paramList, decryptedSessionId);
        } catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve user information from Redis",
            });
        }

        let customBoard;
        try {
            customBoard = await CustomBoardView.findOne({
                _id: userInfo.Rcustom_brd,
            })
                .select("Renrolled_list Rbookmark_list Rlistened_list")
                .lean();
            if (!customBoard) {
                return res.status(404).json({ message: "Custom board not found" });
            }
        } catch (error) {
            return res.status(500).json({ message: "Internal server error" });
        }

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

        let selectFields = "category_name";
        if (filters.includes("test")) selectFields += " Rtest_list";
        if (filters.includes("pilgy")) selectFields += " Rpilgy_list";
        if (filters.includes("honey")) selectFields += " Rhoney_list";

        const categories = await CommonCategory.find({
            _id: { $in: uniqueSubjectIds },
        })
            .select(selectFields)
            .lean();

        if (!categories || categories.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        let documents = [];

        for (const filter of filters) {
            for (const category of categories) {
                const limit = filters.length === 1 ? 12 : filters.length === 2 ? 6 : 4;

                // 마지막 문서의 시간 또는 _id 기준으로 더 이전 문서들을 가져옴
                const docs = await getCategoryTipsDocuments(
                    filter,
                    category,
                    limit,
                    lastDocTime  // 마지막 문서의 시간 기준으로 추가된 인자
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
