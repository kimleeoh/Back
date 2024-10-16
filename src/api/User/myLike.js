import mongoose from "mongoose";
import { getCategoryTipsDocuments } from "../../functions/documnentHelpers.js";
import { QnaDocuments } from "../../schemas/docs.js";
import redisHandler from "../../config/redisHandler.js";
import mainInquiry from "../../functions/mainInquiry.js";
import { UserDocs } from "../../schemas/userRelated.js";
import { CommonCategory } from "../../schemas/category.js"; // CommonCategory import

const handleUserLikeList = async (req, res) => {
    const decryptedSessionId = String(req.decryptedSessionId);
    const { filters } = req.body;

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

        // UserDocs에서 유저의 Rlike_list 가져오기
        const userDocs = await UserDocs.findOne({ _id: userInfo.Rdoc }).lean();
        if (!userDocs || !userDocs.RmyLike_list) {
            return res.status(404).json({ message: "Like list not found" });
        }

        const RmyLikeList = userDocs.RmyLike_list; // 스크랩한 문서들의 ID 목록
        let documents = [];

        // 필터 값에 따른 문서 조회 로직
        for (const filter of filters) {
            let categoryType;
            let likeList;
            let listField;

            if (filter === "qna") {
                const qnaDocs = await QnaDocuments.find({
                    _id: { $in: RmyLikeList.Rqna_list },
                })
                    .limit(12)
                    .lean();
                documents.push(...qnaDocs);
            } else if (filter === "test") {
                categoryType = "test";
                likeList = RmyLikeList.Rtest_list;
                listField = "Rtest_list";
            } else if (filter === "pilgy") {
                categoryType = "pilgy";
                likeList = RmyLikeList.Rpilgy_list;
                listField = "Rpilgy_list";
            } else if (filter === "honey") {
                categoryType = "honey";
                likeList = RmyLikeList.Rhoney_list;
                listField = "Rhoney_list";
            }

            // test, pilgy, honey 로직에 공통 적용
            if (likeList) {
                const docsFromCategory = await getCategoryTipsDocuments(
                    categoryType,
                    { [listField]: likeList }, // RmyLike_list에서 리스트 가져오기
                    12
                );

                for (const doc of docsFromCategory) {
                    // CommonCategory에서 category_name 가져오기
                    const categoryDoc = await CommonCategory.findOne({
                        [listField]: doc._id, // 해당 문서 ID로 CommonCategory 조회
                    }).lean();

                    // category_name 추가 및 category_type 설정
                    if (categoryDoc) {
                        doc.category_name = categoryDoc.category_name;
                        doc.category_type = categoryType;
                    } else {
                        doc.category_name = "Unknown Category"; // 만약 category를 못 찾았을 경우
                        doc.category_type = categoryType;
                    }
                }

                // documents 배열에 추가
                documents.push(...docsFromCategory);
            }
        }

        // documents가 빈 배열이면 메시지와 함께 응답
        if (documents.length === 0) {
            return res.status(200).json({
                message: "No documents found.",
            });
        }

        // documents가 있을 경우
        res.status(200).json({
            userId: userInfo._id,
            Rdoc: userInfo.Rdoc,
            documents,
        });
    } catch (error) {
        console.error("Error fetch like list:", error);
        res.status(500).json({ message: "Failed to retrieve like list" });
    }
};

export { handleUserLikeList };
