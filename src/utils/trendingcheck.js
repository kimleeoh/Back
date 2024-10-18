import redisHandler from "../config/redisHandler.js";


// 세션에 테스트 데이터를 넣는 함수
const addTestDataToSession = async (userId) => {
    try {
        redisHandler.create(); 
        await redisHandler.connect();
        
        const redisClient = redisHandler.getRedisClient();
        if (!redisClient) {
            throw new Error("Redis 클라이언트가 null 상태입니다.");
        }

        // 테스트용 인기 Q&A 데이터
        const popularAnswerPossibleData = [
            {
                title: "JavaScript Promises",
                time: "2024-09-30T12:00:00.000Z",
                content: "How to use Promises in JavaScript",
                views: 50,
            },
            {
                title: "MongoDB Indexing",
                time: "2024-10-01T15:00:00.000Z",
                content: "Guide to MongoDB indexing",
                views: 40,
            },
            {
                title: "동현아",
                time: "2024-09-30T12:00:00.000Z",
                content: "How to use Promises in JavaScript",
                views: 30,
            },
            {
                title: "개발",
                time: "2024-09-30T12:00:00.000Z",
                content: "How to use Promises in JavaScript",
                views: 20,
            },
            {
                title: "파이팅",
                time: "2024-09-30T12:00:00.000Z",
                content: "How to use Promises in JavaScript",
                views: 10,
            },
        ];

        // JSON으로 변환한 후 Redis 세션에 저장
        await redisClient.set(
            `my_popular_posts:${userId}`,
            JSON.stringify(popularAnswerPossibleData)
        );
        console.log(`Test data added to Redis for user: ${userId}`);
    } catch (error) {
        console.error("Error adding test data to session:", error);
    }
};

// 테스트용 데이터 추가 실행
const userId = "6703e0aff4e66d047e84e65e"; // 유저 ID를 직접 넣어줍니다.
addTestDataToSession(userId);

const checkTestDataInSession = async (userId) => {
    try {
        const redisClient = redisHandler.getRedisClient();
        const cachedData = await redisClient.get(`home_popular_qna:${userId}`);

        if (cachedData) {
            console.log("Cached Q&A Data:", JSON.parse(cachedData));
        } else {
            console.log("No data found in session for user:", userId);
        }
    } catch (error) {
        console.error("Error checking data in session:", error);
    }
};

// 세션에서 데이터 확인
checkTestDataInSession(userId);