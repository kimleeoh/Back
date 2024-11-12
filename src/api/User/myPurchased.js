import mainInquiry from "../../functions/mainInquiry.js";
import redisHandler from "../../config/redisHandler.js";
import { UserDocs } from "../../schemas/userRelated.js";
import { getCategoryTipsDocuments } from "../../functions/documentHelpers.js";
import { Category } from "../../schemas/category.js"; // Category 스키마 추가

const handlePurchased = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId);
    const { filters } = req.body;

    try {
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        const userInfo = await mainInquiry.read(
            ["_id", "Rdoc"],
            decryptedSessionId
        );
        if (!userInfo || !userInfo.Rdoc) {
            return res.status(400).json({
                message: "Failed to retrieve user information from Redis",
            });
        }

        const userDocs = await UserDocs.findOne({ _id: userInfo.Rdoc })
            .select("Rpurchased_list")
            .lean();
        if (!userDocs) {
            return res
                .status(404)
                .json({ message: "User documents not found" });
        }

        const renderDocs = userDocs.Rpurchased_list;
        console.log("구매id", renderDocs);
        let docs = [];

        // 각 필터에 따른 문서 검색 및 docs에 추가
        for (const filter of filters) {
            let categoryDocs = [];

            if (filter === "pilgy") {
                categoryDocs =
                    (await getCategoryTipsDocuments("pilgy", {
                        Rpilgy_list: renderDocs,
                    })) || []; // 결과가 없으면 빈 배열로 초기화
            } else if (filter === "honey") {
                categoryDocs =
                    (await getCategoryTipsDocuments("honey", {
                        Rhoney_list: renderDocs,
                    })) || []; // 결과가 없으면 빈 배열로 초기화
            } else if (filter === "test") {
                categoryDocs =
                    (await getCategoryTipsDocuments("test", {
                        Rtest_list: renderDocs,
                    })) || []; // 결과가 없으면 빈 배열로 초기화
            }

            docs = docs.concat(categoryDocs);
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
