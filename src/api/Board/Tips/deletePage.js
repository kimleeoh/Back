import redisHandler from "../../../config/redisHandler.js";
import s3Handler from "../../../config/s3Handler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { Category, LowestCategory } from "../../../schemas/category.js";
import {
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
        const userdoc = await UserDocs.findById(received.Rdoc);

        // category_type에 따라 적절한 리스트에서 문서 삭제
        if (category_type === "pigly") {
            userdoc.Rpilgy_list = userdoc.Rpilgy_list.filter(
                (item) => item !== docid
            );
        } else if (category_type === "honey") {
            userdoc.Rhoney_list = userdoc.Rhoney_list.filter(
                (item) => item !== docid
            );
        } else if (category_type === "test") {
            userdoc.Rtest_list = userdoc.Rtest_list.filter(
                (item) => item !== docid
            );
        }

        await userdoc.save(); // UserDocs 저장

        // exp 값에 30 빼기
        const newExp = (received.exp || 0) - 30;

        // exp 업데이트
        await mainInquiry.write({ exp: newExp }, req.decryptedSessionId);

        let categoryIdToUse = req.session.currentDocs.category_id; // 기본값은 세션의 카테고리 ID

        // category_type에 맞춰 적절한 Documents 스키마에서 now_category ID 가져오기
        if (category_type === "pilgy") {
            const pilgyDoc = await PilgyDocuments.findById(docid);
            if (pilgyDoc) {
                categoryIdToUse = pilgyDoc.now_category;
            }
        } else if (category_type === "honey") {
            const honeyDoc = await HoneyDocuments.findById(docid);
            if (honeyDoc) {
                categoryIdToUse = honeyDoc.now_category;
            }
        } else if (category_type === "test") {
            const testDoc = await TestDocuments.findById(docid);
            if (testDoc) {
                categoryIdToUse = testDoc.now_category;
            }
        }

        // 카테고리에서 해당 문서 삭제
        const cat = await LowestCategory.findById(categoryIdToUse);

        if (category_type === "pilgy") {
            cat.Rpilgy_list = cat.Rpilgy_list.filter((item) => item !== docid);
        } else if (category_type === "honey") {
            cat.Rhoney_list = cat.Rhoney_list.filter((item) => item !== docid);
        } else if (category_type === "test") {
            cat.Rtest_list = cat.Rtest_list.filter((item) => item !== docid);
        }

        await cat.save(); // 카테고리 저장

        // 성공 응답
        res.status(200).send("Document successfully deleted from lists");
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { handleDeleteTips };
