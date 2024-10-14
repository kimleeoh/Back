import mongoose from "mongoose";
import { CommonCategory } from "../../../schemas/category.js";
import {
    TestDocuments,
    PilgyDocuments,
    HoneyDocuments,
} from "../../../schemas/docs.js";
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { User } from "../../../schemas/user.js";
import { CustomBoardView } from "../../../schemas/userRelated.js";

const handleUserScrapList = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId);
    const { filters } = req.body; // 필터는 프론트에서 받음

    try {
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        // 1. Redis에서 유저 정보 읽기 (_id와 Rdoc 가져오기)
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
        console.log("userInfo:", userInfo);
        const userId = userInfo._id;
        const Rdoc = userInfo.Rdoc;

        // 2. Rdoc 값을 이용해서 UserDocs에서 유저의 문서 찾기
        const userDocs = await UserDocs.findOne({ _id: Rdoc }).lean();
        if (!userDocs || !userDocs.Rscrap_list) {
            return res.status(404).json({ message: "Scrap list not found" });
        }

        const RscrapList = userDocs.Rscrap_list; // 스크랩한 문서의 ID 목록
        console.log("Scrap list:", RscrapList);

        let documents = [];

        // 3. 필터링에 따른 효율적인 문서 조회
        if (filters === "qna") {
            // QnA 문서에서 12개 조회
            documents = await QnaDocuments.find({ _id: { $in: RscrapList } })
                .limit(12) // 12개 고정
                .lean();
        } else if (filters === "tips") {
            // Tips: Pilgy, Test, Honey에서 각각 4개씩 (총 12개)
            const pilgyDocs = await PilgyDocuments.find({
                _id: { $in: RscrapList },
            })
                .limit(4)
                .lean();
            const testDocs = await TestDocuments.find({
                _id: { $in: RscrapList },
            })
                .limit(4)
                .lean();
            const honeyDocs = await HoneyDocuments.find({
                _id: { $in: RscrapList },
            })
                .limit(4)
                .lean();

            documents = [...pilgyDocs, ...testDocs, ...honeyDocs];
        } else if (filters === "전체") {
            // 전체: QnA 6개, Pilgy 2개, Test 2개, Honey 2개 (총 12개)
            const qnaDocs = await QnaDocuments.find({
                _id: { $in: RscrapList },
            })
                .limit(6)
                .lean();
            const pilgyDocs = await PilgyDocuments.find({
                _id: { $in: RscrapList },
            })
                .limit(2)
                .lean();
            const testDocs = await TestDocuments.find({
                _id: { $in: RscrapList },
            })
                .limit(2)
                .lean();
            const honeyDocs = await HoneyDocuments.find({
                _id: { $in: RscrapList },
            })
                .limit(2)
                .lean();

            documents = [...qnaDocs, ...pilgyDocs, ...testDocs, ...honeyDocs];
        } else {
            return res.status(400).json({ message: "Invalid filter" });
        }

        // 4. 조회된 문서들 반환
        res.status(200).json({
            userId,
            Rdoc,
            documents,
        });
    } catch (error) {
        console.error("Error fetching scrap list:", error);
        res.status(500).json({ message: "Failed to retrieve scrap list" });
    }
};

export { handleUserScrapList };