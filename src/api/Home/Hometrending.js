import { UserDocs } from "../../schemas/userRelated.js";
import redisHandler from "../../config/redisHandler.js";
import mainInquiry from "../../functions/mainInquiry.js";

const handleHomeDataList = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId);

    try {
        const redisClient = redisHandler.getRedisClient();
        if (mainInquiry.isNotRedis()) {
            mainInquiry.inputRedisClient(redisClient);
        }

        const userInfo = await mainInquiry.read(
            ["_id", "Rdoc"],
            req.decryptedSessionId
        );

        if (!userInfo || !userInfo._id || !userInfo.Rdoc) {
            return res.status(400).json({
                message: "Failed to retrieve user information from Redis",
            });
        }

        const userId = userInfo._id;

        // Fetch Tips Data
        const cachedPopularTipsPosts = await redisClient.get(`home_popular_tips:${userId}`);
        console.log("Fetched Redis Key: home_popular_tips", userId);

        let parsedTipsPosts = [];
        if (cachedPopularTipsPosts) {
            try {
                parsedTipsPosts = JSON.parse(cachedPopularTipsPosts);
                console.log("Cached Tips Data: ", parsedTipsPosts);
            } catch (error) {
                console.error("JSON parsing error for tips:", error);
                return res.status(500).json({ message: "Error parsing popular tips data" });
            }
        }

        // Fetch Q&A Data
        const cachedPopularQnaPosts = await redisClient.get(`home_popular_qna:${userId}`);
        console.log("Fetched Redis Key: home_popular_qna:", userId);

        let parsedQnaPosts = [];
        if (cachedPopularQnaPosts) {
            try {
                parsedQnaPosts = JSON.parse(cachedPopularQnaPosts);
                console.log("Cached Q&A Data: ", parsedQnaPosts);
            } catch (error) {
                console.error("JSON parsing error for Q&A:", error);
                return res.status(500).json({ message: "Error parsing popular Q&A data" });
            }
        }

        // Combine and return data
        return res.status(200).json({ parsedQnaPosts, parsedTipsPosts });

    } catch (error) {
        console.error("Error fetching popular posts:", error);
        res.status(500).send("Internal Server Error");
    }
};

export { handleHomeDataList};
