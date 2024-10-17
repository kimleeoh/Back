import { UserDocs } from "../../../schemas/userRelated.js";
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js";

// 인기 게시물 요청 핸들러 (캐시된 데이터 반환)
const handleMytrendingList = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId); // 사용자 세션 ID 복호화

    try {
        // Redis 클라이언트 설정
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

        // Redis에서 인기 게시물 목록 가져오기
        const redisClient = redisHandler.getRedisClient();
        const cachedPopularPosts = await redisClient.get("my_popular_posts");

        if (cachedPopularPosts) {
            return res.status(200).json(JSON.parse(cachedPopularPosts));
        }

        // 캐시된 데이터가 없으면 처리 (대안적으로 에러 메시지)
        return res
            .status(500)
            .json({ message: "No cached my popular posts found" });
    } catch (error) {
        console.error("Error fetching popular posts:", error);
        res.status(500).send("Internal Server Error");
    }
};

export { handleMytrendingList };
