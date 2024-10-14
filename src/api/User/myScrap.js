import mongoose from "mongoose";
import { getCategoryDocuments } from "../../functions/documnentHelpers.js";
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js";

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
        if (!userDocs || !userDocs.Rscrap_list) {
            return res.status(404).json({ message: "Scrap list not found" });
        }

        const RscrapList = userDocs.Rscrap_list; // 스크랩한 문서들의 ID 목록
        let documents = [];

        // 필터 길이에 따른 각 카테고리별 문서 수 계산
        const limitPerCategory = Math.floor(12 / filters.length); // 필터 개수에 따라 문서 수를 나눔

        // 필터 값에 따른 문서 조회 로직
        for (const filter of filters) {
            if (filter === "qna") {
                const qnaDocs = await QnaDocuments.find({
                    _id: { $in: RscrapList.Rqna_list },
                })
                    .limit(limitPerCategory)
                    .lean();
                documents.push(...qnaDocs);
            } else if (filter === "test") {
                const testDocs = await getCategoryDocuments(
                    "test",
                    RscrapList.Rtest_list,
                    limitPerCategory
                );
                documents.push(...testDocs);
            } else if (filter === "pilgy") {
                const pilgyDocs = await getCategoryDocuments(
                    "pilgy",
                    RscrapList.Rpilgy_list,
                    limitPerCategory
                );
                documents.push(...pilgyDocs);
            } else if (filter === "honey") {
                const honeyDocs = await getCategoryDocuments(
                    "honey",
                    RscrapList.Rhoney_list,
                    limitPerCategory
                );
                documents.push(...honeyDocs);
            }
        }

        // 클라이언트로 결과 반환
        res.status(200).json({
            userId: userInfo._id,
            Rdoc: userInfo.Rdoc,
            documents,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve scrap list" });
    }
};

export { handleUserScrapList };
