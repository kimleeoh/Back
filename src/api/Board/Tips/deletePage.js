import redisHandler from "../../../config/redisHandler.js";
import s3Handler from "../../../config/s3Handler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { Category, LowestCategory } from "../../../schemas/category.js";
import {
    AllFiles,
    PilgyDocuments,
    TestDocuments,
    HoneyDocuments,
} from "../../../schemas/docs.js"; // 문서 스키마들 추가
import { UserDocs } from "../../../schemas/userRelated.js";

const handleDeleteTips = async (req, res) => {
    try {
        const { category_type, docid } = req.params; // 게시글의 doc_id와 category_type을 파라미터로 받음

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
        if (category_type === "pilgy") {
            updateUserDocs.$pull = { Rpilgy_list: docid };
        } else if (category_type === "honey") {
            updateUserDocs.$pull = { Rhoney_list: docid };
        } else if (category_type === "test") {
            updateUserDocs.$pull = { Rtest_list: docid };
        }

        await UserDocs.findByIdAndUpdate(received.Rdoc, updateUserDocs); // UserDocs에서 문서 ID 제거

        // exp 값에 30 빼기
        const newExp = (received.exp || 0) - 30;

        // exp 업데이트
        await mainInquiry.write({ exp: newExp }, req.decryptedSessionId);

        let categoryIdToUse; // 기본값은 세션의 카테고리 ID
        let Rfile; // AllFiles에서 삭제할 Rfile ID

        // category_type에 맞춰 적절한 Documents 스키마에서 now_category ID 및 Rfile 가져오기
        if (category_type === "pilgy") {
            const pilgyDoc = await PilgyDocuments.findById(docid);
            if (pilgyDoc) {
                categoryIdToUse = pilgyDoc.now_category;
                Rfile = pilgyDoc.Rfile;
                await pilgyDoc.deleteOne();
            }
        } else if (category_type === "honey") {
            const honeyDoc = await HoneyDocuments.findById(docid);
            if (honeyDoc) {
                categoryIdToUse = honeyDoc.now_category;
                Rfile = honeyDoc.Rfile;
                await honeyDoc.deleteOne();
            }
        } else if (category_type === "test") {
            const testDoc = await TestDocuments.findById(docid);
            if (testDoc) {
                categoryIdToUse = testDoc.now_category;
                Rfile = testDoc.Rfile;
                await testDoc.deleteOne();
            }
        }

        // // AllFiles에서 Rfile로 삭제
        // if (Rfile) {
        //     await AllFiles.deleteOne({ _id: Rfile });
        // }
        
        // AllFiles에서 Rfile에 해당하는 문서 삭제 및 S3에서 파일 삭제
        if (Rfile) {
            const allFileDoc = await AllFiles.findById(Rfile);
            if (allFileDoc) {
                // S3에서 모든 파일을 한 번에 삭제
                await s3Handler.delete(allFileDoc.file_link_list);
                await allFileDoc.deleteOne(); // AllFiles에서 삭제
            }
        }

        // 카테고리에서 해당 문서 삭제
        const updateCategory = {};
        if (category_type === "pilgy") {
            updateCategory.$pull = { Rpilgy_list: docid };
        } else if (category_type === "honey") {
            updateCategory.$pull = { Rhoney_list: docid };
        } else if (category_type === "test") {
            updateCategory.$pull = { Rtest_list: docid };
        }

        await LowestCategory.findByIdAndUpdate(categoryIdToUse, updateCategory); // LowestCategory에서 문서 ID 제거

        // 성공 응답
        res.status(200).send("Document successfully deleted from lists");
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { handleDeleteTips };
