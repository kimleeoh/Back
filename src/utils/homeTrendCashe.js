import cron from "node-cron";
import redisHandler from "../config/redisHandler.js";
import { UserDocs, CustomBoardView } from "../schemas/userRelated.js";
import { CommonCategory } from "../schemas/category.js"; // commonCategory 조회용
import {
    PilgyDocuments,
    HoneyDocuments,
    TestDocuments,
} from "../schemas/docs.js";
import mainInquiry from "../functions/mainInquiry.js";

// 유저의 커스텀 보드에서 Renrolled_list에서 랜덤으로 카테고리 ID 추출하는 함수
const getRandomCategoryIdFromCustomBoard = async (Rcustom_brd) => {
    // 1. UserDocs에서 Rcustom_brd로 CustomBoardView 조회
    const customBoardView = await CustomBoardView.findOne({ _id: Rcustom_brd });

    // 2. 해당 CustomBoardView에서 Renrolled_list 추출
    if (!customBoardView || customBoardView.Renrolled_list.length === 0) {
        console.log("No enrolled list found for custom board.");
        return null;
    }

    // 3. Renrolled_list에서 랜덤으로 하나 선택
    const randomIndex = Math.floor(
        Math.random() * customBoardView.Renrolled_list.length
    );
    const randomEnrolledCategoryId =
        customBoardView.Renrolled_list[randomIndex];

    return randomEnrolledCategoryId;
};

// 캐시 갱신 함수 (1시간마다)
const updateHomePopularPostsCache = async (userId) => {
    try {
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        // 로그인한 유저의 문서 리스트 가져오기
        const user = await UserDocs.findOne({ _id: userId }).lean();
        if (!user) {
            console.log("User not found.");
            return;
        }

        const { Rcustom_brd } = user;

        // 1. Rcustom_brd에서 랜덤 카테고리 ID 가져오기
        const randomCategoryId = await getRandomCategoryIdFromCustomBoard(
            Rcustom_brd
        );
        if (!randomCategoryId) {
            console.log("No random category found.");
            return; // 카테고리를 못 찾으면 캐싱 중단
        }

        // 2. 랜덤 카테고리 ID로 CommonCategory에서 조회
        const commonCategory = await CommonCategory.findOne({
            _id: randomCategoryId,
        });
        if (!commonCategory) {
            console.log(`No common category found for ID: ${randomCategoryId}`);
            return; // 카테고리를 못 찾으면 캐싱 중단
        }

        // 3. CommonCategory에서 Rpilgy_list, Rtest_list, Rhoney_list의 doc ID 추출
        const { Rpilgy_list, Rhoney_list, Rtest_list } = commonCategory;

        // 4. 해당 ID로 Pilgy, Honey, Test 문서 조회
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

        // Redis에 캐싱
        const redisClient = redisHandler.getRedisClient();
        await redisClient.set(
            `home_popular_tips:${userId}`,
            JSON.stringify(topDocuments)
        );
        console.log("Home popular tips cached successfully.");
    } catch (error) {
        console.error("Error updating home popular tips cache:", error);
    }
};

// 1시간마다 캐시 갱신 스케줄 설정
cron.schedule("0 * * * *", () => {
    const userId = "로그인한 유저의 ID"; // 여기서 로그인한 유저의 ID를 가져와야 함
    updateHomePopularPostsCache(userId);
});
