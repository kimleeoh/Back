import { UserDocs } from "../../schemas/userRelated.js";
import redisHandler from "../../config/redisHandler.js";
import mainInquiry from "../../functions/mainInquiry.js";

const handleHomeTipsList = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId);

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
            return res
                .status(400)
                .json({
                    message: "Failed to retrieve user information from Redis",
                });
        }

        const redisClient = redisHandler.getRedisClient();
        const cachedPopularTipsPosts = await redisClient.get("home_popular_tips");

        if (cachedPopularTipsPosts) {
            const parsedTipsPosts = JSON.parse(cachedPopularPosts);
            if (parsedTipsPosts.length === 0) {
                return res
                    .status(200)
                    .json({ message: "No popular tips available" });
            }
            return res.status(200).json(parsedTipsPosts);
        }

        // 캐시된 데이터가 없을 경우
        return res.status(200).json({ message: "No popular tips available" });
    } catch (error) {
        console.error("Error fetching popular tips: error");
        res.status(500).send("Internal Server Error");
    }
};

// Q&A 인기 게시물 조회 핸들러
const handleHomeQnaList = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId);

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

        const userId = userInfo._id;
        const redisClient = redisHandler.getRedisClient();
        const cachedPopularQnaPosts = await redisClient.get(`home_popular_qna:${userId}`);

        if (cachedPopularQnaPosts) {
            const parsedQnaPosts = JSON.parse(cachedPopularQnaPosts);
            if (parsedQnaPosts.length === 0) {
                return res.status(200).json({ message: "No popular Q&A available" });
            }
            return res.status(200).json(parsedQnaPosts);
        }

        return res.status(200).json({ message: "No popular Q&A available" });
    } catch (error) {
        console.error("Error fetching popular Q&A posts:", error);
        res.status(500).send("Internal Server Error");
    }
};

export { handleHomeTipsList, handleHomeQnaList};
