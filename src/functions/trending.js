import cron from "node-cron";
import redisHandler from "../config/redisHandler.js";
import { UserDocs } from "../schemas/userRelated.js";
import {
    PilgyDocuments,
    HoneyDocuments,
    TestDocuments,
} from "../schemas/docs.js";
import mainInquiry from "./mainInquiry.js";

// 인기 게시물 캐시 갱신 함수 (상위 5개의 조회수 높은 게시물만)
const updateMyPopularPostsCache = async () => {
    try {
        // Redis 클라이언트 설정
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        // 모든 유저의 UserDocs 가져오기
        const users = await UserDocs.find().lean();
        let allDocuments = [];

        for (const user of users) {
            const { Rpilgy_list, Rhoney_list, Rtest_list } = user;

            // 각 리스트에서 Document들의 조회수를 가져옴
            const pilgyDocs = await PilgyDocuments.find({
                _id: { $in: Rpilgy_list },
            });
            const honeyDocs = await HoneyDocuments.find({
                _id: { $in: Rhoney_list },
            });
            const testDocs = await TestDocuments.find({
                _id: { $in: Rtest_list },
            });

            // 모든 문서를 하나의 배열에 합침
            allDocuments = [
                ...allDocuments,
                ...pilgyDocs,
                ...honeyDocs,
                ...testDocs,
            ];
        }

        // 조회수 기준으로 상위 5개의 게시물 선택
        const topDocuments = allDocuments
            .sort((a, b) => b.views - a.views) // 조회수 기준으로 내림차순 정렬
            .slice(0, 5) // 상위 5개만 선택

            .map((doc) => ({
                title: doc.title,
                time: doc.time,
                target: doc.target,
                views: doc.views,
            }));

        // Redis에 캐싱 (1시간 동안 유지)
        const redisClient = redisHandler.getRedisClient();
        await redisClient.set("my_popular_posts", JSON.stringify(topDocuments));
    } catch (error) {
        console.error("Error updating my popular posts cache:", error);
    }
};

// 1시간마다 캐시 갱신 스케줄 설정
cron.schedule("0 * * * *", updateMyPopularPostsCache);
