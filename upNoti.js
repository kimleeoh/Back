import { Modal } from "./src/schemas/notify";
import mongoose from "mongoose";
import { User } from "./src/schemas/user";
import redisHandler from "./src/config/redisHandler";
import util from 'util';

// Connect to Redis

redisHandler.create(process.env.REDIS_URL);
redisHandler.connect();
const client = redisHandler.getRedisClient();

// Promisify Redis commands for easier use with async/await
const getAsync = util.promisify(client.get).bind(client);
const keysAsync = util.promisify(client.keys).bind(client);

async function searchAndFilterRedisData() {
    try {
        // Retrieve all keys matching a pattern
        const keys = await keysAsync('*'); // Adjust the pattern as needed

        // Retrieve and filter data
        const filteredData = [];
        for (const key of keys) {
            if(!key.includes("sess") && !key.includes("")) {}
            const value = await getAsync(key);
            // Apply your custom logic to filter the data
            if (value.includes('your_search_criteria')) {
                filteredData.push({ key, value });
            }
        }

        console.log('Filtered Data:', filteredData);
        return filteredData;
    } catch (error) {
        console.error('Error searching and filtering Redis data:', error);
    } finally {
        client.quit();
    }
}
const ID = new mongoose.Types.ObjectId();
await Modal.create({
    _id: ID,
    types: "잠시 시스템 업데이트로 인해 5초간 작동이 멈춥니다.",
    reward: "이용자분들의 너른 양해 부탁드립니다. 감사합니다.",
    point: 0
});
