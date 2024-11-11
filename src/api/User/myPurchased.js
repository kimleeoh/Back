import mainInquiry from "../../functions/mainInquiry.js";
import redisHandler from "../../config/redisHandler.js";
import { UserDocs } from "../../schemas/userRelated.js";
import { getCategoryTipsDocuments } from "../../functions/documentHelpers.js";
import { Category } from "../../schemas/category.js"; // Category 스키마 추가

const handlePurchased = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId);
    const { filters } = req.body; // filters 배열 값 받기

    try {
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        // Redis에서 유저 정보 가져오기
        const userInfo = await mainInquiry.read(
            ["_id", "Rdoc"],
            decryptedSessionId
        );
        if (!userInfo || !userInfo._id || !userInfo.Rdoc) {
            return res.status(400).json({
                message: "Failed to retrieve user information from Redis",
            });
        }

        // UserDocs에서 유저의 Rpurchased_list 가져오기
        const userDocs = await UserDocs.findOne({ _id: userInfo.Rdoc })
            .select("Rpurchased_list")
            .lean();
        if (!userDocs) {
            return res
                .status(404)
                .json({ message: "User documents not found" });
        }

        const renderDocs = userDocs.Rpurchased_list; // 전체 Rpurchased_list 가져오기

        let docs = [];

        // filters 배열의 각 카테고리에 대해 문서 조회
        for (const filter of filters) {
            let categoryDocs = [];
            let now_category;

            if (filter === "pilgy") {
                const pilgyResult = await getCategoryTipsDocuments("pilgy", {
                    Rpilgy_list: renderDocs,
                });
                categoryDocs = pilgyResult.docs;
                now_category = pilgyResult.now_category;
            } else if (filter === "honey") {
                const honeyResult = await getCategoryTipsDocuments("honey", {
                    Rhoney_list: renderDocs,
                });
                categoryDocs = honeyResult.docs;
                now_category = honeyResult.now_category;
            } else if (filter === "test") {
                const testResult = await getCategoryTipsDocuments("test", {
                    Rtest_list: renderDocs,
                });
                categoryDocs = testResult.docs;
                now_category = testResult.now_category;
            }

            // 각 문서에 category_type 및 category_name 추가
            const categoryData = await Category.findOne({ _id: now_category })
                .select("category_name")
                .lean();
            const categoryName = categoryData
                ? categoryData.category_name
                : null;

            const categorizedDocs = categoryDocs.map((doc) => ({
                ...doc,
                category_type: filter,
                category_name: categoryName,
            }));

            docs = docs.concat(categorizedDocs); // 전체 docs 배열에 추가
        }

        // docs가 비어 있지 않을 때만 정렬 실행
        if (docs.length > 0) {
            docs.sort((a, b) => new Date(b.time) - new Date(a.time));
        }

        console.log("P result", docs);

        res.status(200).send({ docs });
    } catch (error) {
        console.error("Error fetching purchased documents:", error);
        res.status(500).json({ message: "Failed to retrieve like list" });
    }
};

export { handlePurchased };
