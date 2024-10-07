import mongoose from "mongoose";
import { CommonCategory } from "../../../schemas/category.js";
import {
    TestDocuments,
    PilgyDocuments,
    HoneyDocuments,
} from "../../../schemas/docs.js";
import mainInquiry from "../../../functions/mainInquiry.js"; // mainInquiry 사용
import { Score } from "../../../schemas/userRelated.js"; // Score schema 추가

// 사용자 과목에 따른 게시물 불러오기 로직
const loadBoardWithFilter = async (req, res) => {
    try {
        const { filters } = req.body;

        // 필터 값이 없으면 오류 반환
        if (!filters || filters.length === 0) {
            return res.status(400).json({ message: "No filters selected" });
        }

        // 1. mainInquiry의 read를 통해 사용자 score 정보 조회
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        // Redis에서 사용자 정보를 가져옴 (decryptedSessionId로 사용자 식별)
        const userInfo = await mainInquiry.read(
            ["_id"],
            req.body.decryptedSessionId
        );

        // 2. 사용자 score 정보에서 Rcategory_list 가져오기
        const userScore = await Score.findOne({ Ruser: userInfo._id })
            .select("semester_list.Rcategory_list")
            .lean();
        if (!userScore) {
            return res.status(404).json({ message: "User score not found" });
        }

        const categoryIds = userScore.semester_list.Rcategory_list; // Rcategory_list (과목 ID)

        // 3. CommonCategory에서 해당 과목 ID의 Rpilgy_list, Rtest_list, Rhoney_list 가져오기
        const categories = await CommonCategory.find({
            _id: { $in: categoryIds },
        })
            .select("Rtest_list Rpilgy_list Rhoney_list")
            .lean();

        if (!categories || categories.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        let documents = [];

        // 필터링된 과목 목록에 따라 문서를 가져오는 로직
        for (const filter of filters) {
            const category = categories.find((cat) => cat._id.equals(filter));

            if (!category) continue;

            // 과목의 3가지 카테고리에서 게시물을 필터에 맞게 가져옴
            const docsTest = await getDocumentsByCategory(
                "test",
                category,
                filters.length
            );
            const docsPilgy = await getDocumentsByCategory(
                "pilgy",
                category,
                filters.length
            );
            const docsHoney = await getDocumentsByCategory(
                "honey",
                category,
                filters.length
            );

            // 결과 배열에 각 카테고리별 문서를 추가
            documents.push(...docsTest, ...docsPilgy, ...docsHoney);
        }

        // 결과 반환
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
        if (categoryData.Rtest_list) {
            docList = categoryData.Rtest_list.slice(0, limit);
            documents = await TestDocuments.find({ _id: { $in: docList } })
                .select(
                    "_id title preview_img content Ruser time views likes point"
                )
                .populate({ path: "Ruser", model: User, select: "name" })
                .lean();
        }
    } else if (categoryType === "pilgy") {
        if (categoryData.Rpilgy_list) {
            docList = categoryData.Rpilgy_list.slice(0, limit);
            documents = await PilgyDocuments.find({ _id: { $in: docList } })
                .select(
                    "_id title preview_img content Ruser time views likes point"
                )
                .populate({ path: "Ruser", model: User, select: "name" })
                .lean();
        }
    } else if (categoryType === "honey") {
        if (categoryData.Rhoney_list) {
            docList = categoryData.Rhoney_list.slice(0, limit);
            documents = await HoneyDocuments.find({ _id: { $in: docList } })
                .select(
                    "_id title preview_img content Ruser time views likes point"
                )
                .populate({ path: "Ruser", model: User, select: "name" })
                .lean();
        }
    }

    return documents;
};

export { loadBoardWithFilter };
