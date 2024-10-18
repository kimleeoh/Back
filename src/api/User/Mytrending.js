import { UserDocs } from "../../schemas/userRelated.js";
import redisHandler from "../../config/redisHandler.js";
import mainInquiry from "../../functions/mainInquiry.js";

// 인기 게시물 요청 핸들러 (캐시된 데이터 반환)
// Mytrending.js (프론트엔드 요청 핸들러)
const handleMytrendingList = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId);

    try {
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        // 유저 정보를 Redis에서 가져오기
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

        const userId = userInfo._id; // 유저 ID를 가져옴
        const redisClient = redisHandler.getRedisClient();

        // 유저별 캐시된 인기 게시물 가져오기
        const cachedMyPopularPosts = await redisClient.get(
            `my_popular_posts:${userId}`
        );

        if (cachedMyPopularPosts) {
            const parsedPosts = JSON.parse(cachedMyPopularPosts);
            if (parsedPosts.length === 0) {
                return res
                    .status(200)
                    .json({ message: "No popular posts available1" });
            }
            return res.status(200).json(parsedPosts);
        }

        // 캐시된 데이터가 없을 경우
        return res.status(200).json({ message: "No popular posts available2" });
    } catch (error) {
        console.error("Error fetching popular posts:", error);
        res.status(500).send("Internal Server Error");
    }
};

export { handleMytrendingList };
