import cron from "node-cron";
import { UserDocs } from "../schemas/userRelated.js";
import {
    updateHomePopularQnaCache,
    updateAnswerPossibleCache,
    updateHomePopularTipsCache,
} from "./homeTrendCashe.js";
import { updateMyPopularPostsCache } from "./myTrendCashe.js";

// 1시간마다 Q&A 캐시 갱신 스케줄 설정
cron.schedule("0 * * * *", async () => {
    try {
        const allUsers = await UserDocs.find().lean(); // 모든 유저 가져오기
        for (const user of allUsers) {
            const userId = user._id; // 각 유저의 ID
            console.log(`Updating Q&A cache for user: ${userId}`);
            await updateHomePopularQnaCache(userId);
        }
    } catch (error) {
        console.error("Error updating Q&A cache:", error);
    }
});

// 1시간마다 답변 가능한 질문 캐시 갱신 스케줄 설정
cron.schedule("0 * * * *", async () => {
    try {
        const allUsers = await UserDocs.find().lean(); // 모든 유저 가져오기
        for (const user of allUsers) {
            const userId = user._id; // 각 유저의 ID
            console.log(`Updating answer possible cache for user: ${userId}`);
            await updateAnswerPossibleCache(userId);
        }
    } catch (error) {
        console.error("Error updating answer possible cache:", error);
    }
});

// 1시간마다 Tips 캐시 갱신 스케줄 설정
cron.schedule("0 * * * *", async () => {
    try {
        const allUsers = await UserDocs.find().lean(); // 모든 유저 가져오기
        for (const user of allUsers) {
            const userId = user._id; // 각 유저의 ID
            console.log(`Updating Tips cache for user: ${userId}`);
            await updateHomePopularTipsCache(userId);
        }
    } catch (error) {
        console.error("Error updating Tips cache:", error);
    }
});

// 1시간마다 유저별로 My Popular Posts 캐시 갱신 스케줄 설정
cron.schedule("0 * * * *", async () => {
    try {
        const allUsers = await UserDocs.find().lean();  // 모든 유저 가져오기
        for (const user of allUsers) {
            const userId = user._id;  // 각 유저의 ID
            console.log(`Updating My Popular Posts cache for user: ${userId}`);
            await updateMyPopularPostsCache(userId);
        }
    } catch (error) {
        console.error("Error updating My Popular Posts cache:", error);
    }
});