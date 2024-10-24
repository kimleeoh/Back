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

        const redisClient = redisHandler.getRedisClient();

        if (mainInquiry.isNotRedis()) {
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
                type: "tips", // type 추가
                docId: doc._id, // 문서 ID 추가
            }));

        // Redis에 유저별로 캐싱
        
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

