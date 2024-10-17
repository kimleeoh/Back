import mongoose from "mongoose";
import { getCategoryTipsDocuments } from "../../functions/documentHelpers.js";
import { QnaDocuments } from "../../schemas/docs.js";
import redisHandler from "../../config/redisHandler.js";
import mainInquiry from "../../functions/mainInquiry.js";
import { UserDocs } from "../../schemas/userRelated.js";
import { CommonCategory } from "../../schemas/category.js"; // CommonCategory import

const handleUserPostList = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId);
    const { filters } = req.body; // filters 값 받기

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

        // QnA 문서 처리 (항상 최대 12개)
        if (filters.includes("qna") && Rqna_list && Rqna_list.length > 0) {
            const qnaDocs = await QnaDocuments.find({
                _id: { $in: Rqna_list },
            })
                .limit(12)
                .lean();
            documents.push(...qnaDocs);
        }

        // Tips 관련 필터 처리
        const tipsFilters = filters.filter((f) => f !== "qna"); // QnA를 제외한 필터
        const numTipsFilters = tipsFilters.length;

        // 필터당 반환할 문서 개수 계산
        let numDocsPerFilter;
        if (numTipsFilters === 3) {
            numDocsPerFilter = 4;
        } else if (numTipsFilters === 2) {
            numDocsPerFilter = 6;
        } else if (numTipsFilters === 1) {
            numDocsPerFilter = 12;
        }

        // Pilgy, Honey, Test 문서 처리 (필터별 개수 제한 적용)
        for (const filter of tipsFilters) {
            let categoryType, documentList;

            if (filter === "pilgy") {
                categoryType = "pilgy";
                documentList = Rpilgy_list;
            } else if (filter === "honey") {
                categoryType = "honey";
                documentList = Rhoney_list;
            } else if (filter === "test") {
                categoryType = "test";
                documentList = Rtest_list;
            }

            // 각 필터에 해당하는 문서 가져오기
            if (documentList && documentList.length > 0) {
                const docsFromCategory = await getCategoryTipsDocuments(
                    categoryType,
                    { [`R${categoryType}_list`]: documentList },
                    numDocsPerFilter // 계산된 문서 수 만큼 가져옴
                );

                for (const doc of docsFromCategory) {
                    const categoryDoc = await CommonCategory.findOne({
                        [`R${categoryType}_list`]: doc._id,
                    }).lean();

                    if (categoryDoc) {
                        doc.category_name = categoryDoc.category_name;
                        doc.category_type = categoryType;
                    }
                }

                documents.push(...docsFromCategory);
            }
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
