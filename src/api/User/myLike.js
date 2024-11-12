import mongoose from "mongoose";
import { getCategoryTipsDocuments } from "../../functions/documentHelpers.js";
import { QnaDocuments } from "../../schemas/docs.js";
import redisHandler from "../../config/redisHandler.js";
import mainInquiry from "../../functions/mainInquiry.js";
import { UserDocs } from "../../schemas/userRelated.js";
import { CommonCategory } from "../../schemas/category.js"; // CommonCategory import

const handleUserLikeList = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId);
    const { filters } = req.body;

    try {
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        // Redis에서 유저 정보 가져오기
        const userInfo = await mainInquiry.read(
            ["_id", "Rdoc"],
            decryptedSessionId
        );
        if (!userInfo || !userInfo._id || !userInfo.Rdoc) {
            return res.status(400).json({
                message: "Failed to retrieve user information from Redis",
            });
        }

        // UserDocs에서 유저의 Rlike_list 가져오기
        const userDocs = await UserDocs.findOne({ _id: userInfo.Rdoc }).lean();
        if (!userDocs || !userDocs.RmyLike_list) {
            return res.status(404).json({ message: "Scrap list not found" });
        }

        const RmyLikeList = userDocs.RmyLike_list; // 스크랩한 문서들의 ID 목록
        let documents = [];

        // QnA 문서 처리 (개수 제한 없이 모든 문서 불러오기)
        if (filters.includes("qna") && RmyLikeList.Rqna_list.length > 0) {
            const qnaDocs = await QnaDocuments.find({
                _id: { $in: RmyLikeList.Rqna_list },
            }).lean();
            documents.push(...qnaDocs);
        }

        // Tips 관련 필터 처리
        const tipsFilters = filters.filter((f) => f !== "qna");

        for (const filter of tipsFilters) {
            let categoryType;
            let likeList;
            let listField;

            if (filter === "test") {
                categoryType = "test";
                likeList = RmyLikeList.Rtest_list;
                listField = "Rtest_list";
            } else if (filter === "pilgy") {
                categoryType = "pilgy";
                likeList = RmyLikeList.Rpilgy_list;
                listField = "Rpilgy_list";
            } else if (filter === "honey") {
                categoryType = "honey";
                likeList = RmyLikeList.Rhoney_list;
                listField = "Rhoney_list";
            }

            // 필기 관련 문서 조회
            if (likeList && likeList.length > 0) {
                const docsFromCategory = await getCategoryTipsDocuments(
                    categoryType,
                    { [listField]: likeList }
                );

                // docsFromCategory가 배열 형식이므로 그대로 documents에 추가
                documents.push(...docsFromCategory);
            }
        }

        // documents가 빈 배열이면 메시지와 함께 응답
        if (documents.length === 0) {
            return res.status(200).json({
                message: "No documents found.",
            });
        }

        // 모든 문서를 최신순으로 정렬
        documents.sort((a, b) => new Date(b.time) - new Date(a.time));

        // 최종 응답
        res.status(200).json({
            userId: userInfo._id,
            Rdoc: userInfo.Rdoc,
            documents,
        });
    } catch (error) {
        console.error("Error fetching like list:", error);
        res.status(500).json({ message: "Failed to retrieve like list" });
    }
};

export { handleUserLikeList };
