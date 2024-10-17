import cron from "node-cron";
import redisHandler from "../config/redisHandler.js";
import { UserDocs } from "../schemas/userRelated.js";
import {
    PilgyDocuments,
    HoneyDocuments,
    TestDocuments,
} from "../schemas/docs.js";
import mainInquiry from "../functions/mainInquiry.js";

// 인기 게시물 캐시 갱신 함수 (상위 5개의 조회수 높은 게시물만)
// trending.js (캐시 갱신 함수)
const updateMyPopularPostsCache = async () => {
    try {
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        // 유저의 문서 리스트 가져오기
        const users = await UserDocs.find().lean();
        let allDocuments = [];

        for (const user of users) {
            const { Rpilgy_list, Rhoney_list, Rtest_list } = user;
            const pilgyDocs = await PilgyDocuments.find({ _id: { $in: Rpilgy_list } });
            const honeyDocs = await HoneyDocuments.find({ _id: { $in: Rhoney_list } });
            const testDocs = await TestDocuments.find({ _id: { $in: Rtest_list } });

            allDocuments = [...allDocuments, ...pilgyDocs, ...honeyDocs, ...testDocs];
        }

        // 작성한 글이 없을 경우 캐싱을 하지 않음
        if (allDocuments.length === 0) {
            console.log("No documents found, skipping cache update.");
            return;  // 캐싱 중단
        }

        const topDocuments = allDocuments
            .sort((a, b) => b.views - a.views)
            .slice(0, 5)
            .map(doc => ({
                title: doc.title,
                time: doc.time,
                content: doc.target,
                views: doc.views,
            }));

        const redisClient = redisHandler.getRedisClient();
        await redisClient.set("my_popular_posts", JSON.stringify(topDocuments));
        console.log("Popular posts cached successfully.");
    } catch (error) {
        console.error("Error updating my popular posts cache:", error);
    }
};

// 1시간마다 캐시 갱신 스케줄 설정
cron.schedule("0 * * * *", updateMyPopularPostsCache);
