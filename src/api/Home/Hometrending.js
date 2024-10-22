import { UserDocs } from "../../schemas/userRelated.js";
import redisHandler from "../../config/redisHandler.js";
import mainInquiry from "../../functions/mainInquiry.js";

const handleHomeTipsList = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId);

    try {
        const redisClient = redisHandler.getRedisClient();
        if (mainInquiry.isNotRedis()) {
            mainInquiry.inputRedisClient(redisClient);
        }

        const userInfo = await mainInquiry.read(
            ["_id", "Rdoc"],
            decryptedSessionId
        );

        if (!userInfo || !userInfo._id || !userInfo.Rdoc) {
            return res
                .status(400)
                .json({
                    message: "Failed to retrieve user information from Redis",
                });
        }

        const userId = userInfo._id;
        const cachedPopularTipsPosts = await redisClient.get(`home_popular_tips:${userId}`);
        console.log("Fetched Redis Key: home_popular_tips", userId);

        if (cachedPopularTipsPosts) {
            const parsedTipsPosts = JSON.parse(cachedPopularTipsPosts);
            if (parsedTipsPosts.length === 0) {
                return res
                    .status(200)
                    .json({ message: "No popular tips available1" });
            }
            console.log("Cached Tips Data: ", parsedTipsPosts);
            res.status(200).json(parsedTipsPosts);
        }
        return res
                    .status(200)
                    .json({ message: "No popular tips available1" });
    } catch (error) {
        console.error("Error fetching popular tips: error");
        res.status(500).send("Internal Server Error");
    }
};

// Q&A 인기 게시물 조회 핸들러
const handleHomeQnaList = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId);

    try {
        const redisClient = redisHandler.getRedisClient();
        if (mainInquiry.isNotRedis()) {
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

        const userId = userInfo._id;
        const cachedPopularQnaPosts = await redisClient.get(`home_popular_qna:${userId}`);
        console.log("Fetched Redis Key: home_popular_qna:", userId);
        
        if (cachedPopularQnaPosts) {
            try {
                const parsedQnaPosts = JSON.parse(cachedPopularQnaPosts);
                if (parsedQnaPosts.length === 0) {
                    return res
                        .status(200)
                        .json({ message: "No popular Q&A available" });
                }
                return res.status(200).json(parsedQnaPosts);
            } catch (error) {
                console.error("JSON parsing error:", error); // 파싱 오류 확인
                return res
                    .status(500)
                    .json({ message: "Error parsing popular Q&A data" });
            }
        }
        console.log("Cached Q&A Data: ", cachedPopularQnaPosts);

        return res.status(200).json({ message: "No popular Q&A available" });
    } catch (error) {
        console.error("Error fetching popular Q&A posts:", error);
        res.status(500).send("Internal Server Error");
    }
};

export { handleHomeTipsList, handleHomeQnaList};
