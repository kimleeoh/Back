import cron from "node-cron";
import redisHandler from "../config/redisHandler.js";
import { UserDocs, CustomBoardView } from "../schemas/userRelated.js";
import { CommonCategory } from "../schemas/category.js"; // commonCategory 조회용
import {
    PilgyDocuments,
    HoneyDocuments,
    TestDocuments,
    QnaDocuments,
} from "../schemas/docs.js";
import mainInquiry from "../functions/mainInquiry.js";

// 유저의 커스텀 보드에서 Renrolled_list에서 랜덤으로 카테고리 ID 추출하는 함수
const getRandomEnrolledIdFromCustomBoard = async (Rcustom_brd) => {
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

// 유저의 커스텀 보드에서 Renrolled_list에서 랜덤으로 카테고리 ID 추출하는 함수
const getRandomListenedIdFromCustomBoard = async (Rcustom_brd) => {
    // 1. UserDocs에서 Rcustom_brd로 CustomBoardView 조회
    const customBoardView = await CustomBoardView.findOne({ _id: Rcustom_brd });

    // 2. 해당 CustomBoardView에서 Rlistened_list 추출
    if (!customBoardView || customBoardView.Rlistened_list.length === 0) {
        console.log("No enrolled list found for custom board.");
        return null;
    }

    // 3. Rlistened_list에서 랜덤으로 하나 선택
    const randomIndex = Math.floor(
        Math.random() * customBoardView.Rlistened_list.length
    );
    const randomListenedCategoryId =
        customBoardView.Rlistened_list[randomIndex];

    return randomListenedCategoryId;
};

// 캐시 갱신 함수 (1시간마다)
const updateHomePopularTipsCache = async (userId) => {
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
        const randomCategoryId = await getRandomEnrolledIdFromCustomBoard(
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
        await redisClient.expire(`home_popular_tips:${userId}`, 3600); // 1시간 후 만료
        console.log("Home popular tips cached successfully.");
    } catch (error) {
        console.error("Error updating home popular tips cache:", error);
    }
};

// Q&A 인기 게시물 캐시 갱신 함수
const updateHomePopularQnaCache = async (userId) => {
    try {
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        const user = await UserDocs.findOne({ _id: userId }).lean();
        if (!user) {
            console.log("User not found.");
            return;
        }

        const { Rcustom_brd } = user;

        const randomCategoryId = await getRandomEnrolledIdFromCustomBoard(
            Rcustom_brd
        );
        if (!randomCategoryId) {
            console.log("No random category found.");
            return;
        }

        const commonCategory = await CommonCategory.findOne({
            _id: randomCategoryId,
        });
        if (!commonCategory) {
            console.log(`No common category found for ID: ${randomCategoryId}`);
            return;
        }

        // Rqna_list에서 Q&A 문서 조회
        const { Rqna_list } = commonCategory;
        const qnaDocs = await QnaDocuments.find({ _id: { $in: Rqna_list } });

        if (qnaDocs.length === 0) {
            console.log("No Q&A documents found, skipping cache update.");
            return;
        }

        // 조회수 기준으로 상위 5개 선택
        const topQnaDocuments = qnaDocs
            .sort((a, b) => b.views - a.views)
            .slice(0, 5)
            .map((doc) => ({
                title: doc.title,
                time: doc.time,
                content: doc.content,
                views: doc.views,
            }));
        console.log("Data to cache in Redis: ", topQnaDocuments);

        // Redis에 캐싱
        const redisClient = redisHandler.getRedisClient();
        await redisClient.set(
            `home_popular_qna:${userId}`,
            JSON.stringify(topQnaDocuments)
        );
        await redisClient.expire(`home_popular_qna:${userId}`, 3600); // 1시간 후 만료
        console.log("Home popular Q&A cached successfully.");
    } catch (error) {
        console.error("Error updating home popular Q&A cache:", error);
    }
};

// 답변가능한거 캐시 갱신 함수
const updateAnswerPossibleCache = async (userId) => {
    try {
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        const user = await UserDocs.findOne({ _id: userId }).lean();
        if (!user) {
            console.log("User not found.");
            return;
        }

        const { Rcustom_brd } = user;

        const randomCategoryId = await getRandomListenedIdFromCustomBoard(
            Rcustom_brd
        );
        if (!randomCategoryId) {
            console.log("No random category found.");
            return;
        }

        const commonCategory = await CommonCategory.findOne({
            _id: randomCategoryId,
        });
        if (!commonCategory) {
            console.log(`No common category found for ID: ${randomCategoryId}`);
            return;
        }

        // Rqna_list에서 Q&A 문서 조회
        const { Rqna_list } = commonCategory;
        const recentQnaDocs = await QnaDocuments.find({
            _id: { $in: Rqna_list },
        })
            .sort({ time: -1 }) // 최신순으로 정렬
            .limit(5); // 상위 5개만 가져오기

        if (recentQnaDocs.length === 0) {
            console.log(
                "No recent Q&A documents found, skipping cache update."
            );
            return;
        }

        // 캐시할 데이터에 type과 docId 포함
        const topQnaDocuments = recentQnaDocs.map((doc) => ({
            title: doc.title,
            time: doc.time,
            content: doc.content,
            views: doc.views,
            type: "qna", // type 추가
            docId: doc._id, // 문서 ID 추가
        }));

        // Redis에 캐싱
        const redisClient = redisHandler.getRedisClient();
        await redisClient.set(
            `answer_possible_qna:${userId}`,
            JSON.stringify(topQnaDocuments)
        );
        await redisClient.expire(`answer_possible_qna:${userId}`, 3600); // 1시간 후 만료
        console.log("Answer Possible Q&A cached successfully.");
    } catch (error) {
        console.error("Error updating answer possible Q&A cache:", error);
    }
};

// 1시간마다 Q&A 캐시 갱신 스케줄 설정
cron.schedule("0 * * * *", () => {
    const userId = "로그인한 유저의 ID";
    updateHomePopularQnaCache(userId);
});

// 1시간마다 답변가능질문 캐시 갱신 스케줄 설정
cron.schedule("0 * * * *", () => {
    const userId = "로그인한 유저의 ID";
    updateAnswerPossibleCache(userId);
});


// 1시간마다 캐시 갱신 스케줄 설정
cron.schedule("0 * * * *", () => {
    const userId = "로그인한 유저의 ID"; // 여기서 로그인한 유저의 ID를 가져와야 함
    updateHomePopularTipsCache(userId);
});

