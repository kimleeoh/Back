import mongoose from "mongoose";
import { getCategoryTipsDocuments } from "../../functions/documentHelpers.js";
import { QnaDocuments } from "../../schemas/docs.js";
import redisHandler from "../../config/redisHandler.js";
import mainInquiry from "../../functions/mainInquiry.js";
import { UserDocs } from "../../schemas/userRelated.js";
import { CommonCategory } from "../../schemas/category.js"; // CommonCategory import

const handleUserScrapList = async (req, res) => {
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

        // UserDocs에서 유저의 Rscrap_list 가져오기
        const userDocs = await UserDocs.findOne({ _id: userInfo.Rdoc }).lean();
        if (!userDocs || !userDocs.RmyScrap_list) {
            return res.status(404).json({ message: "Scrap list not found" });
        }

        const RmyScrapList = userDocs.RmyScrap_list; // 스크랩한 문서들의 ID 목록
        let documents = [];

        // QnA 문서 처리 (항상 최대 12개)
        if (filters.includes("qna") && RmyScrapList.Rqna_list.length > 0) {
            const qnaDocs = await QnaDocuments.find({
                _id: { $in: RmyScrapList.Rqna_list },
            })
                .limit(12)
                .lean();
            documents.push(...qnaDocs);
        }

        // Tips 관련 필터 처리 (필터 개수에 따라 반환할 문서 수 결정)
        const tipsFilters = filters.filter((f) => f !== "qna");
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

        // 필기(Tips) 문서 처리 (Test, Pilgy, Honey)
        for (const filter of tipsFilters) {
            let categoryType;
            let scrapList;
            let listField;

            if (filter === "test") {
                categoryType = "test";
                scrapList = RmyScrapList.Rtest_list;
                listField = "Rtest_list";
            } else if (filter === "pilgy") {
                categoryType = "pilgy";
                scrapList = RmyScrapList.Rpilgy_list;
                listField = "Rpilgy_list";
            } else if (filter === "honey") {
                categoryType = "honey";
                scrapList = RmyScrapList.Rhoney_list;
                listField = "Rhoney_list";
            }

            // 필기 관련 문서 조회
            if (scrapList && scrapList.length > 0) {
                const docsFromCategory = await getCategoryTipsDocuments(
                    categoryType,
                    { [listField]: scrapList },
                    numDocsPerFilter // 필터 개수에 따른 문서 수 적용
                );

                for (const doc of docsFromCategory) {
                    // CommonCategory에서 category_name 가져오기
                    const categoryDoc = await CommonCategory.findOne({
                        [listField]: doc._id,
                    }).lean();

                    // category_name 추가 및 category_type 설정
                    if (categoryDoc) {
                        doc.category_name = categoryDoc.category_name;
                        doc.category_type = categoryType;
                    } else {
                        doc.category_name = "Unknown Category"; // 카테고리 못 찾을 경우
                        doc.category_type = categoryType;
                    }
                }

                // documents 배열에 추가
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
        console.error("Error fetching scrap list:", error);
        res.status(500).json({ message: "Failed to retrieve scrap list" });
    }
};

export { handleUserScrapList };
