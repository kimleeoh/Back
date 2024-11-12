import redis from "redis";

const redisHandler = (() => {
    let redisClient = null;

    return {
        create: async (redisUrl) => {
            try {
                redisClient = redis.createClient({ url: redisUrl });
                await redisClient.connect();
                console.log("Successfully connected to Redis in create/redishandler");
            } catch (error) {
                console.error("Failed to connect to Redis:", error);
                redisClient = null; // 연결 실패 시 클라이언트 초기화
            }
        },
        // Redis에 데이터를 저장하는 set 함수
        set: async (key, value) => {
            if (!redisClient) {
                console.error("Redis client is not initialized or connected.");
                throw new Error("Redis 클라이언트가 설정되지 않았습니다.");
            }
            try {
                await redisClient.set(key, JSON.stringify(value));
            } catch (error) {
                console.error("Redis set 실패:", error);
                throw error;
            }
        },
        getRedisClient: () => {
            if (!redisClient) {
                console.error("Redis client is not initialized.");
                throw new Error("Redis 클라이언트가 초기화되지 않았습니다.");
            }
            return redisClient;
        },
    };
})();

export default redisHandler;
