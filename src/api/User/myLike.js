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
        // Redis 설정 및 유저 정보 조회 로직
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        const userInfo = await mainInquiry.read(
            ["_id", "Rdoc"],
            decryptedSessionId
        );

        if (!userInfo || !userInfo._id || !userInfo.Rdoc) {
            return res.status(400).json({
                message: "Failed to retrieve user information from Redis",
            });
        }

        const userDocs = await UserDocs.findOne({ _id: userInfo.Rdoc }).lean();
        if (!userDocs || !userDocs.RmyLike_list) {
            return res.status(404).json({ message: "Like list not found" });
        }

        const RmyLikeList = userDocs.RmyLike_list;
        let documents = [];

        // QnA 및 Tips 문서 가져오기 로직
        if (filters.includes("qna") && RmyLikeList.Rqna_list.length > 0) {
            const qnaDocs = await QnaDocuments.find({
                _id: { $in: RmyLikeList.Rqna_list },
            }).lean();
            documents.push(...qnaDocs);
        }

        const tipsFilters = filters.filter((f) => f !== "qna");
        const numTipsFilters = tipsFilters.length;
        const numDocsPerFilter = numTipsFilters === 1 ? 12 : 6;

        for (const filter of tipsFilters) {
            let likeList;
            if (filter === "test") likeList = RmyLikeList.Rtest_list;
            else if (filter === "pilgy") likeList = RmyLikeList.Rpilgy_list;
            else if (filter === "honey") likeList = RmyLikeList.Rhoney_list;

            if (likeList && likeList.length > 0) {
                const docsFromCategory = await getCategoryTipsDocuments(
                    filter,
                    { [`R${filter}_list`]: likeList },
                    numDocsPerFilter
                );
                documents.push(...docsFromCategory);
            }
        }

        // 게시물이 더 이상 없는 경우 메시지 반환
        if (documents.length === 0) {
            return res.status(200).json({ message: "No more documents" });
        }

        documents.sort((a, b) => new Date(b.time) - new Date(a.time));

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
