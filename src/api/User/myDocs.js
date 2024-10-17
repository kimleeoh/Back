import mongoose from "mongoose";
import { getCategoryTipsDocuments } from "../../functions/documentHelpers.js";
import { QnaDocuments } from "../../schemas/docs.js";
import redisHandler from "../../config/redisHandler.js";
import mainInquiry from "../../functions/mainInquiry.js";
import { UserDocs } from "../../schemas/userRelated.js";
import { CommonCategory } from "../../schemas/category.js"; // CommonCategory import

const handleUserPostList = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId);

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

        // UserDocs에서 유저의 Rqna_list, Rpilgy_list, Rhoney_list, Rtest_list 가져오기
        const userDocs = await UserDocs.findOne({ _id: userInfo.Rdoc }).lean();
        if (!userDocs) {
            return res
                .status(404)
                .json({ message: "User documents not found" });
        }

        const { Rqna_list, Rpilgy_list, Rhoney_list, Rtest_list } = userDocs; // 유저가 작성한 글 목록들
        let documents = [];

        // QnA 문서 처리
        if (Rqna_list && Rqna_list.length > 0) {
            const qnaDocs = await QnaDocuments.find({
                _id: { $in: Rqna_list },
            }).lean();
            documents.push(...qnaDocs);
        }

        // 필기 문서 처리 (Pilgy)
        if (Rpilgy_list && Rpilgy_list.length > 0) {
            const pilgyDocs = await getCategoryTipsDocuments(
                "pilgy",
                { Rpilgy_list },
                12
            );

            for (const doc of pilgyDocs) {
                const categoryDoc = await CommonCategory.findOne({
                    Rpilgy_list: doc._id,
                }).lean();

                if (categoryDoc) {
                    doc.category_name = categoryDoc.category_name;
                    doc.category_type = "pilgy";
                }
            }

            documents.push(...pilgyDocs);
        }

        // Honey 문서 처리
        if (Rhoney_list && Rhoney_list.length > 0) {
            const honeyDocs = await getCategoryTipsDocuments(
                "honey",
                { Rhoney_list },
                12
            );

            for (const doc of honeyDocs) {
                const categoryDoc = await CommonCategory.findOne({
                    Rhoney_list: doc._id,
                }).lean();

                if (categoryDoc) {
                    doc.category_name = categoryDoc.category_name;
                    doc.category_type = "honey";
                }
            }

            documents.push(...honeyDocs);
        }

        // Test 문서 처리
        if (Rtest_list && Rtest_list.length > 0) {
            const testDocs = await getCategoryTipsDocuments(
                "test",
                { Rtest_list },
                12
            );

            for (const doc of testDocs) {
                const categoryDoc = await CommonCategory.findOne({
                    Rtest_list: doc._id,
                }).lean();

                if (categoryDoc) {
                    doc.category_name = categoryDoc.category_name;
                    doc.category_type = "test";
                }
            }

            documents.push(...testDocs);
        }

        // documents가 빈 배열이면 메시지와 함께 응답
        if (documents.length === 0) {
            return res.status(200).json({
                message: "No documents found.",
            });
        }

        // documents가 있을 경우
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
