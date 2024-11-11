import mongoose from "mongoose";
import { getCategoryTipsDocuments } from "../../functions/documentHelpers.js";
import { QnaDocuments } from "../../schemas/docs.js";
import redisHandler from "../../config/redisHandler.js";
import mainInquiry from "../../functions/mainInquiry.js";
import { UserDocs } from "../../schemas/userRelated.js";
import { CommonCategory } from "../../schemas/category.js"; // CommonCategory import

const handleUserPostList = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId);
    const { filters } = req.body;

    try {
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
        if (!userDocs) {
            return res
                .status(404)
                .json({ message: "User documents not found" });
        }

        const { Rqna_list, Rpilgy_list, Rhoney_list, Rtest_list } = userDocs;
        let documents = [];

        // QnA 문서 처리
        if (filters.includes("qna") && Rqna_list && Rqna_list.length > 0) {
            const qnaDocs = await QnaDocuments.find({
                _id: { $in: Rqna_list },
            }).lean();
            documents.push(...qnaDocs);
        }

        const tipsFilters = filters.filter((f) => f !== "qna");
        const numTipsFilters = tipsFilters.length;
        const numDocsPerFilter = numTipsFilters === 1 ? 12 : 6;

        // 필기(Tips) 문서 처리
        for (const filter of tipsFilters) {
            let documentList;
            if (filter === "pilgy") documentList = Rpilgy_list;
            else if (filter === "honey") documentList = Rhoney_list;
            else if (filter === "test") documentList = Rtest_list;

            if (documentList && documentList.length > 0) {
                const docsFromCategory = await getCategoryTipsDocuments(
                    filter,
                    { [`R${filter}_list`]: documentList },
                    numDocsPerFilter
                );

                documents.push(...docsFromCategory);
            }
        }

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
        console.error("Error fetching user post list:", error);
        res.status(500).json({ message: "Failed to retrieve user post list" });
    }
};

export { handleUserPostList };
