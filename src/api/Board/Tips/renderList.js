import mongoose from "mongoose";
import { CommonCategory } from "../../../schemas/category.js";
import {
    TestDocuments,
    PilgyDocuments,
    HoneyDocuments,
} from "../../../schemas/docs.js";
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { Score } from "../../../schemas/userRelated.js";

// 사용자 과목에 따른 게시물 불러오기 로직
const loadBoardWithFilter = async (req, res) => {
    try {
        const { filters } = req.body;

        // 필터 값이 없으면 오류 반환
        if (!filters || filters.length === 0) {
            return res.status(400).json({ message: "No filters selected" });
        }

        // Redis에서 사용자 정보를 가져옴
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        const decryptedSessionId = String(req.body.decryptedSessionId);

        let userInfo;
        try {
            userInfo = await mainInquiry.read(["_id"], decryptedSessionId);
        } catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve user information from Redis",
            });
        }

        // 사용자 score 정보에서 Rcategory_list 가져오기
        const userScore = await Score.findOne({ Ruser: userInfo._id })
            .select("semester_list.Rcategory_list")
            .lean();
        if (!userScore) {
            return res.status(404).json({ message: "User score not found" });
        }

        const categoryIds = userScore.semester_list.Rcategory_list;

        // CommonCategory에서 해당 과목 ID의 Rtest_list, Rpilgy_list, Rhoney_list 가져오기
        const categories = await CommonCategory.find({
            _id: { $in: categoryIds },
        })
            .select("Rtest_list Rpilgy_list Rhoney_list")
            .lean();

        if (!categories || categories.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        let documents = [];

        // 필터 값에 따른 카테고리 처리 (test, pilgy, honey를 필터로 사용)
        for (const filter of filters) {
            if (filter === "test") {
                for (const category of categories) {
                    const docsTest = await getDocumentsByCategory(
                        "test",
                        category,
                        filters.length
                    );
                    documents.push(...docsTest);
                }
            } else if (filter === "pilgy") {
                for (const category of categories) {
                    const docsPilgy = await getDocumentsByCategory(
                        "pilgy",
                        category,
                        filters.length
                    );
                    documents.push(...docsPilgy);
                }
            } else if (filter === "honey") {
                for (const category of categories) {
                    const docsHoney = await getDocumentsByCategory(
                        "honey",
                        category,
                        filters.length
                    );
                    documents.push(...docsHoney);
                }
            }
        }

        res.json(documents);
    } catch (error) {
        console.error("Error fetching board data:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 특정 카테고리에서 지정된 수만큼 문서를 가져오는 함수
const getDocumentsByCategory = async (
    categoryType,
    categoryData,
    filterCount
) => {
    let documents = [];
    let docList = [];

    // 필터에 따라 가져올 개수 결정
    let limit;
    if (filterCount === 1) {
        limit = 12; // 필터가 1개일 경우 12개씩
    } else if (filterCount === 2) {
        limit = 6; // 필터가 2개일 경우 6개씩
    } else if (filterCount === 3 || filterCount === 0) {
        limit = 4; // 필터가 0개 또는 3개일 경우 4개씩
    }

    // 카테고리별로 게시물 가져오기
    if (categoryType === "test") {
        docList = categoryData.Rtest_list.slice(0, limit);
        documents = await TestDocuments.find({ _id: { $in: docList } })
            .select(
                "_id title preview_img content Ruser time views likes point"
            )
            .populate({ path: "Ruser", model: User, select: "name" })
            .lean();
    } else if (categoryType === "pilgy") {
        docList = categoryData.Rpilgy_list.slice(0, limit);
        documents = await PilgyDocuments.find({ _id: { $in: docList } })
            .select(
                "_id title preview_img content Ruser time views likes point"
            )
            .populate({ path: "Ruser", model: User, select: "name" })
            .lean();
    } else if (categoryType === "honey") {
        docList = categoryData.Rhoney_list.slice(0, limit);
        documents = await HoneyDocuments.find({ _id: { $in: docList } })
            .select(
                "_id title preview_img content Ruser time views likes point"
            )
            .populate({ path: "Ruser", model: User, select: "name" })
            .lean();
    }

    return documents;
};

export { loadBoardWithFilter };
