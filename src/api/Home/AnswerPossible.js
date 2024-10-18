import { UserDocs } from "../../schemas/userRelated.js";
import redisHandler from "../../config/redisHandler.js";
import mainInquiry from "../../functions/mainInquiry.js";

// Q&A 인기 게시물 조회 핸들러
const handleAnswerPossibleList = async (req, res) => {
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
        const cachedAnswerPossiblePosts = await redisClient.get(
            `answer_possible_qna:${userId}`
        );

        if (cachedAnswerPossiblePosts) {
            const parsedQnaPosts = JSON.parse(cachedAnswerPossiblePosts);
            if (parsedQnaPosts.length === 0) {
                return res
                    .status(200)
                    .json({ message: "No answer possible available" });
            }
            return res.status(200).json(parsedQnaPosts);
        }

        return res.status(200).json({ message: "No answer possible available" });
    } catch (error) {
        console.error("Error fetching answer possible posts:", error);
        res.status(500).send("Internal Server Error");
    }
};

export { handleAnswerPossibleList };
