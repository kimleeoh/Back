import redis from "redis";

const redisHandler = (() => {
    let redisClient = null;

    return {
        create: (redisUrl) => {
            redisClient = redis.createClient({ url: redisUrl });
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
        connect: () => {
            redisClient
                .connect()
                .then(() => console.log("Successfully connected to redis"))
                .catch((e) => console.error(e));
        },
        getRedisClient: () => redisClient,
    };
})();

export default redisHandler;
