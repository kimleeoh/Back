import { User } from "../schemas/user.js";
//반드시 router 내부에서 이 함수가 작동할 수 있도록 할 것.

const mainInquiry = (() => {
    let redisClient = null;
    const stringFields = ["hakbu", "intro", "profile_img"];
    return {
        isNotRedis: () => {
            return redisClient == null;
        },

        inputRedisClient: (cli) => {
            redisClient = cli;
        },

        read: async (paramList, redisId) => {
            // redisId가 문자열로 전달되도록 보장
            if (typeof redisId !== "string") {
                redisId = String(redisId);
            }
            const stringfiedJSON = await redisClient.get(redisId);
            // Redis에서 데이터가 없을 때 예외 처리 추가
            if (!stringfiedJSON) {
                throw new Error(
                    "No data found in Redis for the given session ID"
                );
            }
            const userInfo = JSON.parse(stringfiedJSON);
            // userInfo가 유효한지 확인 (예외 처리 추가)
            if (!userInfo || !userInfo._id) {
                throw new Error("Invalid user data found in Redis");
            }

            let returnParam = Object.create(null);
            // Add multiple fields to returnParam
            paramList.forEach((param) => {
                returnParam[param] = userInfo[param];
            });
            return returnParam;
        },
        write: async (paramObject, redisId) => {
            let stringChunk = {};
            let listChunk = {};
            let numChunk = {};
            let updateObject = {};

            Object.keys(paramObject).forEach((key) => {
                if (stringFields.includes(key)) {
                    stringChunk[key] = paramObject[key];
                } else if (key == "Rbadge_list") {
                    listChunk[key] = paramObject[key];
                } else {
                    numChunk[key] = paramObject[key];
                }
            });

            if (Object.keys(stringChunk).length > 0) {
                updateObject.$set = stringChunk;
            }
            if (Object.keys(listChunk).length > 0) {
                updateObject.$push = listChunk;
            }
            if (Object.keys(numChunk).length > 0) {
                updateObject.$inc = numChunk;
            }

            if (Object.keys(updateObject).length > 0) {
                const result = await User.updateOne(
                    { _id: userInfo._id },
                    updateObject,
                    { new: true }
                );
            }
            await redisClient.set(redisId, JSON.stringify(result), "EX", 3600);
        },
    };
})();

export default mainInquiry;
