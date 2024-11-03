import redisHandler from "../../../config/redisHandler.js";
import mongoose from "mongoose";
import s3Handler from "../../../config/s3Handler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { LowestCategory } from "../../../schemas/category.js";
import { QnaDocuments } from "../../../schemas/docs.js";
import { UserDocs } from "../../../schemas/userRelated.js";

const handleDeleteQna = async (req, res) => {
    try {
        const { category_type, docid } = req.params; // 게시글의 doc_id
        console.log("docidparams:", docid, "typeof:", typeof docid);
        console.log("categoryparams:", category_type);

        // Redis에서 사용자 정보 조회
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }
        const received = await mainInquiry.read(
            ["_id", "exp", "Rdoc"],
            req.decryptedSessionId
        );

        // UserDocs에서 해당 문서 삭제
        const updateUserDocs = {};
        if (category_type === "qna") {
            updateUserDocs.$pull = { Rqna_list: docid };
        } else {
            return res.status(404).send("not found");
        };

        await UserDocs.findByIdAndUpdate(received.Rdoc, updateUserDocs); // UserDocs에서 문서 ID 제거

        // exp 값에 30 빼기
        const newExp = (received.exp || 0) - 30;

        // exp 업데이트
        await mainInquiry.write({ exp: newExp }, req.decryptedSessionId);

        let nowCategoryObject;
        let categoryIdToUse; // 기본값은 세션의 카테고리 ID

        // category_type에 맞춰 적절한 Documents 스키마에서 now_category ID 및 Rfile 가져오기
        if (category_type === "qna") {
            const qnaDoc = await QnaDocuments.findById(docid);
            if (qnaDoc) {
                // now_category_list의 마지막 요소에서 키를 category_id로 추출
                nowCategoryObject =
                    qnaDoc.now_category_list[
                        qnaDoc.now_category_list.length - 1
                    ];
                categoryIdToUse = Object.keys(nowCategoryObject)[0];
                console.log("categoryIdToUse:", categoryIdToUse);
                await s3Handler.delete(qnaDoc.img_list);
                await qnaDoc.deleteOne();
            }
        } else {
            return res.status(404).send("not found");
        };

        // 카테고리에서 해당 문서 삭제
        const updateCategory = {};
        if (category_type === "qna") {
            updateCategory.$pull = { Rqna_list: docid };
        } else {
            return res.status(404).send("not found");
        }

        await LowestCategory.findByIdAndUpdate(categoryIdToUse, updateCategory); // LowestCategory에서 문서 ID 제거

        res.status(200).send("Document and related files successfully deleted");
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { handleDeleteQna };
