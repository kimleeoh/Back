import mongoose from "mongoose";
import { getCategoryTipsDocuments } from "../../functions/documnentHelpers.js";
import { QnaDocuments } from "../../schemas/docs.js";
import redisHandler from "../../config/redisHandler.js";
import mainInquiry from "../../functions/mainInquiry.js";
import {UserDocs} from "../../schemas/userRelated.js";

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

        console.log("User info:", userInfo);

        // UserDocs에서 유저의 Rscrap_list 가져오기
        const userDocs = await UserDocs.findOne({ _id: userInfo.Rdoc }).lean();
        if (!userDocs || !userDocs.RmyScrap_list) {
            console.log("UserDocs not found or Rscrap_list missing.");
            return res.status(404).json({ message: "Scrap list not found" });
        }

        console.log("UserDocs found:", userDocs);

        const RmyScrapList = userDocs.RmyScrap_list; // 스크랩한 문서들의 ID 목록
        let documents = [];

        // 필터 길이에 따른 각 카테고리별 문서 수 계산
        const limitPerCategory = Math.floor(12 / filters.length); // 필터 개수에 따라 문서 수를 나눔

        // 필터 값에 따른 문서 조회 로직
        for (const filter of filters) {
            if (filter === "qna") {
                const qnaDocs = await QnaDocuments.find({
                    _id: { $in: RmyScrapList.Rqna_list },
                })
                    .limit(limitPerCategory)
                    .lean();
                documents.push(...qnaDocs);
            } else if (filter === "test") {
                const testDocs = await getCategoryTipsDocuments(
                    "test",
                    { Rtest_list: RmyScrapList.Rtest_list }, // RmyScrap_list에서 리스트 가져오기
                    limitPerCategory
                );
                documents.push(...testDocs);
            } else if (filter === "pilgy") {
                const pilgyDocs = await getCategoryTipsDocuments(
                    "pilgy",
                    { Rpilgy_list: RmyScrapList.Rpilgy_list }, // RmyScrap_list에서 리스트 가져오기
                    limitPerCategory
                );
                documents.push(...pilgyDocs);
            } else if (filter === "honey") {
                const honeyDocs = await getCategoryTipsDocuments(
                    "honey",
                    { Rhoney_list: RmyScrapList.Rhoney_list }, // RmyScrap_list에서 리스트 가져오기
                    limitPerCategory
                );
                documents.push(...honeyDocs);
            }
        }

        console.log("Documents found:", documents);

        // documents가 빈 배열이면 메시지와 함께 응답
        if (documents.length === 0) {
            return res.status(200).json({
                message: "No documents found.", // 빈 배열을 반환하지 않음
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

