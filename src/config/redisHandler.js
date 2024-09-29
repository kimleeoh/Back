import redis from "redis";

const redisHandler = (() => {
    let redisClient = null;

    return {
        create: (redisUrl) => {
            redisClient = redis.createClient({ url: redisUrl });
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
