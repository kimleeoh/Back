import mongoose from "mongoose";
import { getCategoryDocuments } from "../../functions/documnentHelpers.js"; // 추가
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js";

const handleUserScrapList = async (req, res) => {
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
        if (!userInfo || !userInfo._id || !userInfo.Rdoc) {
            return res
                .status(400)
                .json({
                    message: "Failed to retrieve user information from Redis",
                });
        }

        const userDocs = await UserDocs.findOne({ _id: userInfo.Rdoc }).lean();
        if (!userDocs || !userDocs.Rscrap_list) {
            return res.status(404).json({ message: "Scrap list not found" });
        }

        const RscrapList = userDocs.Rscrap_list;
        let documents = [];

        if (filters === "qna") {
            documents = await QnaDocuments.find({ _id: { $in: RscrapList } })
                .limit(12)
                .lean();
        } else if (filters === "tips") {
            const pilgyDocs = await getCategoryDocuments(
                "pilgy",
                RscrapList,
                4
            );
            const testDocs = await getCategoryDocuments("test", RscrapList, 4);
            const honeyDocs = await getCategoryDocuments(
                "honey",
                RscrapList,
                4
            );
            documents = [...pilgyDocs, ...testDocs, ...honeyDocs];
        } else if (filters === "전체") {
            const qnaDocs = await QnaDocuments.find({
                _id: { $in: RscrapList },
            })
                .limit(6)
                .lean();
            const pilgyDocs = await getCategoryDocuments(
                "pilgy",
                RscrapList,
                2
            );
            const testDocs = await getCategoryDocuments("test", RscrapList, 2);
            const honeyDocs = await getCategoryDocuments(
                "honey",
                RscrapList,
                2
            );
            documents = [...qnaDocs, ...pilgyDocs, ...testDocs, ...honeyDocs];
        }

        res.status(200).json({
            userId: userInfo._id,
            Rdoc: userInfo.Rdoc,
            documents,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve scrap list" });
    }
};

export { handleUserScrapList };
