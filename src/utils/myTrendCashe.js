import cron from "node-cron";
import redisHandler from "../config/redisHandler.js";
import { UserDocs } from "../schemas/userRelated.js";
import {
    PilgyDocuments,
    HoneyDocuments,
    TestDocuments,
} from "../schemas/docs.js";
import mainInquiry from "../functions/mainInquiry.js";

// 유저별 인기 게시물 캐시 갱신 함수
const updateMyPopularPostsCache = async (userId) => {
    try {
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        // 유저의 문서 리스트 가져오기
        const user = await UserDocs.findOne({ _id: userId }).lean();
        if (!user) {
            console.log("User not found.");
            return;
        }

        const { Rpilgy_list, Rhoney_list, Rtest_list } = user;
        const pilgyDocs = await PilgyDocuments.find({
            _id: { $in: Rpilgy_list },
        });
        const honeyDocs = await HoneyDocuments.find({
            _id: { $in: Rhoney_list },
        });
        const testDocs = await TestDocuments.find({ _id: { $in: Rtest_list } });

        let allDocuments = [...pilgyDocs, ...honeyDocs, ...testDocs];

        // 작성한 글이 없을 경우 캐싱을 하지 않음
        if (allDocuments.length === 0) {
            console.log("No documents found, skipping cache update.");
            return; // 캐싱 중단
        }

        // 조회수 기준으로 상위 5개의 인기 게시물 선택
        const topDocuments = allDocuments
            .sort((a, b) => b.views - a.views)
            .slice(0, 5)
            .map((doc) => ({
                title: doc.title,
                time: doc.time,
                content: doc.target,
                views: doc.views,
            }));

        // Redis에 유저별로 캐싱
        const redisClient = redisHandler.getRedisClient();
        await redisClient.set(
            `my_popular_posts:${userId}`,
            JSON.stringify(topDocuments)
        );
        await redisClient.expire(`my_popular_posts:${userId}`, 3600); // 1시간 후 만료
        console.log(`Popular posts for user ${userId} cached successfully.`);
    } catch (error) {
        console.error(
            `Error updating popular posts for user ${userId}:`,
            error
        );
    }
};

// 1시간마다 유저별로 캐시 갱신 스케줄 설정
cron.schedule("0 * * * *", () => {
    const userId = "로그인한 유저의 ID"; // 여기에 로그인한 유저의 ID를 가져와서 사용
    updateMyPopularPostsCache(userId);
    console.log("Cache updated for user:", userId); //
});
